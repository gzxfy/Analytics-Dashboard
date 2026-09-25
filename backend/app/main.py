from fastapi import FastAPI
from backend.api.events import router as events_router

app=FastAPI()
app.include_router(events_router, tags=["events"])

@app.get("/health")
async def root():
    return {"status": "Healthy"}