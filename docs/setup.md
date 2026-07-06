# Setup Guide

## Prerequisites

- **Python 3.12+** — [Download](https://www.python.org/downloads/)
- **Node.js 20+** — [Download](https://nodejs.org/)
- **A GGUF model** — Place your model (e.g., `sid-ai-q4_k_m.gguf`) in the `outputs/` directory.
- **llama.cpp binaries** — Pre-built `llama-server.exe` is in `llama_bin/`. Alternatively, build from [llama.cpp](https://github.com/ggerganov/llama.cpp).

---

## Backend Setup

```powershell
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate it
.\venv\Scripts\Activate.ps1   # Windows
# source venv/bin/activate     # Linux/macOS

# 4. Install dependencies
pip install -r requirements.txt

# 5. (Optional) Install dev/test dependencies
pip install -r dev-requirements.txt

# 6. Configure environment
# Copy .env.example to .env and edit as needed
cp ..\.env.example .env

# 7. Start the backend
uvicorn app:app --host 0.0.0.0 --port 8888 --reload
```

---

## Frontend Setup

```powershell
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

The frontend will be available at http://localhost:3000.

---

## LLM Server Setup

### Option A: Pre-built binary (Windows)

```powershell
.\llama_bin\llama-server.exe -m outputs/sid-ai-q4_k_m.gguf --host 127.0.0.1 --port 8081 -c 4096 -t 6 -ngl 0
```

### Option B: Docker (cross-platform)

```bash
docker run -d -p 8081:8081 -v ./outputs:/models \
  ghcr.io/ggerganov/llama.cpp:full \
  --server --host 0.0.0.0 --port 8081 \
  -m /models/sid-ai-q4_k_m.gguf -c 4096 -t 4
```

### Option C: Build from source

```bash
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
mkdir build && cd build
cmake .. -DLLAMA_CUDA=OFF  # or ON if you have an NVIDIA GPU
cmake --build . --config Release

# Run the server
./bin/llama-server -m ../../outputs/sid-ai-q4_k_m.gguf --host 127.0.0.1 --port 8081 -c 4096 -t 4
```

---

## Running the Full Stack

Use the provided orchestrator script:

```powershell
.\start.ps1
```

This starts llama-server (port 8081), then the FastAPI backend (port 8888).

Start the frontend separately:

```powershell
cd frontend
npm run dev
```

---

## Verifying the Setup

1. **LLM Server:** http://localhost:8081/v1/models should return a JSON response.
2. **Backend:** http://localhost:8888/health should return `{"status": "ok"}`.
3. **Frontend:** http://localhost:3000 should show the SID.AI login screen.

---

## Running Tests

### Backend

```powershell
cd backend
pytest tests/ -v
```

### Frontend Unit Tests

```powershell
cd frontend
npm test
```

### E2E Tests (requires frontend dev server)

```powershell
cd frontend
npm run test:e2e
```
