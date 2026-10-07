from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EventCreate(BaseModel):
    platform: str = Field(max_length=50)
    topic: str = Field(max_length=50)
    sentiment: str = Field(max_length=50)


class EventRead(EventCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime