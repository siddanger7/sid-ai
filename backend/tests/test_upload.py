import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_upload_requires_auth(client: AsyncClient):
    res = await client.post("/upload", files={"file": ("test.txt", b"hello world")})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_upload_text(authed_client: AsyncClient):
    res = await authed_client.post("/upload", files={"file": ("hello.txt", b"Hello, world!")})
    assert res.status_code == 200
    data = res.json()
    assert data["file_name"] == "hello.txt"
    assert data["chunks_indexed"] >= 0


@pytest.mark.asyncio
async def test_upload_pdf(authed_client: AsyncClient):
    res = await authed_client.post("/upload", files={"file": ("test.pdf", b"%PDF-1.4 fake pdf content")})
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_upload_unsupported_type(authed_client: AsyncClient):
    res = await authed_client.post("/upload", files={"file": ("bad.exe", b"nope")})
    assert res.status_code == 400
