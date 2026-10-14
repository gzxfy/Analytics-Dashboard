from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.models import Event

async def get_total_events(session: AsyncSession) -> int:
    statement = select(func.count()).select_from(Event)
    result = await session.execute(statement)
    return result.scalar_one()

async def get_topic_count(session: AsyncSession) -> dict[str, int]:
    statement = select(Event.topic, func.count()).select_from(Event).group_by(Event.topic)
    result = await session.execute(statement)
    return {topic: count for topic, count in result.fetchall()}

async def get_platform_count(session: AsyncSession) -> dict[str, int]:
    statement = select(Event.platform, func.count()).select_from(Event).group_by(Event.platform)
    result = await session.execute(statement)
    return {platform: count for platform, count in result.fetchall()}

async def get_sentiment_count(session: AsyncSession) -> dict[str, int]:
    statement = select(Event.sentiment, func.count()).select_from(Event).group_by(Event.sentiment)
    result = await session.execute(statement)
    return {sentiment: count for sentiment, count in result.fetchall()}

async def get_persistent_analytics(session: AsyncSession) -> dict[str, int | dict[str, int]]:
    total_events = await get_total_events(session)
    topic_counts = await get_topic_count(session)
    platform_counts = await get_platform_count(session)
    sentiment_counts = await get_sentiment_count(session)

    return {
        "total_events": total_events,
        "topic_counts": topic_counts,
        "platform_counts": platform_counts,
        "sentiment_counts": sentiment_counts,
    }