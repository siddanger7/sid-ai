# API Documentation

Base URL: `http://localhost:8888`

All endpoints (except `/auth/signup`, `/auth/login`, `/health`, `/ready`) require JWT authentication via `Authorization: Bearer <token>` header.

---

## Authentication

### POST /auth/signup

Create a new user account.

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "username": "johndoe"
}
```

**Response 200:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "abc123",
    "email": "user@example.com",
    "username": "johndoe",
    "created_at": "2026-07-07T12:00:00"
  }
}
```

### POST /auth/login

Authenticate with email and password.

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:** Same as signup.

### GET /auth/me

Get the currently authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:**

```json
{
  "id": "abc123",
  "email": "user@example.com",
  "username": "johndoe",
  "created_at": "2026-07-07T12:00:00"
}
```

---

## Chat

### POST /chat

Send a message and receive a complete response.

```json
{
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "conversation_id": "optional-conv-id",
  "max_tokens": 512,
  "temperature": 0.7,
  "top_p": 0.9
}
```

**Parameters:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `messages` | array | — | Conversation history (max 50 messages, 10K chars each) |
| `message` | string | — | Single message (alternative to `messages`) |
| `conversation_id` | string | null | Save response to conversation |
| `max_tokens` | int | 512 | Max tokens in response (1–4096) |
| `temperature` | float | 0.7 | Sampling temperature (0.0–2.0) |
| `top_p` | float | 0.9 | Nucleus sampling (0.0–1.0) |

**Response 200:**

```json
{
  "response": "Hello! How can I help you today?"
}
```

### POST /chat/stream

Send a message and receive a streaming SSE response.

Same request body as `/chat`.

**Response:** Server-Sent Events stream:

```
data: {"token":"Hello"}
data: {"token":"!"}
data: {"token":" How"}
data: [DONE]
```

---

## Conversations

### GET /conversations

List all conversations for the authenticated user.

**Response 200:**

```json
[
  {
    "id": "conv-1",
    "title": "My Chat",
    "created_at": "2026-07-07T12:00:00",
    "updated_at": "2026-07-07T12:05:00"
  }
]
```

### POST /conversations

Create a new conversation.

```json
{
  "title": "New Chat"
}
```

**Response 200:** The created conversation object.

### DELETE /conversations/{id}

Delete a conversation and its messages.

**Response 200:** `{"ok": true}`

### GET /conversations/{id}/messages

List messages in a conversation.

**Response 200:**

```json
[
  {
    "id": "msg-1",
    "role": "user",
    "content": "Hello!",
    "created_at": "2026-07-07T12:00:00"
  }
]
```

### POST /conversations/{id}/messages

Add a message to a conversation.

```json
{
  "role": "user",
  "content": "Hello!"
}
```

**Response 200:** The created message object.

---

## File Upload

### POST /upload

Upload a file for RAG indexing.

**Content-Type:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | File to upload (.pdf, .txt, .md, .csv; max 20MB) |

**Response 200:**

```json
{
  "id": "file-uuid",
  "file_name": "document.pdf",
  "file_size": 12345,
  "content_type": "application/pdf",
  "chunks_indexed": 15
}
```

---

## Web Search

### POST /search

Search the web via Google Custom Search.

```json
{
  "query": "latest AI news"
}
```

**Response 200:**

```json
{
  "results": [
    {
      "title": "AI News",
      "link": "https://example.com",
      "snippet": "Latest developments...",
      "source": "Google"
    }
  ]
}
```

---

## Monitoring

### GET /health

Simple health check.

```json
{"status": "ok"}
```

### GET /ready

Readiness check (verifies database connectivity).

```json
{"status": "ready"}
```

### GET /metrics

Application metrics.

```json
{
  "uptime_seconds": 3600,
  "total_requests": 100,
  "total_errors": 2,
  "error_rate": 0.02,
  "avg_duration_ms": 450.5,
  "requests_per_minute": 12.3
}
```
