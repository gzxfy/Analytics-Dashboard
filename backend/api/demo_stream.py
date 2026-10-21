from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field

router = APIRouter(prefix="/demo-stream", tags=["demo stream"])


class StartStream(BaseModel):
    model_config = ConfigDict(extra="forbid")
    target_rate: int = Field(default=5, ge=1, le=20, strict=True)


@router.get("")
async def status(request: Request):
    return request.app.state.demo_stream.status()


@router.post("", status_code=202)
async def start(payload: StartStream, request: Request):
    try:
        return request.app.state.demo_stream.start(payload.target_rate)
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.delete("")
async def stop(request: Request):
    return await request.app.state.demo_stream.stop()
