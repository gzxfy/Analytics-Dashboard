from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field
from backend.services.demo_stream import MIN_RATE, MAX_RATE

router = APIRouter(prefix="/demo-stream", tags=["demo stream"])


class StartStream(BaseModel):
    model_config = ConfigDict(extra="forbid")
    target_rate: int = Field(default=5, ge=MIN_RATE, le=MAX_RATE, strict=True)


class UpdateStream(BaseModel):
    model_config = ConfigDict(extra="forbid")
    target_rate: int = Field(ge=MIN_RATE, le=MAX_RATE, strict=True)


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


@router.patch("")
async def update_rate(payload: UpdateStream, request: Request):
    # PATCH changes a running stream; POST still rejects duplicate starts.
    try:
        return request.app.state.demo_stream.update_rate(payload.target_rate)
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error)) from error
    except RuntimeError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error
