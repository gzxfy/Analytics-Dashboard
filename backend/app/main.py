import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from backend.api.analytics import broadcast_analytics
from backend.api.events import router as events_router
from backend.api.analytics import router as analytics_router


logger = logging.getLogger(__name__)

async def broadcast_loop():
    while True:
        await asyncio.sleep(0.25)
        try:
            await broadcast_analytics()
        except Exception:
            logger.exception("Analytics broadcast failed")

@asynccontextmanager
async def lifespan(app: FastAPI):
        
    task = asyncio.create_task(broadcast_loop())
    try: 
        yield
    finally:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass

app=FastAPI(lifespan=lifespan)
app.include_router(events_router, tags=["events"])
app.include_router(analytics_router, tags=["analytics"])

@app.get("/health")
async def root():
    return {"status": "Healthy"}