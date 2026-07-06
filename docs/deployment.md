# Deployment Guide

## Render

1. Fork/push the repository to GitHub.
2. Create a **Web Service** on Render:
   - **Name:** `sidai-backend`
   - **Runtime:** Python
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `cd backend && uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables:** Copy from `.env.example`, set `JWT_SECRET_KEY` to a secure random value.
3. Create a **Static Site** for the frontend:
   - **Name:** `sidai-frontend`
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Publish Directory:** `frontend/out`
   - **Environment Variables:** `NEXT_PUBLIC_API_URL` set to your backend URL.
4. Push and deploy.

Alternatively, use the provided [`render.yaml`](../render.yaml) (Blueprint) — import it from the Render dashboard.

---

## Railway

1. Push the repository to GitHub.
2. On Railway, click **New Project → Deploy from GitHub repo**.
3. Select the repository.
4. Add environment variables from `.env.example`.
5. Railway auto-detects the build commands via `railway.json`.
6. Set `NEXT_PUBLIC_API_URL` to the Railway-generated backend URL.
7. Deploy.

---

## Fly.io

1. Install the Fly CLI: `flyctl install`
2. Authenticate: `flyctl auth login`
3. From the project root:
   ```bash
   flyctl launch --no-deploy
   ```
4. Edit `fly.toml` as needed.
5. Set secrets:
   ```bash
   flyctl secrets set JWT_SECRET_KEY=<random> GOOGLE_API_KEY=<key> GOOGLE_CSE_ID=<id>
   ```
6. Deploy:
   ```bash
   flyctl deploy
   ```

---

## VPS (Ubuntu + Nginx + systemd)

### Prerequisites

- Ubuntu 22.04+ server
- Python 3.12, Node.js 20
- Nginx, Certbot (for SSL)
- Git

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/sid-ai.git /opt/sidai
cd /opt/sidai

# 2. Set up Python virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# 3. Set up frontend
cd frontend
npm install
npm run build
cd ..

# 4. Configure environment
cp .env.example .env
# Edit .env with proper values

# 5. Copy systemd service files
sudo cp deploy/systemd/sidai-backend.service /etc/systemd/system/
sudo cp deploy/systemd/sidai-frontend.service /etc/systemd/system/

# Create the llama-server service
sudo tee /etc/systemd/system/sidai-llama.service << 'EOF'
[Unit]
Description=SID.AI llama-server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/sidai
ExecStart=/opt/sidai/llama_bin/llama-server -m /opt/sidai/outputs/sid-ai-q4_k_m.gguf --host 127.0.0.1 --port 8081 -c 4096 -t 4
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 6. Start services
sudo systemctl daemon-reload
sudo systemctl enable sidai-llama sidai-backend sidai-frontend
sudo systemctl start sidai-llama sidai-backend sidai-frontend

# 7. Configure Nginx
sudo cp deploy/nginx/sidai.conf /etc/nginx/sites-available/sidai
sudo ln -s /etc/nginx/sites-available/sidai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 8. Set up SSL with Certbot
sudo certbot --nginx -d sidai.example.com
```
