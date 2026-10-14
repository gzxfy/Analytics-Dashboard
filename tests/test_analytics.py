import asyncio
import logging

import pytest

import backend.app.main as app_main
from backend.models.models import Event
import backend.services.analytics as analytics_services


@pytest.mark.anyio
async def test_total_events_counts_saved_rows(db_session):
    # Arrange
    db_session.add(
        Event(platform="reddit", topic="python", sentiment="positive")
    )
    await db_session.flush()

    # Act: calling counting service.
    total_events = await analytics_services.get_total_events(db_session)

    # Assert: check that the count is 1.
    assert total_events == 1


@pytest.mark.anyio
async def test_total_topics(db_session):
    # Arrange
    db_session.add_all([
        Event(platform="reddit", topic="python", sentiment="positive"),
        Event(platform="ai", topic="python", sentiment="negative")
    ])
    
    await db_session.flush()

    # Act: calling topic service
    total_topics = await analytics_services.get_topic_count(db_session)

    # Assert: check that topic python == 2

    assert total_topics == {"python": 2}

@pytest.mark.anyio
async def test_total_platforms(db_session):
    # Arrange
    db_session.add_all([
        Event(platform="reddit", topic="python", sentiment="positive"),
        Event(platform="ai", topic="python", sentiment="negative"),
        Event(platform="twitter", topic="python", sentiment="neutral")
    ])
    
    await db_session.flush()

    # Act: calling platform service
    total_platforms = await analytics_services.get_platform_count(db_session)

    # Assert: check that each platform count is correct

    assert total_platforms == {"reddit": 1, "ai": 1, "twitter": 1}

@pytest.mark.anyio
async def test_total_sentiments(db_session):
    # Arrange
    db_session.add_all([
        Event(platform="reddit", topic="python", sentiment="positive"),
        Event(platform="youtube", topic="python", sentiment="negative"),
        Event(platform="instagram", topic="ai", sentiment="negative")
    ])
    
    await db_session.flush()

    # Act: calling platform service
    total_sentiment = await analytics_services.get_sentiment_count(db_session)

    # Assert: check that each platform count is correct

    assert total_sentiment == {"positive": 1, "negative": 2}

@pytest.mark.anyio
async def test_total_analytics(db_session):
    # Arrange
    db_session.add_all([
        Event(platform="reddit", topic="python", sentiment="positive"),
        Event(platform="youtube", topic="python", sentiment="negative"),
        Event(platform="instagram", topic="ai", sentiment="negative"),
        Event(platform="linkedin", topic="ai", sentiment="positive"),
        Event(platform="reddit", topic="python", sentiment="positive")
    ])
    
    await db_session.flush()

    # Act: calling persistent analytics service
    total_analytics = await analytics_services.get_persistent_analytics(db_session)

    # Assert: check that each count is correct
    assert total_analytics == {
        "total_events": 5,
        "topic_counts": {"python": 3, "ai": 2},
        "platform_counts": {"reddit": 2, "youtube": 1, "instagram": 1, "linkedin": 1},
        "sentiment_counts": {"positive": 3, "negative": 2}
    }

    
@pytest.mark.anyio
async def test_empty_analytics(db_session):
    # Act: calling persistent analytics service on empty database
    total_analytics = await analytics_services.get_persistent_analytics(db_session)

    # Assert: check that all counts are zero or empty
    assert total_analytics == {
        "total_events": 0,
        "topic_counts": {},
        "platform_counts": {},
        "sentiment_counts": {}
    }


@pytest.mark.anyio
async def test_broadcast_loop_continues_after_broadcast_failure(monkeypatch, caplog):
    broadcast_calls = 0

    async def broadcast_once_fails():
        nonlocal broadcast_calls
        broadcast_calls += 1
        if broadcast_calls == 1:
            raise RuntimeError("database unavailable")
        raise asyncio.CancelledError

    async def skip_sleep(_delay):
        return None

    monkeypatch.setattr(app_main, "broadcast_analytics", broadcast_once_fails)
    monkeypatch.setattr(app_main.asyncio, "sleep", skip_sleep)

    with caplog.at_level(logging.ERROR):
        with pytest.raises(asyncio.CancelledError):
            await app_main.broadcast_loop()

    assert broadcast_calls == 2
    assert "Analytics broadcast failed" in caplog.text

# End of test cases for analytics services
