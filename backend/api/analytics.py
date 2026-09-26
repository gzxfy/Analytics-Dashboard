from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from collections import Counter

router = APIRouter()


connected_clients: set[WebSocket] = set()
total_events = 0
topic_counts = Counter()
platform_counts = Counter()
sentiment_counts = Counter()

def record_event(event: dict[str, str]) -> None:
    global total_events

    total_events += 1
    topic_counts[event["topic"]] += 1
    platform_counts[event["platform"]] += 1
    sentiment_counts[event["sentiment"]] += 1


def get_analytics_snapshot():
    return {
        "total_events": total_events,
        "topic_counts": dict(topic_counts),
        "platform_counts": dict(platform_counts),
        "sentiment_counts": dict(sentiment_counts),
    }

async def broadcast_analytics():
    snapshot = get_analytics_snapshot()

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
        await websocket.send_json(get_analytics_snapshot())
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        connected_clients.discard(websocket)

@router.get("/analytics")
async def get_analytics():
    return {
        "total_events": total_events,
        "topic_counts": dict(topic_counts),
        "platform_counts": dict(platform_counts),
        "sentiment_counts": dict(sentiment_counts),
    }