# Troubleshooting Guide

## Common Issues

### "Connection refused" when connecting to llama-server

**Cause:** The LLM server is not running or started on a different port.

**Solution:**
1. Verify llama-server is running: `curl http://127.0.0.1:8081/v1/models`
2. Check the correct port in `backend/config.py` or the `LLAMA_SERVER_URL` env var.
3. Restart llama-server with the correct port.

---

### "ModuleNotFoundError: No module named 'bcrypt'"

**Cause:** Missing or incompatible bcrypt installation.

**Solution:**
```bash
pip uninstall bcrypt py-bcrypt
pip install bcrypt==4.3.0
```

---

### "sqlalchemy.exc.InvalidRequestError: Table 'users' already exists"

**Cause:** The SQLite database was partially created from a previous run.

**Solution:**
```bash
# Delete the database and restart
rm backend/sidai.db
```

---

### File upload fails with "413 Request Entity Too Large"

**Cause:** Nginx or reverse proxy limit.

**Solution:**
Add to your Nginx config:
```nginx
client_max_body_size 20M;
```

---

### "Rate limit exceeded" during normal use

**Cause:** The per-IP rate limit (60 requests/minute) is too low for your use case.

**Solution:**
Increase the limit via env vars:
```bash
RATE_LIMIT_MAX=120
RATE_LIMIT_WINDOW=60
```

---

### Frontend shows blank page

**Cause:** JavaScript error or missing API URL.

**Solution:**
1. Open browser developer tools (F12) → Console tab.
2. Check that `NEXT_PUBLIC_API_URL` is set correctly in `.env.local`.
3. Verify the backend is reachable from the browser.

---

### "Invalid or expired token"

**Cause:** The JWT token has expired or was tampered with.

**Solution:**
1. Log out and sign in again.
2. Check that the system clock is synchronized (JWT relies on accurate time).
3. Increase `JWT_EXPIRE_HOURS` if tokens expire too quickly.

---

### Streaming chat hangs or never finishes

**Cause:** llama-server timeout or network issue.

**Solution:**
1. Check llama-server logs for errors.
2. Reduce `max_tokens` in the request.
3. Ensure `X-Accel-Buffering: no` header is present (it is set by default).
4. For Nginx: add `proxy_buffering off;` to the location block.

---

### Web search returns 501

**Cause:** `GOOGLE_API_KEY` or `GOOGLE_CSE_ID` not set.

**Solution:**
1. Obtain credentials from [Google Programmable Search Engine](https://programmablesearchengine.google.com/).
2. Set them as environment variables in the backend process.

---

### RAG not finding relevant documents

**Cause:** Documents were not uploaded or the query doesn't match.

**Solution:**
1. Verify files were uploaded successfully (check `/upload` response for `chunks_indexed > 0`).
2. Check the ChromaDB path (`backend/chroma_db/`).
3. Try re-uploading the document.
