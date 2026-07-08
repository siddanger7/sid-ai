import time
import uuid
from collections import defaultdict

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("X-Request-ID", uuid.uuid4().hex[:12])
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 60, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown").split(",")[0].strip()
        now = time.time()
        window_start = now - self.window_seconds

        self.requests[client_ip] = [t for t in self.requests[client_ip] if t > window_start]

        if len(self.requests[client_ip]) >= self.max_requests:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=429,
                content={"error": "rate_limit_exceeded", "detail": f"Max {self.max_requests} requests per {self.window_seconds}s exceeded"},
            )

        self.requests[client_ip].append(now)
        return await call_next(request)


class MetricsCollector:
    def __init__(self):
        self.lock = None
        self.reset()

    def reset(self):
        self.total_requests = 0
        self.total_errors = 0
        self.total_tokens_generated = 0
        self.start_time = time.time()
        self.durations: list[float] = []

    def record(self, duration: float, is_error: bool = False):
        self.total_requests += 1
        if is_error:
            self.total_errors += 1
        self.durations.append(duration)
        if len(self.durations) > 1000:
            self.durations = self.durations[-1000:]

    def snapshot(self) -> dict:
        uptime = time.time() - self.start_time
        avg_duration = sum(self.durations) / len(self.durations) if self.durations else 0.0
        return {
            "uptime_seconds": round(uptime, 1),
            "total_requests": self.total_requests,
            "total_errors": self.total_errors,
            "error_rate": round(self.total_errors / max(self.total_requests, 1), 4),
            "avg_duration_ms": round(avg_duration * 1000, 1),
            "requests_per_minute": round(self.total_requests / max(uptime / 60, 1), 1),
        }


metrics = MetricsCollector()


class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start = time.time()
        response = await call_next(request)
        duration = time.time() - start
        is_error = response.status_code >= 500
        metrics.record(duration, is_error=is_error)
        return response
