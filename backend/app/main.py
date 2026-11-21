import uuid
from typing import Callable
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.core.logging import setup_logging, request_id_ctx_var, logger
from backend.app.core.errors import (
    AppError,
    app_error_handler,
    validation_error_handler,
    http_exception_handler,
    unhandled_exception_handler,
)
from backend.app.api.v1 import api_v1_router

# Initialize logging
setup_logging(settings.LOG_LEVEL)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)


# Request-ID and Hardening Middleware
@app.middleware("http")
async def request_id_middleware(request: Request, call_next: Callable) -> Response:
    incoming_id = request.headers.get("X-Request-ID")
    request_id = incoming_id if incoming_id else str(uuid.uuid4())

    request.state.request_id = request_id
    token = request_id_ctx_var.set(request_id)

    # Check request body size limit
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > settings.MAX_REQUEST_BODY_BYTES:
                from fastapi.responses import JSONResponse
                return JSONResponse(
                    status_code=413,
                    content={
                        "error": {
                            "code": "PAYLOAD_TOO_LARGE",
                            "message": f"Request body exceeds maximum allowed size of {settings.MAX_REQUEST_BODY_BYTES} bytes",
                            "details": [],
                            "request_id": request_id,
                        }
                    },
                    headers={"X-Request-ID": request_id},
                )
        except ValueError:
            pass

    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
    finally:
        request_id_ctx_var.reset(token)


# Register Exception Handlers
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)


@app.get("/health", tags=["Health"])
def health_check():
    db_status = "connected"
    try:
        db = SessionLocal()
        try:
            db.execute(text("SELECT 1"))
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"Healthcheck DB ping failed: {e}")
        db_status = "disconnected"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "version": settings.VERSION,
    }


# Include API v1 Router
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)

