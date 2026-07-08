from __future__ import annotations
import asyncio
import json
import logging
import queue
import threading
from collections import OrderedDict
from typing import AsyncGenerator

import httpx

from config import OPENAI_API_KEY, OPENAI_BASE_URL, OPENAI_MODEL, LLAMA_SERVER_URL
from rag import build_rag_context

logger = logging.getLogger("SID.AI")

SYSTEM_PROMPT = (
    "You are SID.AI, an intelligent AI assistant created by Siddiq Mohamed. "
    "Be helpful, accurate, professional, and concise."
)

# ---------------------------------------------------------------------------
#  Prompt cache (LRU, 128 entries)
# ---------------------------------------------------------------------------
_cache: OrderedDict[str, str] = OrderedDict()
_CACHE_MAXSIZE = 128


def _cache_key(messages: list[dict], **params) -> str:
    return json.dumps([messages, params], sort_keys=True, ensure_ascii=False)


def _cached_response(messages: list[dict], **params) -> str | None:
    key = _cache_key(messages, **params)
    if key in _cache:
        _cache.move_to_end(key)
        logger.debug("Prompt cache hit")
        return _cache[key]
    return None


def _store_cache(messages: list[dict], response: str, **params) -> None:
    key = _cache_key(messages, **params)
    _cache[key] = response
    _cache.move_to_end(key)
    while len(_cache) > _CACHE_MAXSIZE:
        _cache.popitem(last=False)


# ---------------------------------------------------------------------------
#  Endpoint resolution (auto-detect based on OPENAI_API_KEY)
# ---------------------------------------------------------------------------

def _using_openai() -> bool:
    return bool(OPENAI_API_KEY)


def _llm_headers() -> dict:
    if _using_openai():
        return {"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"}
    return {"Content-Type": "application/json"}


def _llm_url() -> str:
    if _using_openai():
        return f"{OPENAI_BASE_URL.rstrip('/')}/chat/completions"
    return LLAMA_SERVER_URL


def _add_provider_fields(payload: dict) -> dict:
    if _using_openai():
        payload["model"] = OPENAI_MODEL
    return payload


# ---------------------------------------------------------------------------
#  Payload builder
# ---------------------------------------------------------------------------

def build_payload(
    messages: list[dict],
    stream: bool = False,
    max_tokens: int = 512,
    temperature: float = 0.7,
    top_p: float = 0.9,
) -> dict:
    last_user_msg = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
    )
    rag_context = build_rag_context(last_user_msg)

    system = SYSTEM_PROMPT
    if rag_context:
        system += "\n\n" + rag_context

    full_messages = [{"role": "system", "content": system}] + messages
    return _add_provider_fields({
        "messages": full_messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "top_p": top_p,
        "stream": stream,
    })


# ---------------------------------------------------------------------------
#  Sync inference
# ---------------------------------------------------------------------------

def generate_response(
    messages: list[dict],
    max_tokens: int = 512,
    temperature: float = 0.7,
    top_p: float = 0.9,
) -> str:
    cached = _cached_response(messages, max_tokens=max_tokens, temperature=temperature, top_p=top_p)
    if cached is not None:
        return cached

    payload = build_payload(messages, stream=False, max_tokens=max_tokens, temperature=temperature, top_p=top_p)
    try:
        with httpx.Client(timeout=httpx.Timeout(60.0, connect=10.0)) as client:
            resp = client.post(_llm_url(), json=payload, headers=_llm_headers())
            resp.raise_for_status()
            data = resp.json()
            text = data["choices"][0]["message"]["content"].strip()
            _store_cache(messages, text, max_tokens=max_tokens, temperature=temperature, top_p=top_p)
            return text
    except httpx.HTTPStatusError as e:
        logger.error("LLM returned %s: %s", e.response.status_code, e.response.text[:500])
        raise RuntimeError(f"LLM provider returned status {e.response.status_code}")
    except Exception as e:
        logger.exception("LLM call failed")
        raise


# ---------------------------------------------------------------------------
#  Streaming inference (sync httpx in a thread — more reliable)
# ---------------------------------------------------------------------------

def _parse_sse_token(line: str) -> str | None:
    """Parse a single SSE data line, return token, '[DONE]', or None."""
    if not line.startswith("data: "):
        return None
    data = line[6:]
    if data == "[DONE]":
        return "[DONE]"
    try:
        parsed = json.loads(data)
        token = parsed.get("choices", [{}])[0].get("delta", {}).get("content", "")
        return token if token else None
    except (json.JSONDecodeError, IndexError, KeyError):
        return None


def _stream_worker(
    messages: list[dict],
    max_tokens: int,
    temperature: float,
    top_p: float,
    q: queue.Queue,
) -> None:
    """Run in a background thread, put tokens into the queue."""
    payload = build_payload(messages, stream=True, max_tokens=max_tokens, temperature=temperature, top_p=top_p)
    try:
        with httpx.Client(timeout=httpx.Timeout(120.0, connect=10.0)) as client:
            with client.stream("POST", _llm_url(), json=payload, headers=_llm_headers()) as resp:
                if not resp.is_success:
                    error_body = resp.read()
                    msg = f"LLM error: {resp.status_code} — {error_body.decode('utf-8', errors='replace')[:300]}"
                    logger.error(msg)
                    q.put(("error", msg))
                    return

                for raw in resp.iter_lines():
                    line = raw.decode() if isinstance(raw, bytes) else raw
                    token = _parse_sse_token(line.strip())
                    if token == "[DONE]":
                        q.put(("done", None))
                        return
                    if token:
                        q.put(("token", token))
        q.put(("done", None))
    except Exception as e:
        logger.exception("LLM streaming worker failed")
        q.put(("error", str(e)))


async def generate_response_stream(
    messages: list[dict],
    max_tokens: int = 512,
    temperature: float = 0.7,
    top_p: float = 0.9,
) -> AsyncGenerator[str, None]:
    q: queue.Queue = queue.Queue()
    t = threading.Thread(
        target=_stream_worker,
        args=(messages, max_tokens, temperature, top_p, q),
        daemon=True,
    )
    t.start()

    loop = asyncio.get_event_loop()
    while True:
        kind, value = await loop.run_in_executor(None, q.get)
        if kind == "done":
            break
        if kind == "error":
            yield f"[Error: {value}]"
            return
        if kind == "token":
            yield value
