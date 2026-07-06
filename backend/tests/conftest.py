import os
import tempfile
import uuid
from typing import AsyncGenerator
from unittest.mock import patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import NullPool
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app import app as _app
from database import Base, get_session
from dependencies import get_current_user

# ----- file‑based temp DB ----- #
_db_fd, _db_path = tempfile.mkstemp(suffix=".test.db")
TEST_DB_URL = f"sqlite+aiosqlite:///{_db_path}"

test_engine = create_async_engine(TEST_DB_URL, echo=False, poolclass=NullPool)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_session():
    async with TestSessionLocal() as session:
        yield session


_DUMMY_USER = None


async def dummy_get_current_user():
    global _DUMMY_USER
    if _DUMMY_USER is None:
        from database import User
        _DUMMY_USER = User(id=uuid.uuid4().hex, email="test@sid.ai", username="TestUser", password_hash="x")
    return _DUMMY_USER


def mock_generate(messages: list[dict], **kwargs) -> str:
    return "This is a test response."


async def mock_generate_stream(messages: list[dict], **kwargs):
    yield "This "
    yield "is "
    yield "a "
    yield "test "
    yield "response."


def mock_rag_context(query: str) -> str:
    return ""


# ----- patches applied for all tests ----- #
@pytest.fixture(autouse=True)
def _patch_deps():
    with (
        patch("app.generate_response", mock_generate),
        patch("app.generate_response_stream", mock_generate_stream),
        patch("rag.build_rag_context", mock_rag_context),
    ):
        yield


# ----- fixtures ----- #
@pytest_asyncio.fixture
async def _clear_overrides():
    _app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def app(_clear_overrides) -> None:
    yield _app


@pytest_asyncio.fixture
async def client(app) -> AsyncGenerator[AsyncClient, None]:
    """No auth override — endpoints requiring auth return 401."""
    app.dependency_overrides.clear()
    app.dependency_overrides[get_session] = override_get_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def authed_client(app) -> AsyncGenerator[AsyncClient, None]:
    """Pre‑authenticated client."""
    app.dependency_overrides.clear()
    app.dependency_overrides[get_session] = override_get_session
    app.dependency_overrides[get_current_user] = dummy_get_current_user
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ----- cleanup ----- #
def pytest_unconfigure():
    os.close(_db_fd)
    try:
        os.unlink(_db_path)
    except OSError:
        pass
