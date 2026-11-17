"""API v1 router registry."""

import logging
from fastapi import APIRouter
from sqlalchemy import text

from backend.app.api.v1.impact_events import router as impact_events_router
from backend.app.api.v1.products import router as products_router
from backend.app.api.v1.validation import router as validation_router
from backend.app.api.v1.versions import router as versions_router
from backend.app.core.config import settings
from backend.app.core.database import SessionLocal

logger = logging.getLogger(__name__)

api_v1_router = APIRouter()


@api_v1_router.get("/health", tags=["Health"])
def api_v1_health_check():
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


# Include subrouters
api_v1_router.include_router(products_router)
api_v1_router.include_router(versions_router)
api_v1_router.include_router(impact_events_router)
api_v1_router.include_router(validation_router)

__all__ = ["api_v1_router"]
