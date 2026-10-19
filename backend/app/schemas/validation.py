from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

FindingSeverity = Literal["info", "warning", "critical"]
StageStatus = Literal["PASSED", "WARNING", "FAILED", "INSUFFICIENT_EVIDENCE", "NOT_RUN"]
Verdict = Literal["GO", "GO_WITH_CONDITIONS", "NO_GO", "INSUFFICIENT_EVIDENCE"]
ReadinessLabel = Literal["READY", "READY_WITH_WARNINGS", "NOT_READY", "INSUFFICIENT_EVIDENCE"]


class FindingResponse(BaseModel):
    code: str
    severity: FindingSeverity
    message: str
    evidence_ids: List[UUID] = Field(default_factory=list)
    field: Optional[str] = None


class StageResultResponse(BaseModel):
    stage: str
    status: StageStatus
    score: Optional[float] = None
    metrics: Dict[str, Any] = Field(default_factory=dict)
    findings: List[FindingResponse] = Field(default_factory=list)
    inputs_used: List[str] = Field(default_factory=list)
    upstream_stages_used: List[str] = Field(default_factory=list)
    carried_forward_from: Optional[UUID] = None


class ValidationRunResponse(BaseModel):
    run_id: UUID
    product_id: UUID
    version_id: UUID
    version_number: int
    trigger: str
    stages_run: List[str]
    readiness_score: Optional[float] = None
    verdict: Verdict
    results: List[StageResultResponse]
    started_at: datetime
    finished_at: Optional[datetime] = None


class RevalidateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    stages: Optional[List[str]] = None


# ---------------------------------------------------------------------------
# Step 5B Schemas: Strict typing, Decimal scores, formatted metrics, readiness
# ---------------------------------------------------------------------------

import json
from pydantic import BaseModel, ConfigDict, Field, field_serializer


class ReadinessResponse(BaseModel):
    overall_score: Optional[Decimal] = None
    label: ReadinessLabel
    blocking_stages: List[str] = Field(default_factory=list)
    warning_stages: List[str] = Field(default_factory=list)
    missing_stages: List[str] = Field(default_factory=list)
    breakdown: Dict[str, Any] = Field(default_factory=dict)

    @field_serializer("overall_score", when_used="json")
    def serialize_overall_score(self, v: Optional[Decimal]) -> Optional[float]:
        return json.loads(f"{v:.2f}") if v is not None else None


class StageResultDetailResponse(BaseModel):
    stage: str
    status: StageStatus
    score: Optional[Decimal] = None
    metrics: Dict[str, Any] = Field(default_factory=dict)
    findings: List[FindingResponse] = Field(default_factory=list)
    inputs_used: List[str] = Field(default_factory=list)
    upstream_stages_used: List[str] = Field(default_factory=list)
    carried_forward_from: Optional[UUID] = None

    @field_serializer("score", when_used="json")
    def serialize_score(self, v: Optional[Decimal]) -> Optional[float]:
        return json.loads(f"{v:.2f}") if v is not None else None


class ValidationRunCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    stages: Optional[List[str]] = None


class ValidationRunDetailResponse(BaseModel):
    id: UUID
    project_id: UUID
    version_id: UUID
    version_number: int
    created_at: datetime
    triggered_by: Optional[str] = None
    status: str
    input_fingerprint: Optional[str] = None
    readiness: Optional[ReadinessResponse] = None
    stages_run: List[str]
    results: List[StageResultDetailResponse]
    recommendations: Optional[Dict[str, int]] = None
    started_at: datetime
    finished_at: Optional[datetime] = None


class ValidationRunListResponse(BaseModel):
    items: List[ValidationRunDetailResponse]
    total: int
    limit: int
    offset: int
