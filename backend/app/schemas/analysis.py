from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class AnalysisIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    competitor_id: Optional[UUID] = None
    summary: str
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    price_observed: Optional[Decimal] = None
    evidence_ids: List[UUID] = Field(default_factory=list)
    produced_by: str = "mock"


class CompetitorAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    competitor_id: Optional[UUID] = None
    summary: str
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    price_observed: Optional[float] = None
    evidence_ids: List[UUID] = Field(default_factory=list)
    produced_by: str
    created_at: datetime
