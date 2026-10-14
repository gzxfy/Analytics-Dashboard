import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from backend.api.analytics import get_events_per_second
import backend.services.analytics as analytics_services
from backend.app.main import app
from backend.models.db import SessionFactory, get_session
from backend.models.models import Event

from fastapi import FastAPI
from fastapi.testclient import TestClient

import backend.api.analytics as analytics_api


def test_websocket_sends_initial_snapshot(monkeypatch):
    expected = {
        "total_events": 3,
        "events_per_second": 0,
        "topic_counts": {"python": 3},
        "platform_counts": {"reddit": 3},
        "sentiment_counts": {"positive": 3},
    }

    async def fake_load_analytics_snapshot():
        return expected.copy()

    monkeypatch.setattr(
        analytics_api,
        "load_analytics_snapshot",
        fake_load_analytics_snapshot,
    )
    monkeypatch.setattr(analytics_api, "connected_clients", set())

    test_app = FastAPI()
    test_app.include_router(analytics_api.router)

    with TestClient(test_app) as client:
        with client.websocket_connect("/ws/analytics") as websocket:
            received = websocket.receive_json()
            assert received == expected

        assert analytics_api.connected_clients == set()

# This will test using fake clients.
from unittest.mock import AsyncMock
import pytest
@pytest.mark.anyio
async def test_broadcast_sends_snapshot_to_every_client(monkeypatch):
    expected = {
        "total_events": 3,
        "events_per_second": 0,
        "topic_counts": {"python": 3},
        "platform_counts": {"reddit": 3},
        "sentiment_counts": {"positive": 3},
    }

    loader = AsyncMock(return_value=expected)
    first_client = AsyncMock()
    second_client = AsyncMock()
    third_client = AsyncMock()

    
    monkeypatch.setattr(analytics_api, "load_analytics_snapshot", loader)
    monkeypatch.setattr(analytics_api, "connected_clients", {first_client, second_client, third_client})


    await analytics_api.broadcast_analytics()

    # ensure it was called once and that all clients received the snapshot
    loader.assert_awaited_once()
    first_client.send_json.assert_awaited_once_with(expected)
    second_client.send_json.assert_awaited_once_with(expected)
    third_client.send_json.assert_awaited_once_with(expected)


# this will test if one client fails during the broadcast
@pytest.mark.anyio
async def test_broadcast_removes_failed_client(monkeypatch):
    expected = {
        "total_events": 3,
        "events_per_second": 0,
        "topic_counts": {"python": 3},
        "platform_counts": {"reddit": 3},
        "sentiment_counts": {"positive": 3},
    }

    loader = AsyncMock(return_value=expected)
    failed_client = AsyncMock()
    healthy_client = AsyncMock()

    failed_client.send_json.side_effect = OSError("Connection lost")

    monkeypatch.setattr(
        analytics_api,
        "load_analytics_snapshot",
        loader,
    )
    monkeypatch.setattr(
        analytics_api,
        "connected_clients",
        {failed_client, healthy_client},
    )

    await analytics_api.broadcast_analytics()

    # Assert that the healthy client received the snapshot.
    healthy_client.send_json.assert_awaited_once_with(expected)

    # Assert that the failed client was removed.
    assert failed_client not in analytics_api.connected_clients

    # Assert that the healthy client remains connected.
    assert healthy_client in analytics_api.connected_clients


# zero connected clients
@pytest.mark.anyio
async def test_broadcast_with_no_connected_clients(monkeypatch):
    expected = {
        "total_events": 0,
        "events_per_second": 0,
        "topic_counts": {},
        "platform_counts": {},
        "sentiment_counts": {},
    }

    loader = AsyncMock()    

    monkeypatch.setattr(
        analytics_api,
        "load_analytics_snapshot",
        loader,
    )
    monkeypatch.setattr(
        analytics_api,
        "connected_clients",
        set(),
    )

    await analytics_api.broadcast_analytics()

    # Assert that snapshot loader is never awaited
    loader.assert_not_awaited()

    # Assert that no database work is requested
    assert analytics_api.connected_clients == set()

# testing if the broadcast_analytics function handles exceptions correctly
@pytest.mark.anyio
async def test_broadcast_recovers_after_snapshot_failure(monkeypatch):
    snapshot = {"total_events": 3}
    loader = AsyncMock(
        side_effect=[
            RuntimeError("database unavailable"),
            snapshot,
        ]
    )
    client = AsyncMock()

    monkeypatch.setattr(analytics_api, "load_analytics_snapshot", loader)
    monkeypatch.setattr(analytics_api, "connected_clients", {client})

    with pytest.raises(RuntimeError, match="database unavailable"):
        await analytics_api.broadcast_analytics()

    client.send_json.assert_not_awaited()

    await analytics_api.broadcast_analytics()

    client.send_json.assert_awaited_once_with(snapshot)
    assert client in analytics_api.connected_clients

# this will test if one client fails will be removed from the connected clients set while the healthy client remains connected
@pytest.mark.anyio
async def test_broadcast_removes_timed_out_client(monkeypatch):
    expected = {
        "total_events": 3,
        "events_per_second": 0,
        "topic_counts": {"python": 3},
        "platform_counts": {"reddit": 3},
        "sentiment_counts": {"positive": 3},
    }

    loader = AsyncMock(return_value=expected)
    failed_client = AsyncMock()
    healthy_client = AsyncMock()

    failed_client.send_json.side_effect = TimeoutError("Connection timed out")

    monkeypatch.setattr(
        analytics_api,
        "load_analytics_snapshot",
        loader,
    )
    monkeypatch.setattr(
        analytics_api,
        "connected_clients",
        {failed_client, healthy_client},
    )

    await analytics_api.broadcast_analytics()

    # Assert that slow client was removed
    assert failed_client not in analytics_api.connected_clients

    # Assert that the healthy client received the correct snapshot.
    healthy_client.send_json.assert_awaited_once_with(expected)

    # Assert that the healthy client remains connected.
    assert healthy_client in analytics_api.connected_clients