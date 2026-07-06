# Architecture

## System Overview

SID.AI is a three-tier application:

1. **Frontend** (Next.js 16, React 19) — UI for chat, file upload, auth
2. **Backend** (FastAPI, Python 3.12) — REST API, auth, RAG, business logic
3. **LLM Server** (llama.cpp) — Local model inference via OpenAI-compatible API

## Data Flow

```
User → Frontend (Next.js) → HTTP/SSE → Backend (FastAPI) → HTTP → llama-server
                                 ↓
                            ┌─────┴─────┐
                            │  Database  │
                            │  (SQLite)  │
                            └─────┬─────┘
                                  │
                            ┌─────┴─────┐
                            │  ChromaDB │
                            │  (Vectors)│
                            └───────────┘
```

## Authentication Flow

1. User signs up/logs in → Backend returns JWT token.
2. Token stored in `localStorage` as `sidai-token`.
3. All subsequent requests include `Authorization: Bearer <token>` header.
4. Backend validates token via `get_current_user` dependency.
5. On 401 response, frontend clears token and redirects to login.

## RAG Pipeline

```
Uploaded File → PyMuPDF (PDF) / plain text → Chunk (500 chars) → Embed → Store in ChromaDB
                                                                              ↓
User Message → Extract last query → Query ChromaDB (top 3) → Build context → Inject into system prompt → LLM response
```

## Streaming

```
Frontend                          Backend                        llama-server
   │                                │                                │
   │── POST /chat/stream ──────────>│                                │
   │                                │── POST (stream=True) ─────────>│
   │                                │                                │
   │<── SSE: data: {"token":"H"} ───│<── chunk ─────────────────────│
   │<── SSE: data: {"token":"i"} ───│<── chunk ─────────────────────│
   │<── SSE: data: [DONE] ──────────│<── [DONE] ────────────────────│
```

## Security

| Layer | Mechanism |
|-------|-----------|
| Transport | HTTPS (via reverse proxy) |
| Auth | JWT Bearer tokens (HS256) |
| Password | bcrypt hashing |
| CORS | Restricted to specific origins |
| Rate Limiting | 60 req/min per IP |
| Headers | HSTS, X-Frame-Options, X-Content-Type-Options, CSP |
| Input Validation | Pydantic models with length/role checks |
| Secrets | Environment variables only |

## Caching

Prompt caching (LRU, 128 entries) is implemented in `backend/model.py` to avoid redundant LLM calls for identical or recent prompts.

## Middleware Pipeline

```
Request → GZip → SecurityHeaders → CORS → Metrics → RequestID → RateLimit → Router → Response
```

## Performance Considerations

- **Streaming:** Uses async SSE to avoid blocking the event loop.
- **Database:** SQLAlchemy 2.0 async with aiosqlite for non-blocking queries.
- **RAG:** ChromaDB with cosine similarity search; indexed only on upload.
- **LLM:** llama.cpp runs as a separate process, keeping Python free for API handling.
