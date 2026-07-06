import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_conversations_empty(authed_client: AsyncClient):
    res = await authed_client.get("/conversations")
    assert res.status_code == 200
    assert res.json() == []


@pytest.mark.asyncio
async def test_create_conversation(authed_client: AsyncClient):
    res = await authed_client.post("/conversations", json={"title": "My Chat"})
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "My Chat"
    assert "id" in data


@pytest.mark.asyncio
async def test_create_and_list(authed_client: AsyncClient):
    await authed_client.post("/conversations", json={"title": "First"})
    await authed_client.post("/conversations", json={"title": "Second"})
    res = await authed_client.get("/conversations")
    assert len(res.json()) == 2


@pytest.mark.asyncio
async def test_delete_conversation(authed_client: AsyncClient):
    created = await authed_client.post("/conversations", json={"title": "To Delete"})
    conv_id = created.json()["id"]
    del_res = await authed_client.delete(f"/conversations/{conv_id}")
    assert del_res.status_code == 204
    list_res = await authed_client.get("/conversations")
    assert len(list_res.json()) == 0


@pytest.mark.asyncio
async def test_delete_nonexistent(authed_client: AsyncClient):
    res = await authed_client.delete("/conversations/nonexistent-id")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_add_and_list_messages(authed_client: AsyncClient):
    conv = (await authed_client.post("/conversations", json={"title": "Msg Test"})).json()
    conv_id = conv["id"]

    msg_res = await authed_client.post(f"/conversations/{conv_id}/messages", json={
        "role": "user", "content": "Hello!",
    })
    assert msg_res.status_code == 201
    assert msg_res.json()["role"] == "user"
    assert msg_res.json()["content"] == "Hello!"

    list_res = await authed_client.get(f"/conversations/{conv_id}/messages")
    assert len(list_res.json()) == 1


@pytest.mark.asyncio
async def test_conversation_scoped_to_user(authed_client: AsyncClient, client: AsyncClient):
    await authed_client.post("/conversations", json={"title": "User A Chat"})
    res = await authed_client.get("/conversations")
    assert len(res.json()) == 1

    # Unauthenticated client should see nothing
    res2 = await client.get("/conversations")
    assert res2.status_code == 401
