"""Pydantic v2 schemas for Product Versions and Version Comparison."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ProductVersionResponse(BaseModel):
    id: str
    product_id: str
    version_number: int
    assumptions: Dict[str, Any]
    change_summary: Dict[str, Any] = Field(default_factory=dict)
    created_at: str
    created_by: Optional[str] = None


class ProductVersionListResponse(BaseModel):
    items: List[ProductVersionResponse]


class StageDelta(BaseModel):
    stage: Optional[str] = None
    status_before: Optional[str] = None
    status_after: Optional[str] = None
    metric_deltas: Dict[str, Any] = Field(default_factory=dict)
    findings_added: List[Any] = Field(default_factory=list)
    findings_removed: List[Any] = Field(default_factory=list)


class VersionCompareResponse(BaseModel):
    product_id: str
    version_a: int
    version_b: int
    stages: Dict[str, StageDelta]
    stage_deltas: Optional[Dict[str, StageDelta]] = None
    from_version: Optional[int] = None
    to_version: Optional[int] = None
