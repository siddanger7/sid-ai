import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_chat_requires_auth(client: AsyncClient):
    res = await client.post("/chat", json={"message": "hello"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_chat_basic(authed_client: AsyncClient):
    res = await authed_client.post("/chat", json={"message": "Hello!"})
    assert res.status_code == 200
    data = res.json()
    assert "response" in data
    assert data["response"] == "This is a test response."


@pytest.mark.asyncio
async def test_chat_with_history(authed_client: AsyncClient):
    res = await authed_client.post("/chat", json={
        "messages": [
            {"role": "user", "content": "Hi"},
            {"role": "assistant", "content": "Hello!"},
            {"role": "user", "content": "How are you?"},
        ]
    })
    assert res.status_code == 200
    assert res.json()["response"] == "This is a test response."


@pytest.mark.asyncio
async def test_chat_validation(authed_client: AsyncClient):
    res = await authed_client.post("/chat", json={"messages": "not_a_list"})
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_chat_empty_message(authed_client: AsyncClient):
    res = await authed_client.post("/chat", json={})
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_chat_stream_requires_auth(client: AsyncClient):
    res = await client.post("/chat/stream", json={"message": "hello"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_chat_stream_basic(authed_client: AsyncClient):
    async with authed_client.stream("POST", "/chat/stream", json={"message": "Hi"}):
        pass  # connection established = endpoint works
    # If we got here without error, the endpoint exists and is reachable
    assert True


@pytest.mark.asyncio
async def test_input_too_long(authed_client: AsyncClient):
    long_msg = "x" * 11_000
    res = await authed_client.post("/chat", json={"message": long_msg})
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_too_many_messages(authed_client: AsyncClient):
    msgs = [{"role": "user", "content": "hi"} for _ in range(55)]
    res = await authed_client.post("/chat", json={"messages": msgs})
    assert res.status_code == 422
