# SID.AI — Your Personal AI Assistant

A full-stack AI chat application with local LLM inference, RAG (Retrieval-Augmented Generation), JWT authentication, web search, and production-grade infrastructure.

## Architecture

```
┌──────────┐      ┌───────────┐      ┌───────────────┐
│ Frontend │ ───> │  Backend   │ ───> │  llama-server │
│ Next.js  │ SSE  │  FastAPI   │ HTTP │  (GGUF model) │
│ :3000    │ <─── │  :8888     │ <─── │  :8081        │
└──────────┘      └─────┬─────┘      └───────────────┘
                        │
              ┌─────────┼─────────┐
              ▼         ▼         ▼
          SQLite    ChromaDB   Google CSE
          (Auth &   (RAG       (Web
           Chat     vectors)   Search)
           History)
```

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- A GGUF model file placed at `outputs/sid-ai-q4_k_m.gguf`

### 1. Start the LLM server

```powershell
.\llama_bin\llama-server.exe -m outputs/sid-ai-q4_k_m.gguf --host 127.0.0.1 --port 8081 -c 4096 -t 6 -ngl 0
```

### 2. Start the backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8888
```

### 3. Start the frontend

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

### One-command start

```powershell
.\start.ps1
```

## Testing

```powershell
# Backend (pytest)
cd backend
pytest tests/ -v

# Frontend (Vitest)
cd frontend
npm test

# E2E (Playwright — requires dev servers running)
npm run test:e2e
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, framer-motion |
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0 (async), SQLite |
| LLM | llama.cpp server, Qwen2.5-3B-Instruct (GGUF quantized) |
| RAG | ChromaDB, all-MiniLM-L6-v2 embeddings |
| Auth | JWT (python-jose), bcrypt |
| Testing | pytest, Vitest, Playwright |

## Project Structure

```
sid-ai/
├── backend/              # FastAPI backend
│   ├── app.py            # Main application & chat endpoints
│   ├── auth.py           # Authentication routes
│   ├── config.py         # Environment-based configuration
│   ├── conversations.py  # Conversation CRUD
│   ├── database.py       # SQLAlchemy async models
│   ├── dependencies.py   # Auth dependency injection
│   ├── logging_config.py # Structured JSON logging
│   ├── middleware.py     # Rate limiting, metrics, security headers
│   ├── model.py          # LLM inference client (with caching)
│   ├── rag.py            # ChromaDB RAG indexing & search
│   ├── search.py         # Google Custom Search integration
│   ├── upload.py         # File upload & PDF extraction
│   ├── tests/            # pytest test suite
│   └── Dockerfile
├── frontend/             # Next.js frontend
│   ├── app/              # App router pages & layout
│   ├── components/       # React components
│   ├── context/          # Auth & chat contexts
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API client services
│   ├── tests/            # Vitest & Playwright tests
│   └── Dockerfile
├── deploy/               # VPS deployment configs
│   ├── nginx/
│   └── systemd/
├── llama_bin/            # llama.cpp binaries
├── outputs/              # GGUF model & LoRA checkpoints
├── docker-compose.yml
├── render.yaml
├── fly.toml
└── railway.json
```

## API Endpoints

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/signup` | Create account (email, password, username) |
| POST | `/auth/login` | Sign in (email, password) |
| GET | `/auth/me` | Get current user (requires token) |

### Chat

| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat` | Send message (sync response) |
| POST | `/chat/stream` | Send message (SSE streaming) |

### Conversations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/conversations` | List conversations |
| POST | `/conversations` | Create conversation |
| DELETE | `/conversations/{id}` | Delete conversation |
| GET | `/conversations/{id}/messages` | List messages |
| POST | `/conversations/{id}/messages` | Add message |

### Other

| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload` | Upload file (PDF/TXT/MD/CSV) |
| POST | `/search` | Web search (Google CSE) |
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |
| GET | `/metrics` | Application metrics |

## Environment Variables

See [.env.example](.env.example) for all available variables.

## Docker

```powershell
# Build and start all services
docker compose up --build

# Start in background
docker compose up --build -d

# Stop
docker compose down
```

## Deployment

- [Render](docs/deployment.md#render)
- [Railway](docs/deployment.md#railway)
- [Fly.io](docs/deployment.md#flyio)
- [VPS (Ubuntu + Nginx + systemd)](docs/deployment.md#vps-ubuntu--nginx--systemd)

## License

MIT
