from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from collections import Counter, deque
import time
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.db import get_session, SessionFactory
import backend.services.analytics as analytics_services

router = APIRouter()

connected_clients: set[WebSocket] = set()
event_timestamps: deque[float] = deque()


def record_event_arrival() -> None:
    # Just learned that this is not recommend in the professional software development world
    global total_events

    # total_events += 1
    # topic_counts[event["topic"]] += 1
    # platform_counts[event["platform"]] += 1
    # sentiment_counts[event["sentiment"]] += 1

    #recording each events arrive time
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
    
    async with SessionFactory() as session:
        snapshot = await analytics_services.get_persistent_analytics(session)

    snapshot["events_per_second"] = get_events_per_second()

    for client in list(connected_clients):
        try:
            await client.send_json(snapshot)
        except (RuntimeError, OSError):
            connected_clients.discard(client)

@router.websocket("/ws/analytics")
async def analytics_websocket(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)

    try:
        async with SessionFactory() as session:
            snapshot = await analytics_services.get_persistent_analytics(session)

        snapshot["events_per_second"] = get_events_per_second()
        await websocket.send_json(snapshot)
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