"""Pydantic v2 schemas for validation runs, stage results, readiness, and simulations."""

from decimal import Decimal
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, Field


class FindingResponse(BaseModel):
    code: str
    severity: str
    message: str
    field: Optional[str] = None
    evidence_ids: List[str] = Field(default_factory=list)


class StageResultResponse(BaseModel):
    stage: str
    status: str
    score: Optional[float] = None
    metrics: Dict[str, Any] = Field(default_factory=dict)
    findings: List[FindingResponse] = Field(default_factory=list)
    inputs_used: List[str] = Field(default_factory=list)
    upstream_stages_used: List[str] = Field(default_factory=list)
    carried_forward_from: Optional[str] = None


class ValidationRunResponse(BaseModel):
    run_id: str
    product_id: str
    version_id: str
    version_number: int
    trigger: str
    stages_run: List[str]
    readiness_score: Optional[float] = None
    verdict: str
    started_at: str
    finished_at: Optional[str] = None
    results: List[StageResultResponse]


class ValidationRunDetailResponse(BaseModel):
    id: str
    project_id: str
    version_id: str
    version_number: int
    created_at: str
    status: str
    stages_run: List[str]
    results: List[StageResultResponse]
    stage_results: Optional[Dict[str, Any]] = None
    financial_snapshot: Optional[Dict[str, Any]] = None
    readiness: Optional[Dict[str, Any]] = None
    recommendations: Optional[List[Dict[str, Any]]] = None
    input_fingerprint: Optional[str] = None
    started_at: str
    finished_at: Optional[str] = None
    triggered_by: Optional[str] = None


class ValidationRunListResponse(BaseModel):
    items: List[ValidationRunDetailResponse]
    total: int
    limit: int
    offset: int


class ReadinessResponse(BaseModel):
    label: str
    overall_score: Optional[float] = None
    breakdown: Optional[Dict[str, Any]] = None
    blocking_stages: Optional[List[str]] = None
    warning_stages: Optional[List[str]] = None
    missing_stages: Optional[List[str]] = None


class RecommendationItemResponse(BaseModel):
    id: str
    code: str
    stage: str
    priority: str
    title: str
    detail: str
    action_type: str
    target_field: Optional[str] = None
    current_value: Optional[str] = None
    suggested_value: Optional[str] = None
    finding_codes: List[str] = Field(default_factory=list)
    evidence_ids: List[str] = Field(default_factory=list)
    impact: Dict[str, Any] = Field(default_factory=dict)


class RunRecommendationListResponse(BaseModel):
    run_id: str
    project_id: str
    items: List[RecommendationItemResponse]
    total: int
    counts_by_priority: Optional[Dict[str, int]] = None


class LegacyRecommendationResponse(BaseModel):
    id: str
    product_id: str
    version_id: str
    stage: str
    priority: str  # high | medium | low
    title: str
    detail: str
    evidence_ids: List[str] = Field(default_factory=list)
    created_at: str


class RecommendationListResponse(BaseModel):
    items: List[LegacyRecommendationResponse]


class ValidationRunCreateRequest(BaseModel):
    stages: Optional[List[str]] = None
    trigger: Optional[str] = "manual"


class RevalidateRequest(BaseModel):
    stages: Optional[List[str]] = None


class SimulationRequest(BaseModel):
    overrides: Optional[Dict[str, Any]] = None
    modifications: Optional[Dict[str, Any]] = None


class SimulationResponse(BaseModel):
    baseline: Dict[str, Any]
    simulated: Dict[str, Any]
    deltas: Optional[Dict[str, Optional[str]]] = None
    changes: Optional[List[Dict[str, Any]]] = None
    simulated_label: Optional[str] = None
    simulated_score: Optional[str] = None
