import secrets
import time
from collections import defaultdict
from typing import Dict, List, Optional
from fastapi import Request
from fastapi.responses import JSONResponse

from backend.app.core.config import settings

# In-memory per-IP sliding window rate limiting
_rate_limit_records: Dict[str, List[float]] = defaultdict(list)


def reset_rate_limits() -> None:
    """Utility to clear in-memory rate limits (used in unit tests)."""
    _rate_limit_records.clear()


def check_auth_and_rate_limit(request: Request, request_id: str) -> Optional[JSONResponse]:
    """Applies Day 5 authentication and in-memory rate limiting guards."""
    method = request.method.upper()
    path = request.url.path.lower()

    # Only protect mutating POST routes specified in the prompt:
    # POST research, validate, revalidate, simulate, report routes, and internal ingest routes.
    # Reads (GET) and /health stay open.
    is_protected_post = method == "POST" and (
        "/research" in path
        or "/validation" in path
        or "/validate" in path
        or "/revalidate" in path
        or "/simulate" in path
        or "/reports" in path
        or "/internal/" in path
    )

    if not is_protected_post:
        return None

    # 1. Authentication Check (Constant-time comparison)
    if settings.AUTH_ENABLED:
        api_key = request.headers.get("X-API-Key")
        if not api_key:
            return JSONResponse(
                status_code=401,
                content={
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "Missing required authentication header 'X-API-Key'.",
                        "details": [],
                        "request_id": request_id,
                    }
                },
                headers={"X-Request-ID": request_id},
            )

        expected_key = settings.APP_API_KEY or ""
        if not secrets.compare_digest(api_key, expected_key):
            return JSONResponse(
                status_code=403,
                content={
                    "error": {
                        "code": "FORBIDDEN",
                        "message": "Invalid API key supplied in 'X-API-Key' header.",
                        "details": [],
                        "request_id": request_id,
                    }
                },
                headers={"X-Request-ID": request_id},
            )

    # 2. Rate Limiting Check (per-IP on POST research and POST validate)
    is_rate_limited = method == "POST" and (
        "/research" in path or "/validate" in path or "/validation" in path or "/revalidate" in path
    )
    if is_rate_limited:
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = 60.0  # 1 minute

        is_research = "/research" in path
        limit = (
            settings.RATE_LIMIT_RESEARCH_PER_MINUTE
            if is_research
            else settings.RATE_LIMIT_VALIDATE_PER_MINUTE
        )
        action_key = f"{client_ip}:{'research' if is_research else 'validate'}"

        timestamps = _rate_limit_records[action_key]
        # Prune old timestamps
        valid_timestamps = [t for t in timestamps if now - t < window]
        _rate_limit_records[action_key] = valid_timestamps

        if len(valid_timestamps) >= limit:
            return JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Rate limit of {limit} requests per minute exceeded for this IP.",
                        "details": [],
                        "request_id": request_id,
                    }
                },
                headers={"X-Request-ID": request_id},
            )

        _rate_limit_records[action_key].append(now)

    return None
