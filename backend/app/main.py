from fastapi import FastAPI
from backend.api.events import router as events_router
from backend.api.analytics import router as analytics_router

app=FastAPI()
app.include_router(events_router, tags=["events"])
app.include_router(analytics_router, tags=["analytics"])

@app.get("/health")
async def root():
    return {"status": "Healthy"}