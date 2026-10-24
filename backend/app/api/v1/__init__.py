from fastapi import APIRouter
from backend.app.api.v1.products import router as products_router
from backend.app.api.v1.competitors import router as competitors_router
from backend.app.api.v1.research import router as research_router
from backend.app.api.v1.internal import router as internal_router
from backend.app.api.v1.validation import router as validation_router, projects_router
from backend.app.api.v1.versions import router as versions_router
from backend.app.api.v1.reports import router as reports_router
from backend.app.api.v1.influencers import router as influencers_router

from sqlalchemy import text
from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
import logging

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


api_v1_router.include_router(products_router)
api_v1_router.include_router(competitors_router)
api_v1_router.include_router(research_router)
api_v1_router.include_router(internal_router)
api_v1_router.include_router(validation_router)
api_v1_router.include_router(projects_router)
api_v1_router.include_router(versions_router)
api_v1_router.include_router(reports_router)
api_v1_router.include_router(influencers_router)

__all__ = ["api_v1_router"]

