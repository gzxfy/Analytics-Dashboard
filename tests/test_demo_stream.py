"""Controller and API tests use fake writers: no database or real events required."""
import asyncio
from unittest.mock import AsyncMock

import httpx
import pytest
from fastapi import FastAPI

from backend.api.demo_stream import router
from backend.services.demo_stream import DemoStream


@pytest.mark.anyio
async def test_start_rejects_duplicate_and_stop_cancels_write():
    entered = asyncio.Event()
    cancelled = asyncio.Event()

    async def blocked_write(_payload):
        entered.set()
        try:
            await asyncio.Event().wait()
        finally:
            cancelled.set()

    stream = DemoStream(blocked_write, enabled=True)
    assert stream.start(5)["running"]
    await asyncio.wait_for(entered.wait(), 1)
    with pytest.raises(RuntimeError):
        stream.start(10)
    assert not (await stream.stop())["running"]
    assert cancelled.is_set()
    assert stream.generated == 0


@pytest.mark.anyio
async def test_counts_committed_writes_and_stops_at_deadline():
    payloads = []

    async def write(payload):
        payloads.append(payload)
        # Force the deadline to expire after one successful write.
        stream.deadline = 0

    stream = DemoStream(write, enabled=True)
    stream.start(20)
    await asyncio.wait_for(stream.task, 1)
    assert not stream.status()["running"]
    assert stream.generated == 1
    assert payloads[0]["topic"].startswith("demo:")


@pytest.mark.anyio
async def test_failed_write_stops_without_leaking_details():
    writer = AsyncMock(side_effect=RuntimeError("private driver details"))
    stream = DemoStream(writer, enabled=True)
    stream.start(5)
    await asyncio.wait_for(stream.task, 1)
    assert stream.generated == 0
    assert not stream.status()["running"]
    assert "private" not in stream.status()["error"]


@pytest.mark.anyio
async def test_api_validation_duplicate_and_disabled():
    test_app = FastAPI()
    test_app.include_router(router)
    stream = DemoStream(AsyncMock(), enabled=False)
    test_app.state.demo_stream = stream
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=test_app), base_url="http://test") as client:
        assert (await client.post("/demo-stream", json={"target_rate": 5})).status_code == 403
        for value in (0, 21, 1.5, "5", True):
            assert (await client.post("/demo-stream", json={"target_rate": value})).status_code == 422
        stream.enabled = True
        try:
            response = await client.post("/demo-stream", json={"target_rate": 5})
            assert response.status_code == 202
            assert response.json()["remaining_seconds"] == 60
            assert (await client.post("/demo-stream", json={"target_rate": 5})).status_code == 409
            assert (await client.get("/demo-stream")).json()["running"]
            assert not (await client.delete("/demo-stream")).json()["running"]
            # A stopped run can be started again, with its own counter.
            assert (await client.post("/demo-stream", json={"target_rate": 1})).status_code == 202
        finally:
            await stream.stop()
