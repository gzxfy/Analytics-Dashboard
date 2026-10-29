import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from backend.api.analytics import broadcast_analytics
from backend.api.events import router as events_router
from backend.api.analytics import router as analytics_router
from backend.api.demo_stream import router as demo_router
from backend.models.db import SessionFactory
from backend.services.demo_stream import DemoStream
from backend.services.ingestion import save_event


logger = logging.getLogger(__name__)

# Broadcast analytics loop and application lifespan management
async def broadcast_loop():
    while True:
        await asyncio.sleep(0.25)
        try:
            await broadcast_analytics()
        except Exception:
            logger.exception("Analytics broadcast failed")

@asynccontextmanager
async def lifespan(app: FastAPI):
    async def write_demo_event(payload):
        async with SessionFactory() as session:
            await save_event(session, payload)

    # Opt in explicitly. The controller is process-local; keep one API worker.
    app.state.demo_stream = DemoStream(
        write_demo_event, enabled=os.getenv("ENABLE_DEMO_STREAM", "false").lower() == "true"
    )
    task = asyncio.create_task(broadcast_loop())
    try: 
        yield
    finally:
        # No orphan generator remains when the application shuts down.
        await app.state.demo_stream.stop()
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

app=FastAPI(lifespan=lifespan)
app.include_router(events_router, tags=["events"])
app.include_router(analytics_router, tags=["analytics"])
app.include_router(demo_router)

@app.get("/health")
async def root():
    return {"status": "Healthy"}
