# Docker Guide

## Quick Start

From the project root:

```bash
# Build and start all services
docker compose up --build

# Run in background
docker compose up --build -d

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

## Service Overview

| Service | Port | Description |
|---------|------|-------------|
| `llama-server` | 8081 | LLM inference server |
| `backend` | 8888 | FastAPI backend |
| `frontend` | 3000 | Next.js frontend |

## Volumes

| Volume | Path | Content |
|--------|------|---------|
| `backend_data` | `/app/chroma_db` | ChromaDB vector store |
| `backend_data` | `/app/uploads` | Uploaded files |
| `backend_data` | `/app/logs` | Application logs |
| `backend_db` | `/app/sidai.db` | SQLite database |

## Environment Variables

Set these in a `.env` file in the project root (referenced by `docker-compose.yml`):

```bash
JWT_SECRET_KEY=your-secure-secret-here
GOOGLE_API_KEY=your-google-api-key
GOOGLE_CSE_ID=your-cse-id
```

## Building Individual Images

```bash
# Backend only
docker build -t sidai-backend -f backend/Dockerfile backend/

# Frontend only
docker build -t sidai-frontend -f frontend/Dockerfile frontend/
```

## Model Location

The GGUF model file (`sid-ai-q4_k_m.gguf`) must be in the `outputs/` directory before starting. Docker mounts this directory into the llama-server container at `/models`.

## Production Deployment

For production, consider:

1. Using a managed PostgreSQL database instead of SQLite
2. Setting up a reverse proxy (Nginx/Traefik) with SSL
3. Using Redis for distributed rate limiting
4. Scaling with multiple backend replicas behind a load balancer
