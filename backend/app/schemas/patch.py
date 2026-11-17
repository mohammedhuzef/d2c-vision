"""Pydantic v2 schemas for Assumptions Patch."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from backend.app.schemas.impact import ImpactEventResponse


class AssumptionsPatchRequest(BaseModel):
    patch: Dict[str, Any]
    revalidate: bool = False


class AssumptionsPatchResponse(BaseModel):
    new_version: int
    version_id: str
    changed_fields: List[str]
    affected_stages: List[str]
    impact_event: Optional[ImpactEventResponse] = None
    results: Optional[List[Any]] = None
