"""Shared persistence path for HTTP ingestion and the bounded demo stream."""

from backend.api.analytics import record_event_arrival
from backend.models.models import Event


async def save_event(session, payload: dict):
    session.add(Event(**payload))
    await session.commit()
    # Count only successfully committed events in the live throughput metric.
    record_event_arrival()
