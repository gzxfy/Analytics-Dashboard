from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from collections import deque
import time
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.db import get_session, SessionFactory
import backend.services.analytics as analytics_services

router = APIRouter()

connected_clients: set[WebSocket] = set()
event_timestamps: deque[float] = deque()

# Helper function to load the analytics snapshot including events per second
async def load_analytics_snapshot():
    async with SessionFactory() as session:
        snapshot = await analytics_services.get_persistent_analytics(session)

    snapshot["events_per_second"] = get_events_per_second()
    return snapshot


def record_event_arrival() -> None:
    # Recording each event's arrival time
    event_timestamps.append(time.monotonic())

# removes timestamps older than one second
def get_events_per_second() -> int:
    cutoff = time.monotonic() - 1

    while event_timestamps and event_timestamps[0] < cutoff:
        event_timestamps.popleft()

    return len(event_timestamps)

async def broadcast_analytics():
    if not connected_clients:
        return
    
    snapshot = await load_analytics_snapshot()


    for client in list(connected_clients):
        try:
            await client.send_json(snapshot)
        except (RuntimeError, OSError):
            connected_clients.discard(client)

@router.websocket("/ws/analytics")
async def analytics_websocket(websocket: WebSocket):
    await websocket.accept()

    try:
        snapshot = await load_analytics_snapshot()

        await websocket.send_json(snapshot)
        connected_clients.add(websocket)
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        connected_clients.discard(websocket)

@router.get("/analytics")
async def get_analytics(session: AsyncSession = Depends(get_session)):
    snapshot = await analytics_services.get_persistent_analytics(session)
    snapshot["events_per_second"] = get_events_per_second()
    return snapshot