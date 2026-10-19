from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

# Legacy Priority enum
RecommendationPriority = Literal["high", "medium", "low"]

# Step 6 Canonical Enums
RecommendationPriorityEnum = Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
ActionTypeEnum = Literal[
    "PROVIDE_INPUT",
    "ADJUST_PRICE",
    "REDUCE_COST",
    "REDUCE_PACKAGING_COST",
    "GATHER_EVIDENCE",
    "IMPROVE_DIFFERENTIATION",
    "REVISE_CHANNEL_MIX",
    "REVIEW_ASSUMPTION",
]


class RecommendationResponse(BaseModel):
    """Legacy recommendation item response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    version_id: UUID
    stage: str
    priority: RecommendationPriority
    title: str
    detail: str
    evidence_ids: List[UUID] = Field(default_factory=list)
    created_at: datetime


class RecommendationListResponse(BaseModel):
    """Legacy recommendation list response."""
    items: List[RecommendationResponse]


class RecommendationItemResponse(BaseModel):
    """Canonical recommendation item response for validation runs."""
    id: UUID
    code: str
    stage: str
    priority: RecommendationPriorityEnum
    title: str
    detail: str
    action_type: ActionTypeEnum
    target_field: Optional[str] = None
    current_value: Optional[str] = None
    suggested_value: Optional[str] = None
    finding_codes: List[str] = Field(default_factory=list)
    evidence_ids: List[UUID] = Field(default_factory=list)
    impact: Dict[str, Any] = Field(default_factory=dict)


class RunRecommendationListResponse(BaseModel):
    """List response for /runs/{run_id}/recommendations and /runs/latest/recommendations."""
    run_id: UUID
    project_id: UUID
    items: List[RecommendationItemResponse]
    total: int
    counts_by_priority: Dict[str, int] = Field(default_factory=dict)
