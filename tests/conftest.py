# creating a fixture for the test database session
import os
from sqlalchemy.engine import make_url

import pytest
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from backend.models.db import Base, get_session
from backend.models.models import Event


@pytest.fixture
def anyio_backend():
    return "asyncio"

@pytest.fixture
async def db_session(anyio_backend):
    database_url = os.environ["TEST_DATABASE_URL"]

    if make_url(database_url).database != "analytics_test":
        raise ValueError("TEST_DATABASE_URL must point to the test database")

    engine = create_async_engine(database_url, poolclass=NullPool)

    try:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

        async with engine.connect() as connection:
            transaction = await connection.begin()
            try:
                async with AsyncSession(
                    bind=connection,
                    join_transaction_mode="create_savepoint"
                ) as session:
                    yield session
            finally:
                await transaction.rollback()
    finally:
        await engine.dispose()

@pytest.fixture
async def client(anyio_backend, db_session):
    from httpx import AsyncClient, ASGITransport
    from backend.app.main import app

    async def override_get_session():
        yield db_session

    previous_overrides = app.dependency_overrides.copy()
    app.dependency_overrides[get_session] = override_get_session

    try:
        transport = ASGITransport(app=app)
        async with AsyncClient(
            transport=transport,
            base_url="http://test",
        ) as client:
            yield client
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)