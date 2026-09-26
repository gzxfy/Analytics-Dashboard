from fastapi import APIRouter
from pydantic import BaseModel
from backend.api.analytics import broadcast_analytics, record_event

router = APIRouter()

class EventCreate(BaseModel):
    platform: str
    topic: str
    sentiment: str

events_store: list[dict[str, str]] = []

@router.post("/events")
async def recieve_events(event: EventCreate):
    saved_event = event.model_dump()
    events_store.append(saved_event)
    record_event(saved_event)
    await broadcast_analytics()
    return {"status": "success", "event": saved_event}

@router.get("/events")
async def list_events():
    return {"events": events_store}