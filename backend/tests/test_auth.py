import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_signup(client: AsyncClient):
    res = await client.post("/auth/signup", json={
        "email": "alice@test.com",
        "password": "pass123",
        "username": "Alice",
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "alice@test.com"
    assert data["user"]["username"] == "Alice"


@pytest.mark.asyncio
async def test_signup_duplicate_email(client: AsyncClient):
    payload = {"email": "dup@test.com", "password": "pass123", "username": "Dup"}
    await client.post("/auth/signup", json=payload)
    res = await client.post("/auth/signup", json=payload)
    assert res.status_code == 409
    assert "already registered" in res.text.lower()


@pytest.mark.asyncio
async def test_login(client: AsyncClient):
    await client.post("/auth/signup", json={
        "email": "bob@test.com", "password": "pass456", "username": "Bob",
    })
    res = await client.post("/auth/login", json={
        "email": "bob@test.com", "password": "pass456",
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "bob@test.com"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/auth/signup", json={
        "email": "carol@test.com", "password": "pass789", "username": "Carol",
    })
    res = await client.post("/auth/login", json={
        "email": "carol@test.com", "password": "wrongpass",
    })
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_me_requires_auth(client: AsyncClient):
    res = await client.get("/auth/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_me_with_valid_token(client: AsyncClient):
    signup_res = await client.post("/auth/signup", json={
        "email": "dave@test.com", "password": "pass000", "username": "Dave",
    })
    token = signup_res.json()["access_token"]
    res = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "dave@test.com"
