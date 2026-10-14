import os
from collections.abc import AsyncIterator
from dotenv import load_dotenv

load_dotenv()

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

# manages database connections and sessions
engine = create_async_engine(
    os.environ["DATABASE_URL"],
    pool_pre_ping=True,
)

# creates a session factory for generating new database sessions
SessionFactory = async_sessionmaker(
    engine,
    expire_on_commit=False,
)

# supplies and cleans up database sessions
async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionFactory() as session:
        yield session