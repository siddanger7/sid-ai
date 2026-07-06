import asyncio
import json
import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, field_validator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from auth import router as auth_router
from config import CORS_ORIGINS, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW
from conversations import router as conversations_router
from database import init_db, get_session, Message
from dependencies import get_current_user
from logging_config import setup_logging
from upload import router as upload_router
from search import router as search_router
from middleware import (
    MetricsMiddleware,
    RequestIDMiddleware,
    RateLimitMiddleware,
    SecurityHeadersMiddleware,
    metrics,
)
from model import generate_response, generate_response_stream

logger = setup_logging()

# ---------------------------------------------------------------------------
#  App lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initialising database…")
    await init_db()
    logger.info("Database ready")
    yield
    logger.info("Shutting down — cleaning up resources")
    from database import async_engine
    await async_engine.dispose()


# ---------------------------------------------------------------------------
#  App instance
# ---------------------------------------------------------------------------

app = FastAPI(title="SID.AI API", lifespan=lifespan)

# -- Middleware (order matters: outermost first) --
app.add_middleware(GZipMiddleware, minimum_size=1024)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
)
app.add_middleware(MetricsMiddleware)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests=RATE_LIMIT_MAX, window_seconds=RATE_LIMIT_WINDOW)

app.include_router(auth_router)
app.include_router(conversations_router)
app.include_router(upload_router)
app.include_router(search_router)

MAX_MESSAGE_LENGTH = 10_000
MAX_MESSAGES = 50


# ---------------------------------------------------------------------------
#  Chat request model
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    messages: list[dict] | None = None
    message: str | None = None
    conversation_id: str | None = None
    max_tokens: int | None = None
    temperature: float | None = None
    top_p: float | None = None

    @field_validator("messages")
    @classmethod
    def validate_messages(cls, v: list[dict] | None) -> list[dict] | None:
        if v is None:
            return v
        if len(v) > MAX_MESSAGES:
            raise ValueError(f"Too many messages (max {MAX_MESSAGES})")
        for i, msg in enumerate(v):
            if not isinstance(msg, dict):
                raise ValueError(f"Message {i} must be an object")
            if "role" not in msg or "content" not in msg:
                raise ValueError(f"Message {i} must have 'role' and 'content'")
            if msg["role"] not in ("user", "assistant", "system"):
                raise ValueError(f"Message {i} has invalid role '{msg['role']}'")
            if not isinstance(msg["content"], str) or len(msg["content"]) > MAX_MESSAGE_LENGTH:
                raise ValueError(f"Message {i} content exceeds {MAX_MESSAGE_LENGTH} chars")
        return v

    @field_validator("message")
    @classmethod
    def validate_single_message(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if len(v) > MAX_MESSAGE_LENGTH:
            raise ValueError(f"Message exceeds {MAX_MESSAGE_LENGTH} characters")
        return v

    @field_validator("temperature")
    @classmethod
    def validate_temperature(cls, v: float | None) -> float | None:
        if v is not None and not (0.0 <= v <= 2.0):
            raise ValueError("temperature must be between 0.0 and 2.0")
        return v

    @field_validator("top_p")
    @classmethod
    def validate_top_p(cls, v: float | None) -> float | None:
        if v is not None and not (0.0 <= v <= 1.0):
            raise ValueError("top_p must be between 0.0 and 1.0")
        return v

    @field_validator("max_tokens")
    @classmethod
    def validate_max_tokens(cls, v: int | None) -> int | None:
        if v is not None and not (1 <= v <= 4096):
            raise ValueError("max_tokens must be between 1 and 4096")
        return v


def _gen_params(request: ChatRequest) -> dict:
    return {
        "max_tokens": request.max_tokens or 512,
        "temperature": request.temperature or 0.7,
        "top_p": request.top_p or 0.9,
    }


def _resolve_messages(request: ChatRequest) -> list[dict]:
    if request.messages is not None:
        return request.messages
    if request.message is not None:
        return [{"role": "user", "content": request.message}]
    raise HTTPException(status_code=400, detail="messages or message required")


# ---------------------------------------------------------------------------
#  Public endpoints
# ---------------------------------------------------------------------------

@app.get("/")
@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/ready")
async def readiness():
    from database import async_engine
    try:
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        logger.warning("Readiness check failed: %s", e)
        return JSONResponse(status_code=503, content={"status": "not ready", "detail": str(e)})


@app.get("/metrics")
def get_metrics():
    return metrics.snapshot()


# ---------------------------------------------------------------------------
#  Chat (non‑streaming)
# ---------------------------------------------------------------------------

@app.post("/chat")
async def chat(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    try:
        msgs = _resolve_messages(request)
        params = _gen_params(request)
        answer = await asyncio.to_thread(
            generate_response, msgs,
            max_tokens=params["max_tokens"],
            temperature=params["temperature"],
            top_p=params["top_p"],
        )

        if request.conversation_id:
            msg = Message(
                id=uuid.uuid4().hex,
                conversation_id=request.conversation_id,
                role="assistant",
                content=answer,
            )
            session.add(msg)
            await session.commit()

        return {"response": answer}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Inference failed")
        return {"error": "inference_error", "response": "Sorry, I encountered an error while generating a response."}


# ---------------------------------------------------------------------------
#  Chat (streaming via SSE)
# ---------------------------------------------------------------------------

@app.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    user=Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    msgs = _resolve_messages(request)
    params = _gen_params(request)

    if request.conversation_id:
        user_msg = Message(
            id=uuid.uuid4().hex,
            conversation_id=request.conversation_id,
            role="user",
            content=msgs[-1]["content"] if msgs else "",
        )
        session.add(user_msg)
        await session.commit()

    async def event_stream():
        async for token in generate_response_stream(
            msgs,
            max_tokens=params["max_tokens"],
            temperature=params["temperature"],
            top_p=params["top_p"],
        ):
            yield f"data: {json.dumps({'token': token})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    })


# ---------------------------------------------------------------------------
#  Error handlers
# ---------------------------------------------------------------------------

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    logger.warning("Validation error: %s", exc)
    return JSONResponse(status_code=422, content={"error": "validation_error", "detail": str(exc)})


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(status_code=500, content={"error": "Internal server error"})
