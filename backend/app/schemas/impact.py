"""Pydantic v2 schemas for Impact Events."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ImpactEventResponse(BaseModel):
    id: str
    product_id: str
    from_version: int
    to_version: int
    changed_fields: List[str]
    affected_stages: List[str]
    before: Dict[str, Any]
    after: Dict[str, Any]
    rerun_run_id: Optional[str] = None
    created_at: str


class ImpactEventListResponse(BaseModel):
    items: List[ImpactEventResponse]
    total: int
    limit: int
    offset: int
