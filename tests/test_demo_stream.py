"""Controller and API tests use fake writers: no database or real events required."""
import asyncio
from unittest.mock import AsyncMock

import httpx
import pytest
from fastapi import FastAPI

from backend.api.demo_stream import router
from backend.services.demo_stream import DemoStream
from generator.generator import platforms, topics, sentiments


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
    assert payloads[0]["platform"] in platforms
    assert payloads[0]["topic"] in topics
    assert payloads[0]["sentiment"] in sentiments


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
        assert (await client.patch("/demo-stream", json={"target_rate": 50})).status_code == 403
        for value in (0, 101, 1.5, "5", True):
            assert (await client.post("/demo-stream", json={"target_rate": value})).status_code == 422
        stream.enabled = True
        assert (await client.patch("/demo-stream", json={"target_rate": 100})).status_code == 409
        try:
            response = await client.post("/demo-stream", json={"target_rate": 5})
            assert response.status_code == 202
            assert response.json()["remaining_seconds"] == 60
            assert (await client.post("/demo-stream", json={"target_rate": 5})).status_code == 409
            assert (await client.get("/demo-stream")).json()["running"]
            original_task = stream.task
            original_deadline = stream.deadline
            for rate in (100, 1, 50):
                update = await client.patch("/demo-stream", json={"target_rate": rate})
                assert update.status_code == 200
                assert update.json()["target_rate"] == rate
                assert stream.task is original_task
                assert stream.deadline == original_deadline
            for rate in (0, 101, 2.5, "10", True):
                assert (await client.patch("/demo-stream", json={"target_rate": rate})).status_code == 422
            assert not (await client.delete("/demo-stream")).json()["running"]
            # A stopped run can be started again, with its own counter.
            assert (await client.post("/demo-stream", json={"target_rate": 1})).status_code == 202
        finally:
            await stream.stop()


@pytest.mark.anyio
async def test_rate_increase_wakes_sleeping_stream_without_resetting_count():
    first_event = asyncio.Event()
    second_event = asyncio.Event()
    release_second_write = asyncio.Event()
    calls = 0

    async def writer(_payload):
        nonlocal calls
        calls += 1
        if calls == 1:
            first_event.set()
        else:
            second_event.set()
            await release_second_write.wait()

    stream = DemoStream(writer, enabled=True)
    stream.start(1)
    try:
        await asyncio.wait_for(first_event.wait(), 1)
        # Let the first write finish and the one-second pacing wait begin.
        await asyncio.sleep(0.05)
        assert stream.generated == 1
        stream.update_rate(100)
        await asyncio.wait_for(second_event.wait(), 0.5)
        assert stream.generated == 1
        stream.update_rate(1)
        assert stream.status()["target_rate"] == 1
    finally:
        await stream.stop()


@pytest.mark.anyio
async def test_disabled_and_expired_streams_cannot_change_rate():
    stream = DemoStream(AsyncMock())
    with pytest.raises(PermissionError):
        stream.update_rate(50)
    stream.enabled = True
    stream.start(100)
    try:
        stream.deadline = 0
        with pytest.raises(RuntimeError):
            stream.update_rate(50)
    finally:
        await stream.stop()


@pytest.mark.anyio
async def test_rate_decrease_slows_existing_stream():
    first_write_started = asyncio.Event()
    release_first_write = asyncio.Event()
    second_write_started = asyncio.Event()
    calls = 0

    async def writer(_payload):
        nonlocal calls
        calls += 1
        if calls == 1:
            first_write_started.set()
            await release_first_write.wait()
        else:
            second_write_started.set()

    stream = DemoStream(writer, enabled=True)
    stream.start(100)
    try:
        await asyncio.wait_for(first_write_started.wait(), 1)
        stream.update_rate(1)
        release_first_write.set()
        # At the old rate another write would arrive after about 10ms.
        with pytest.raises(asyncio.TimeoutError):
            await asyncio.wait_for(second_write_started.wait(), 0.1)
        assert stream.generated == 1
    finally:
        await stream.stop()
