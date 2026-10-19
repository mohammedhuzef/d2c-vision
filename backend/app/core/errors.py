from typing import Any, Dict, List, Optional
from fastapi import Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.app.core.logging import logger, request_id_ctx_var


class AppError(Exception):
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[List[Dict[str, str]]] = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or []


class NotFoundError(AppError):
    def __init__(self, message: str, details: Optional[List[Dict[str, str]]] = None):
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details=details,
        )


class ConflictError(AppError):
    def __init__(self, message: str, details: Optional[List[Dict[str, str]]] = None):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=status.HTTP_409_CONFLICT,
            details=details,
        )


class BadStateError(AppError):
    def __init__(self, message: str, details: Optional[List[Dict[str, str]]] = None):
        super().__init__(
            message=message,
            code="BAD_STATE",
            status_code=status.HTTP_409_CONFLICT,
            details=details,
        )


class ValidationError(AppError):
    def __init__(self, message: str, details: Optional[List[Dict[str, str]]] = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=422,
            details=details,
        )


class InternalError(AppError):
    def __init__(self, message: str = "An internal error occurred", details: Optional[List[Dict[str, str]]] = None):
        super().__init__(
            message=message,
            code="INTERNAL",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
        )


def _format_error_response(
    code: str,
    message: str,
    details: List[Dict[str, str]],
    request_id: Optional[str] = None,
) -> Dict[str, Any]:
    return {
        "error": {
            "code": code,
            "message": message,
            "details": details,
            "request_id": request_id or request_id_ctx_var.get() or "",
        }
    }


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", request_id_ctx_var.get() or "")
    logger.warning(f"AppError [{exc.code}] {exc.message} - Request ID: {request_id}")
    return JSONResponse(
        status_code=exc.status_code,
        content=_format_error_response(
            code=exc.code,
            message=exc.message,
            details=exc.details,
            request_id=request_id,
        ),
    )


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", request_id_ctx_var.get() or "")
    details = []
    for err in exc.errors():
        loc = err.get("loc", [])
        field_parts = [str(p) for p in loc if p not in ("body", "query", "path")]
        field_path = ".".join(field_parts) if field_parts else "body"
        msg = err.get("msg", "Invalid value")
        details.append({"field": field_path, "issue": msg})

    return JSONResponse(
        status_code=422,
        content=_format_error_response(
            code="VALIDATION_ERROR",
            message="Request validation failed",
            details=details,
            request_id=request_id,
        ),
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    request_id = getattr(request.state, "request_id", request_id_ctx_var.get() or "")
    code = "NOT_FOUND" if exc.status_code == 404 else "INTERNAL"
    if exc.status_code == 409:
        code = "CONFLICT"
    elif exc.status_code == 422:
        code = "VALIDATION_ERROR"

    return JSONResponse(
        status_code=exc.status_code,
        content=_format_error_response(
            code=code,
            message=str(exc.detail),
            details=[],
            request_id=request_id,
        ),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", request_id_ctx_var.get() or "")
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=_format_error_response(
            code="INTERNAL",
            message="An unexpected internal server error occurred",
            details=[],
            request_id=request_id,
        ),
    )
