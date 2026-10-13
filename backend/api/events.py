from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.analytics import broadcast_analytics, record_event
from backend.models.db import get_session
from backend.models.models import Event
from backend.models.schemas import EventCreate, EventRead

router = APIRouter()

events_store: list[dict[str, str]] = []

@router.post("/events")
async def recieve_events(event: EventCreate, session: AsyncSession = Depends(get_session),):
    
    saved_event = event.model_dump()

    database_event = Event(**saved_event)
    session.add(database_event)
    await session.commit()

    record_event(saved_event)
    await broadcast_analytics()

    return {"status": "success", "event": saved_event}

@router.get("/events")
async def list_events(session: AsyncSession = Depends(get_session),):
    result = await session.execute(
        select(Event).order_by(Event.id)
    )

    database_events = result.scalars().all()
    return {"events": [
        EventRead.model_validate(event).model_dump()
        for event in database_events
    ]}