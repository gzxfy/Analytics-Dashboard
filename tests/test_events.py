import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from backend.app.main import app
from backend.models.db import get_session
from backend.models.models import Event


@pytest.mark.anyio
async def test_post_events_saves_event(db_session):
    async def override_get_session():
        yield db_session

    previous_overrides = app.dependency_overrides.copy()
    app.dependency_overrides[get_session] = override_get_session

    try:
        transport = ASGITransport(app=app)

        async with AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:
            payload = {
                "platform": "reddit",
                "topic": "python",
                "sentiment": "positive",
            }

            response = await client.post("/events", json=payload)

            assert response.status_code == 200
            assert response.json() == {
                "status": "success",
                "event": payload,
            }

            result = await db_session.execute(select(Event))
            saved_event = result.scalars().one()

            assert saved_event.platform == "reddit"
            assert saved_event.topic == "python"
            assert saved_event.sentiment == "positive"
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)

@pytest.mark.anyio
async def test_post_events_without_topic(client, db_session):
    """Test posting an event without specifying the topic."""
    response = await client.post("/events", json={"platform": "reddit", "sentiment": "positive"})   
    assert response.status_code == 422

    result = await db_session.execute(select(Event))
    saved_events = result.scalars().all()

    assert len(saved_events) == 0

@pytest.mark.anyio
async def test_post_events_without_platform(client, db_session):
    """Test posting an event without specifying the platform."""
    response = await client.post("/events", json={"topic": "python", "sentiment": "positive"})
    assert response.status_code == 422

    result = await db_session.execute(select(Event))
    saved_events = result.scalars().all()

    assert len(saved_events) == 0

@pytest.mark.anyio
async def test_post_events_without_sentiment(client, db_session):
    """Test posting an event without specifying the sentiment."""
    response = await client.post("/events", json={"topic": "python", "platform": "reddit"})
    assert response.status_code == 422

    result = await db_session.execute(select(Event))
    saved_events = result.scalars().all()

    assert len(saved_events) == 0

@pytest.mark.anyio
async def test_get_events_paginates_from_first_event(client, db_session):
    db_session.add_all([
        Event(platform="reddit", topic="python", sentiment="positive"),
        Event(platform="twitter", topic="ai", sentiment="neutral"),
        Event(platform="youtube", topic="ml", sentiment="negative"),
    ])
    await db_session.flush()

    first_page = await client.get("/events")
    next_page = await client.get("/events", params={"limit": 1, "offset": 1})

    assert first_page.status_code == 200
    assert [event["platform"] for event in first_page.json()["events"]] == [
        "reddit",
        "twitter",
        "youtube",
    ]
    assert next_page.status_code == 200
    assert [event["platform"] for event in next_page.json()["events"]] == ["twitter"]


@pytest.mark.anyio
async def test_get_events_rejects_invalid_page_size(client):
    response = await client.get("/events", params={"limit": 501})

    assert response.status_code == 422

@pytest.mark.anyio
async def test_topic_length_boundary(client, db_session):
    """Test posting an event with a topic at the length boundary."""
    # Topic length exceeds the maximum allowed length (255 characters)
    long_topic = "a" * 51
    response = await client.post("/events", json={"platform": "reddit", "topic": long_topic, "sentiment": "positive"})
    assert response.status_code == 422

    result = await db_session.execute(select(Event))
    saved_events = result.scalars().all()
    assert len(saved_events) == 0
    
    just_right_length_topic = "a" * 50
    response = await client.post("/events", json={"platform": "reddit", "topic": just_right_length_topic, "sentiment": "positive"})
    assert response.status_code == 200

    result = await db_session.execute(select(Event))
    saved_events = result.scalars().all()
    assert len(saved_events) == 1
    assert saved_events[0].topic == just_right_length_topic
    assert saved_events[0].platform == "reddit"
    assert saved_events[0].sentiment == "positive"


# This test the whole http flow for posting events and retrieving analytics
@pytest.mark.anyio
async def test_analytics_counts_posted_events(client):
    await client.post("/events", json={"platform": "reddit", "topic": "python", "sentiment": "positive"})
    await client.post("/events", json={"platform": "twitter", "topic": "ai", "sentiment": "negative"})
    await client.post("/events", json={"platform": "reddit", "topic": "ml", "sentiment": "positive"})

    response = await client.get("/analytics")
    assert response.status_code == 200
    snapshot = response.json()

    assert snapshot["total_events"] == 3
    assert snapshot["platform_counts"] == {"reddit": 2, "twitter": 1}
    assert snapshot["topic_counts"] == {"python": 1, "ai": 1, "ml": 1}
    assert snapshot["sentiment_counts"] == {"positive": 2, "negative": 1}