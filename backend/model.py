from __future__ import annotations
import json
import logging
from collections import OrderedDict
from typing import AsyncGenerator

import httpx

from config import LLAMA_SERVER_URL
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
    return {
        "messages": full_messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "top_p": top_p,
        "stream": stream,
    }


# ---------------------------------------------------------------------------
#  Sync inference (non‑streaming) with caching
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
        with httpx.Client(timeout=httpx.Timeout(300.0)) as client:
            resp = client.post(LLAMA_SERVER_URL, json=payload)
            resp.raise_for_status()
            data = resp.json()
            text = data["choices"][0]["message"]["content"].strip()
            _store_cache(messages, text, max_tokens=max_tokens, temperature=temperature, top_p=top_p)
            return text
    except Exception as e:
        logger.exception("llama-server call failed")
        raise


# ---------------------------------------------------------------------------
#  Async streaming inference
# ---------------------------------------------------------------------------

async def generate_response_stream(
    messages: list[dict],
    max_tokens: int = 512,
    temperature: float = 0.7,
    top_p: float = 0.9,
) -> AsyncGenerator[str, None]:
    payload = build_payload(messages, stream=True, max_tokens=max_tokens, temperature=temperature, top_p=top_p)
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(300.0)) as client:
            async with client.stream("POST", LLAMA_SERVER_URL, json=payload) as resp:
                buffer = ""
                async for raw in resp.aiter_bytes():
                    buffer += raw.decode("utf-8", errors="replace")
                    while True:
                        line, rest = _parse_sse_line(buffer)
                        if line is None:
                            break
                        buffer = rest
                        if line == "[DONE]":
                            return
                        if line:
                            yield line
    except Exception as e:
        logger.exception("llama-server streaming failed")
        yield f"\n\n[Error: {e}]"


# ---------------------------------------------------------------------------
#  SSE line parser (optimised)
# ---------------------------------------------------------------------------

def _parse_sse_line(buffer: str) -> tuple[str | None, str]:
    """Extract one SSE data line from the buffer.
    Returns (token_or_None, remaining_buffer).
    """
    idx = buffer.find("\n")
    if idx == -1:
        return None, buffer
    line = buffer[:idx].strip()
    rest = buffer[idx + 1:]
    if line.startswith("data: "):
        data = line[6:]
        if data == "[DONE]":
            return "[DONE]", rest
        try:
            parsed = json.loads(data)
            token = parsed.get("choices", [{}])[0].get("delta", {}).get("content", "")
            return token, rest
        except (json.JSONDecodeError, IndexError, KeyError):
            pass
    return None, rest
