from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from backend.app.schemas.validation import FindingResponse, StageResultResponse


class AssumptionsPatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    patch: Dict[str, Any]
    revalidate: bool = False


class ImpactEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    from_version: int
    to_version: int
    changed_fields: List[str]
    affected_stages: List[str]
    rerun_run_id: Optional[UUID] = None
    before: Dict[str, Any]
    after: Dict[str, Any]
    created_at: datetime


class AssumptionsPatchResponse(BaseModel):
    new_version: int
    version_id: UUID
    changed_fields: List[str]
    affected_stages: List[str]
    impact_event: Optional[ImpactEventResponse] = None
    results: Optional[List[StageResultResponse]] = None


class StageDelta(BaseModel):
    status_before: Optional[str] = None
    status_after: Optional[str] = None
    metric_deltas: Dict[str, Any] = Field(default_factory=dict)
    findings_added: List[FindingResponse] = Field(default_factory=list)
    findings_removed: List[FindingResponse] = Field(default_factory=list)


class VersionCompareResponse(BaseModel):
    product_id: UUID
    version_a: int
    version_b: int
    stages: Dict[str, StageDelta]


class ImpactEventListResponse(BaseModel):
    items: List[ImpactEventResponse]
    total: int
    limit: int
    offset: int

