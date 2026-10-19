from datetime import datetime
from decimal import Decimal
import json
from typing import Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator
from backend.app.schemas.assumptions import Assumptions


class LatestReadiness(BaseModel):
    label: str
    overall_score: Optional[Decimal] = None

    @field_serializer("overall_score", when_used="json")
    def serialize_score(self, v: Optional[Decimal]) -> Optional[float]:
        return json.loads(f"{v:.2f}") if v is not None else None


class ProductCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    target_market: Optional[str] = None
    assumptions: Optional[Assumptions] = None

    @field_validator("name")
    @classmethod
    def validate_name_not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Product name cannot be blank")
        return v.strip()


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    target_market: Optional[str] = None
    current_version: int
    status: str
    created_at: datetime
    validated_version: Optional[int] = None
    revalidation_required: bool = False
    latest_readiness: Optional[LatestReadiness] = None
    stage_statuses: Dict[str, str] = Field(default_factory=dict)
    competitors_count: int = 0
    missing_evidence_count: int = 0
    research_provider: str = "mock"


class ProductDetailResponse(ProductResponse):
    assumptions: Assumptions


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    limit: int
    offset: int

