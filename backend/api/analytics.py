from fastapi import APIRouter
from collections import Counter

router = APIRouter()

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

@router.get("/analytics")
async def get_analytics():
    return {
        "total_events": total_events,
        "topic_counts": dict(topic_counts),
        "platform_counts": dict(platform_counts),
        "sentiment_counts": dict(sentiment_counts),
    }