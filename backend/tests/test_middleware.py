import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_request_id_header(authed_client: AsyncClient):
    res = await authed_client.get("/")
    assert "X-Request-ID" in res.headers
    assert len(res.headers["X-Request-ID"]) > 0


@pytest.mark.asyncio
async def test_metrics_endpoint(authed_client: AsyncClient):
    await authed_client.get("/")
    res = await authed_client.get("/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "uptime_seconds" in data
    assert "total_requests" in data
    assert "total_errors" in data
    assert data["total_requests"] >= 2  # at least 2 requests (root + metrics)


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_readiness_endpoint(client: AsyncClient):
    res = await client.get("/ready")
    assert res.status_code == 200
    assert res.json()["status"] in ("ok", "ready")
