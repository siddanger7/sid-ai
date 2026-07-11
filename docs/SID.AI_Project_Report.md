# SID.AI — Full Project Report

**Author:** Siddiq Mohamed
**Project:** SID.AI — Personal AI Chat Assistant
**Timeline:** Initial development → July 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Inspiration & Goals](#2-inspiration--goals)
3. [Tech Stack & Resources Used](#3-tech-stack--resources-used)
4. [Project Structure](#4-project-structure)
5. [Phase-by-Phase Development Log](#5-phase-by-phase-development-log)
6. [Deployment Architecture](#6-deployment-architecture)
7. [Challenges & Solutions](#7-challenges--solutions)
8. [Future Plans](#8-future-plans)

---

## 1. Project Overview

SID.AI is a full-stack AI chat application that I built from scratch. It features:

- **Chat interface** with real-time streaming responses
- **Authentication** via Google Sign-In (JWT-based)
- **Conversation history** saved per user
- **RAG (Retrieval-Augmented Generation)** — upload PDFs/TXT/MD/CSV files and ask questions about them
- **Web search** integration via Google Custom Search
- **Dual-mode inference** — uses Groq's free cloud API when available, falls back to local GGUF model via llama.cpp

The project is fully deployed and accessible at:
- **Frontend:** https://sid-ai-gamma.vercel.app
- **Backend:** https://sidai-backend.onrender.com

---

## 2. Inspiration & Goals

I wanted to build my own AI assistant that I could fully control — not just a wrapper around ChatGPT. My goals were:

1. **Ownership** — Have my own fine-tuned model that reflects my data and use cases
2. **Privacy** — Option to run everything locally without sending data to third parties
3. **Learning** — Understand the full stack of a modern AI application: training, quantization, backend APIs, frontend, and deployment
4. **Cost-effective** — Run on free tiers as much as possible

---

## 3. Tech Stack & Resources Used

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.2.10 | React framework with App Router |
| React | 19.2.4 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first styling |
| Framer Motion | 12.42.2 | Animations |
| shadcn/ui | 4.13.0 | UI component primitives |
| Lucide React | 1.23.0 | Icons |
| Axios | 1.18.1 | HTTP client |
| React Markdown | 10.1.0 | Render LLM markdown responses |
| React Syntax Highlighter | 16.1.1 | Code block highlighting |
| next-themes | 0.4.6 | Dark/light mode |
| Vitest | 4.x | Unit testing |
| Playwright | 1.61.1 | E2E testing |
| Testing Library | 16.x | Component testing |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Python | 3.12 | Runtime |
| FastAPI | 0.115+ | Async web framework |
| Uvicorn | 0.32+ | ASGI server |
| SQLAlchemy | 2.0+ | Async ORM |
| aiosqlite | 0.20+ | Async SQLite driver |
| SQLite | — | Database (auth, chat history) |
| python-jose | 3.3+ | JWT token handling |
| bcrypt | 4.0+ | Password hashing |
| httpx | 0.28+ | Async HTTP client for LLM calls |
| Pydantic | 2.0+ | Request/response validation |
| google-auth | 2.0+ | Google OAuth token verification |
| pdfminer.six | — | PDF text extraction (pure Python) |
| chromadb | 1.5+ | Vector database for RAG (optional, heavy) |
| PyTorch | — | Required by chromadb (~2GB, not on free tier) |

### LLM / Model

| Resource | Details |
|---|---|---|
| **Base model** | Qwen2.5-3B-Instruct (unsloth/Qwen2.5-3B-Instruct-bnb-4bit) |
| **Fine-tuning platform** | Lightning AI — NVIDIA L4 GPU (24 GB VRAM) |
| **Fine-tuning framework** | Unsloth + TRL (SFTTrainer) |
| **Fine-tuning method** | QLoRA (4-bit quantized LoRA), rank=16, 7 target modules |
| **Training data** | databricks/databricks-dolly-15k (1000 samples subset) |
| **Training config** | Batch size=2, Grad accumulation=8, Epochs=1, LR=2e-4 |
| **Trainable params** | 29.9M / 3.1B total (~0.96%) |
| **Checkpoint** | `outputs/checkpoint-63/` — 63 steps, loss 2.93 → 1.55 |
| **GGUF quantized model** | `outputs/sid-ai-q4_k_m.gguf` (Q4_K_M, 1.93 GB) |
| **Inference engine** | llama.cpp (`llama-server.exe`) |
| **Cloud fallback** | Groq API (free tier) — `llama-3.1-8b-instant`, 30 req/min |

### Cloud Services

| Service | Tier | Purpose |
|---|---|---|---|
| Lightning AI | Free credits | Model training (NVIDIA L4 GPU, 24 GB VRAM) |
| Vercel | Free | Frontend hosting (global CDN) |
| Render | Free | Backend hosting (Python, ephemeral storage) |
| Groq | Free | Cloud LLM inference (LPU hardware) |
| Google Cloud | Free | OAuth 2.0 client ID |
| Google Custom Search | Free | Web search API (100 queries/day) |
| GitHub | Free | Source control |

### Tools & Binaries

| Tool | Details |
|---|---|
| llama.cpp | `llama_bin/` — pre-built Windows binaries (llama-server.exe, etc.) |
| llama-server.exe | Serves GGUF model via OpenAI-compatible API on port 8081 |
| Docker / Docker Compose | Containerized deployment option |
| Nginx | Reverse proxy for VPS deployment |
| systemd | Service manager for VPS deployment |
| Certbot | SSL certificate automation |

---

## 4. Project Structure

```
AI-Agent/
├── backend/                  # FastAPI backend (Python)
│   ├── app.py                # Main app, chat endpoints, middleware setup
│   ├── auth.py               # Authentication (Google OAuth, JWT)
│   ├── config.py             # Environment variable configuration
│   ├── conversations.py      # Conversation CRUD
│   ├── database.py           # SQLAlchemy models & session
│   ├── dependencies.py       # Auth dependency injection
│   ├── logging_config.py     # Structured JSON logging
│   ├── middleware.py         # Rate limiting, metrics, security headers
│   ├── model.py              # LLM inference client with prompt caching
│   ├── rag.py                # RAG: ChromaDB + in-memory keyword fallback
│   ├── search.py             # Google Custom Search integration
│   ├── upload.py             # File upload & PDF extraction
│   ├── tests/                # pytest test suite
│   ├── requirements.txt      # Full dev dependencies
│   ├── prod-requirements.txt # Minimal production dependencies
│   └── Dockerfile
├── frontend/                 # Next.js frontend
│   ├── app/                  # App router pages & layout
│   ├── components/           # React components
│   │   ├── auth/LoginModal.tsx
│   │   ├── chat/             # ChatWindow, ChatBubble, etc.
│   │   ├── input/            # MessageInput, AttachmentButton
│   │   ├── layout/           # Sidebar, Header, Background
│   │   ├── settings/         # SettingsModal
│   │   └── ui/               # shadcn/ui primitives
│   ├── context/              # AuthContext, ChatContext
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API client (auth.ts, chat.ts)
│   ├── tests/                # Vitest & Playwright tests
│   └── vercel.json           # Vercel deployment config
├── deploy/                   # VPS deployment
│   ├── nginx/sidai.conf
│   └── systemd/              # systemd service files
├── docs/                     # Documentation
│   ├── architecture.md
│   ├── deployment.md
│   ├── setup.md
│   └── ...
├── llama_bin/                # llama.cpp Windows binaries
├── outputs/                  # Trained models
│   ├── sid-ai-q4_k_m.gguf    # Quantized GGUF (1.93 GB)
│   └── checkpoint-63/        # LoRA adapter checkpoint
├── render.yaml               # Render Blueprint config
├── fly.toml                  # Fly.io config
├── railway.json              # Railway config
├── docker-compose.yml        # Full stack orchestration
├── progress.txt              # Detailed progress log
└── README.md
```

---

## 5. Phase-by-Phase Development Log

### Phase 1: Initial Setup & Project Scaffolding

I started by setting up the project structure with a Next.js frontend and FastAPI backend. The initial commits were focused on:

- Setting up the Next.js 16 app with TypeScript and Tailwind CSS v4
- Creating the FastAPI backend with basic health endpoints
- Setting up SQLAlchemy async with SQLite for the database
- Adding JWT-based authentication (email/password signup and login)
- Creating the basic chat UI with message bubbles

**Key resources used:**
- Next.js documentation for App Router setup
- FastAPI documentation for async patterns
- SQLAlchemy 2.0 async documentation

### Phase 2: Chat System & LLM Integration

I built the core chat functionality:

- **POST /chat** endpoint for non-streaming responses
- **POST /chat/stream** endpoint for SSE streaming
- Frontend chat window with message history
- Integrated llama.cpp's `llama-server.exe` as the local inference engine

For the LLM, I used Qwen2.5-3B-Instruct as the base model. The `llama_bin/` folder contains pre-built Windows binaries of llama.cpp, and `start.ps1` orchestrates launching the server, backend, and frontend.

**Key resources used:**
- llama.cpp GitHub repo (https://github.com/ggerganov/llama.cpp)
- Qwen2.5-3B-Instruct on Hugging Face
- SSE (Server-Sent Events) specification

### Phase 3: Training Environment Setup (Lightning AI)

I used **Lightning AI** as my training platform. It provides a cloud GPU environment with Jupyter notebooks, making it easy to iterate on training without worrying about local hardware.

**Platform details:**
- **Platform:** Lightning AI
- **GPU:** NVIDIA L4 (24 GB VRAM)
- **Environment:** Python notebook

**Main libraries installed:**
- Unsloth — 2x faster fine-tuning with optimized kernels
- Transformers — Hugging Face model handling
- TRL — Transformer Reinforcement Learning (SFTTrainer)
- PEFT — Parameter-Efficient Fine-Tuning
- BitsAndBytes — 4-bit quantization
- PyTorch — Deep learning framework
- Accelerate — Multi-GPU / mixed precision support

### Phase 4: Choosing the Base Model

I selected **unsloth/Qwen2.5-3B-Instruct-bnb-4bit** as my base model for several reasons:

- **Small enough for L4 GPU** — 3B parameters fits comfortably in 24 GB VRAM
- **Strong instruction-following** — Qwen2.5-Instruct models are well-trained for chat
- **4-bit quantized** — The bnb-4bit version reduces memory usage significantly
- **Faster training** — Less data movement means quicker iterations
- **Lower VRAM usage** — Leaves room for larger batch sizes or gradient accumulation

### Phase 5: Dataset Selection

I chose the **databricks/databricks-dolly-15k** dataset, a high-quality instruction-following dataset created by Databricks.

**Dataset details:**
- **Source:** databricks/databricks-dolly-15k on Hugging Face
- **Total size:** 15,000+ instruction-response pairs
- **My subset:** 1,000 samples
- **Reason for subset:** Keep training fast while testing the pipeline; full dataset can be used later

I initially inspected the dataset structure, then selected a representative subset for training.

### Phase 6: Fine-Tuning Configuration & Training

I used **QLoRA** (Quantized Low-Rank Adaptation) to fine-tune the model efficiently.

**Training configuration:**

| Setting | Value |
|---|---|
| Quantization | 4-bit (BitsAndBytes) |
| LoRA rank (r) | 16 |
| LoRA alpha | 16 |
| LoRA dropout | 0 |
| Target modules | q_proj, v_proj, o_proj, gate_proj, up_proj, down_proj, k_proj |
| Batch size | 2 |
| Gradient accumulation | 8 |
| Effective batch size | 16 |
| Epochs | 1 |
| Learning rate | 2e-4 |
| Optimizer | AdamW |
| Mixed precision | FP16 |
| Gradient checkpointing | Enabled |

**Training statistics:**
- **Total parameters:** 3.1 billion
- **Trainable parameters:** ~29.9 million (only ~0.96%!)
- **Steps:** 63
- **Loss progression:** 2.93 → 1.55 (steady improvement)
- **Framework:** Unsloth trainer with TRL's SFTTrainer

During training, I monitored GPU utilization and watched the loss decrease steadily. The LoRA adapter was created at the end — only 0.96% of the total model parameters were actually trained, which is the magic of LoRA.

**Training pipeline:**
```
Dataset (1000 samples)
       ↓
Unsloth SFTTrainer
       ↓
4-bit QLoRA fine-tuning
       ↓
Loss: 2.93 → 1.55
       ↓
LoRA adapter saved → outputs/checkpoint-63/
```

### Phase 7: Saving & Inference Testing

After training, I saved:
- **LoRA adapters** — `adapter_model.safetensors`, `adapter_config.json`
- **Tokenizer** — `tokenizer_config.json`, `tokenizer.json`
- **Training state** — `trainer_state.json`, `training_args.bin`

I then wrote inference code to test the model directly inside Lightning AI:

```
User Prompt → Tokenizer → Qwen Model → Generate() → Decoded Response
```

The inference pipeline:
1. Take a user prompt
2. Tokenize it with Qwen's tokenizer
3. Pass through the fine-tuned model
4. Generate response with `model.generate()`
5. Decode the output tokens back to text

I tested several prompts directly in the Lightning AI notebook and the responses were coherent and followed the instruction format.

### Phase 8: GGUF Conversion

After confirming the fine-tuned model worked, I converted the LoRA adapter (merged with the base model) to GGUF format for deployment with llama.cpp:

- **Tool:** `llama-quantize.exe` (from llama.cpp)
- **Quantization:** Q4_K_M
- **Output:** `outputs/sid-ai-q4_k_m.gguf` (1.93 GB)

This GGUF file can be served by `llama-server.exe` on any platform, making it ready for local inference or cloud deployment.

### Phase 9: RAG System

I implemented a full RAG pipeline:

- **Primary:** ChromaDB with all-MiniLM-L6-v2 embeddings for vector search
- **Document processing:** Chunking at 500 characters with 100-character overlap
- **File upload:** Support for PDF, TXT, Markdown, and CSV files
- **Extraction:** Used pymupdf (later switched to pdfminer.six for lighter footprint)
- **Context injection:** Retrieved chunks are injected into the system prompt before LLM inference

**Key resources used:**
- ChromaDB (https://www.trychroma.com/)
- sentence-transformers/all-MiniLM-L6-v2 embeddings
- PyMuPDF (pdfminer.six in production)

### Phase 10: Dual-Mode LLM Provider

I made the backend auto-detect the LLM provider:

- If `OPENAI_API_KEY` is set → use OpenAI-compatible API (Groq, OpenAI, etc.)
- If `OPENAI_API_KEY` is empty → use local llama-server

This was achieved via:
- `config.py` reading environment variables
- `model.py` selecting the endpoint URL, headers, and payload format based on provider
- Frontend `.env.example` documented both modes

Initially used `LLM_PROVIDER` env var, then refactored to auto-detect based on `OPENAI_API_KEY`.

**Key resources used:**
- OpenAI API specification (OpenAI-compatible endpoints)
- Groq API (https://console.groq.com)
- httpx library for async HTTP calls

### Phase 11: Streaming Fix & Quality of Life

I fixed a critical bug where streaming responses would hang indefinitely if the LLM server returned an error. The solution:

- Moved streaming to a background thread using sync httpx (more reliable than async)
- Added proper error detection with `resp.is_success` check
- Yield error tokens instead of hanging forever

Also added:
- Prompt caching (LRU, 128 entries) — avoids redundant LLM calls
- Better logging throughout
- Frontend improvements: SettingsModal with localStorage persistence, Dockerfile build args

### Phase 12: Google OAuth Implementation

I removed the email/password authentication and switched to Google-only sign-in:

**Backend:**
- Added `POST /auth/google` endpoint that verifies Google ID tokens
- Uses `google-auth` library for token verification
- Auto-creates users on first login
- Returns JWT token for subsequent requests

**Frontend:**
- Dynamically loads Google GSI (Google Sign-In) script
- Rewrote LoginModal as a clean Google-only sign-in button
- Removed all email/password forms and tabs
- Updated AuthContext to only expose googleLogin and logout

**Google Cloud Console setup:**
- Created OAuth 2.0 Client ID
- Configured authorized JavaScript origins and redirect URIs
- Client ID: `122309050269-9hroq2jnfueg1v889gvgnaurnsfueimk.apps.googleusercontent.com`

**Key resources used:**
- Google Cloud Console (https://console.cloud.google.com)
- Google Identity Services library (GSI)
- google-auth Python library

### Phase 13: Deployment — Render + Vercel

I deployed the application using free tiers:

**Backend on Render:**
- Used Render Blueprint (`render.yaml`) for infrastructure-as-code
- Python web service with uvicorn
- SQLite database in ephemeral `/tmp` directory
- CORS configured for Vercel frontend URL
- Rate limiting: 60 requests/minute per IP
- Health check at `/health`

**Frontend on Vercel:**
- Configured via `vercel.json`
- Framework preset: Next.js
- Environment variable: `NEXT_PUBLIC_API_URL` pointing to Render backend
- Automatic deployments from GitHub

**Key resources used:**
- Render (https://render.com)
- Vercel (https://vercel.com)
- render.yaml Blueprint documentation

### Phase 14: Production RAG Fixes

When deploying, I discovered that ChromaDB requires PyTorch (~2GB), which exceeds the Render free tier build limits (15 minutes). I implemented:

1. **Graceful degradation** — RAG tries ChromaDB first, falls back smoothly
2. **In-memory keyword search** — A simple fallback that ranks chunks by keyword overlap
3. **Lazy initialization** — ChromaDB is initialized on first use, not at import time
4. **Lightweight PDF extraction** — Switched from pymupdf to pdfminer.six (pure Python, ~6.6 MB)

The `prod-requirements.txt` was created as a minimal dependency set, excluding chromadb and pymupdf.

**Key resources used:**
- pdfminer.six (pure Python PDF extractor)
- Python's standard library for the keyword fallback

### Phase 15: MODEL_NAME Configuration (Latest)

I added a `MODEL_NAME` configuration variable to cleanly distinguish between the default model and the fine-tuned model:

- `config.py`: Added `MODEL_NAME` env var defaulting to `"Qwen/Qwen2.5-3B-Instruct"`
- `model.py`: `_add_provider_fields` now always sends the model field — uses `OPENAI_MODEL` for cloud mode, `MODEL_NAME` for local mode
- This prepares for when I deploy the fine-tuned GGUF model on a GPU instance

---

## 6. Deployment Architecture

### Current (Free Tier)

```
User → Vercel (Frontend) → Render (Backend) → Groq API (Cloud LLM)
                                                  |
                                             llama-3.1-8b-instant
```

- **Frontend:** Vercel Free — global CDN, auto-SSL, instant deployments
- **Backend:** Render Free — Python, SQLite (`/tmp`), cold starts after 15 min idle
- **LLM:** Groq API Free — 30 requests/min, 6000 tokens/min, LPU inference
- **Auth:** Google OAuth via Google Identity Services
- **RAG:** In-memory keyword search (ChromaDB would require paid plan)
- **Web Search:** Google Custom Search API

### Planned (with Oracle Cloud GPU)

```
User → Vercel (Frontend) → Render (Backend) → Oracle VM (Fine-tuned GGUF)
                                                  |
                                            sid-ai-q4_k_m.gguf (1.93 GB)
```

When I complete Oracle Cloud signup, I'll:
1. Provision an A1.Flex instance (4 ARM CPUs, 24 GB RAM)
2. Install llama.cpp and run `llama-server`
3. Point `LLAMA_SERVER_URL` to the Oracle VM
4. Uncomment `MODEL_NAME = "sid-ai-q4_k_m.gguf"` in config

### Alternative Deployment Options

I also configured deployment for:
- **Docker Compose** — Full stack with llama-server container
- **Fly.io** — `fly.toml` configured
- **Railway** — `railway.json` configured
- **VPS** — Nginx + systemd service files ready for Ubuntu deployment

---

## 7. Challenges & Solutions

### Challenge 1: ChromaDB + PyTorch on Free Tier

**Problem:** ChromaDB depends on PyTorch (~2GB), which can't be installed within Render's 15-minute build limit.

**Solution:** I rewrote the RAG system with graceful degradation. When ChromaDB is unavailable, it falls back to an in-memory keyword-based search. The chat continues working regardless, and upgrading to vector search requires only adding chromadb to requirements.

### Challenge 2: Streaming Hangs

**Problem:** The async httpx streaming client would hang forever when the LLM server returned an error status code.

**Solution:** Moved streaming to a background thread using sync httpx, added proper status code checks, and yield error tokens instead of hanging. The `_parse_sse_token` helper robustly handles SSE line parsing.

### Challenge 3: Free LLM Hosting for Custom Model

**Problem:** My fine-tuned GGUF is 1.93 GB — too large for all free tiers (Render: 512MB RAM, Fly.io: 256MB, Vercel: serverless).

**Attempted solutions:**
- Hugging Face Spaces → requires PRO subscription ($9/mo)
- Render → insufficient RAM and disk
- Railway → insufficient RAM

**Current solution:** Using Groq's free API (llama-3.1-8b-instant) as a temporary cloud inference provider.

**Planned solution:** Oracle Cloud Free Tier (4 ARM CPU, 24GB RAM) to run llama-server with the custom GGUF.

### Challenge 4: PDF Extraction on Render

**Problem:** pymupdf has native dependencies that fail to build on Render.

**Solution:** Switched to pdfminer.six — a pure Python PDF extractor with no native dependencies. It's slightly slower but works reliably on all platforms.

### Challenge 5: CORS Origin Trimming

**Problem:** Comma-separated CORS origins had whitespace issues: `"a.com, b.com".split(",")` → `["a.com", " b.com"]`.

**Solution:** Added whitespace trimming and empty string filtering in the CORS parsing logic.

---

## 8. Future Plans

### Short-term

- [ ] Complete Oracle Cloud Free Tier signup
- [ ] Deploy fine-tuned GGUF model on Oracle VM
- [ ] Update `LLAMA_SERVER_URL` and enable `MODEL_NAME` for custom model
- [ ] Add persistent PostgreSQL database (Render offers free 1GB PostgreSQL)

### Medium-term

- [ ] Add conversation search
- [ ] Implement multi-user admin panel
- [ ] Add rate limit by user (not just IP)
- [ ] Improve RAG with better chunking strategies

### Long-term

- [ ] Fine-tune on a larger dataset
- [ ] Add support for image inputs (multimodal)
- [ ] Mobile app with React Native
- [ ] Voice input/output integration

---

## Appendix A: Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `JWT_SECRET_KEY` | (auto-generated) | JWT signing secret |
| `OPENAI_API_KEY` | (empty) | API key for cloud LLM |
| `OPENAI_BASE_URL` | `https://api.groq.com/openai/v1` | LLM API base URL |
| `OPENAI_MODEL` | `llama-3.1-8b-instant` | Cloud model name |
| `MODEL_NAME` | `Qwen/Qwen2.5-3B-Instruct` | Local model name |
| `LLAMA_SERVER_URL` | `http://127.0.0.1:8081/v1/chat/completions` | Local llama-server |
| `DATABASE_URL` | `sqlite+aiosqlite:///./sidai.db` | Database connection |
| `CORS_ORIGINS` | `http://localhost:3000,...` | Allowed origins |
| `GOOGLE_CLIENT_ID` | (empty) | Google OAuth client ID |
| `GOOGLE_API_KEY` | (empty) | Google Custom Search API key |
| `GOOGLE_CSE_ID` | (empty) | Google Custom Search engine ID |
| `RATE_LIMIT_MAX` | 60 | Max requests per window |
| `RATE_LIMIT_WINDOW` | 60 | Rate limit window in seconds |
| `LOG_LEVEL` | `INFO` | Logging level |

## Appendix B: API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Health check |
| GET | `/ready` | No | Readiness check |
| GET | `/metrics` | No | Application metrics |
| POST | `/auth/google` | No | Google OAuth login |
| GET | `/auth/me` | Yes | Get current user |
| POST | `/chat` | Yes | Send message (sync) |
| POST | `/chat/stream` | Yes | Send message (SSE stream) |
| GET | `/conversations` | Yes | List conversations |
| POST | `/conversations` | Yes | Create conversation |
| DELETE | `/conversations/{id}` | Yes | Delete conversation |
| GET | `/conversations/{id}/messages` | Yes | List messages |
| POST | `/conversations/{id}/messages` | Yes | Save message |
| POST | `/upload` | Yes | Upload file |
| POST | `/search` | Yes | Web search |

## Appendix C: Links

- **Frontend (Live):** https://sid-ai-gamma.vercel.app
- **Backend (Live):** https://sidai-backend.onrender.com
- **GitHub Repository:** https://github.com/siddanger/sid-ai
- **Groq Console:** https://console.groq.com
- **Google Cloud Console:** https://console.cloud.google.com
- **Oracle Cloud Signup:** https://signup.cloud.oracle.com
- **Lightning AI:** https://lightning.ai
- **llama.cpp:** https://github.com/ggerganov/llama.cpp
- **Unsloth:** https://github.com/unslothai/unsloth
- **Qwen2.5 on Hugging Face:** https://huggingface.co/Qwen/Qwen2.5-3B-Instruct
- **Databricks Dolly 15k Dataset:** https://huggingface.co/datasets/databricks/databricks-dolly-15k
- **Fine-tuned model (private):** https://huggingface.co/siddanger/sid-ai-model

---

*End of Report — Last updated: July 11, 2026*
