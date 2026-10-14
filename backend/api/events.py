from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.analytics import record_event_arrival
from backend.models.db import get_session
from backend.models.models import Event
from backend.models.schemas import EventCreate, EventRead

router = APIRouter()


@router.post("/events")
async def recieve_events(event: EventCreate, session: AsyncSession = Depends(get_session),):
    
    request_data = event.model_dump()

    database_event = Event(**request_data)
    session.add(database_event)
    await session.commit()

    record_event_arrival()

    return {"status": "success", "event": request_data}

@router.get("/events")
async def list_events(
    session: AsyncSession = Depends(get_session),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    result = await session.execute(
        select(Event).order_by(Event.id).limit(limit).offset(offset)
    )

    database_events = result.scalars().all()
    return {"events": [
        EventRead.model_validate(event).model_dump()
        for event in database_events
    ]}