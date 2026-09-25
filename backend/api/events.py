from fastapi import APIRouter

router = APIRouter()

@router.get("/events")
async def list_events():
    return {"events": []}