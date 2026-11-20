import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class CompetitorItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., description="Competitor brand or company name")
    website_url: Optional[str] = Field(None, description="Official website URL")
    notes: Optional[str] = Field(None, description="Notes on competitor positioning")
    product_name: Optional[str] = Field(None, description="Flagship competing product name")
    observed_price: Optional[str] = Field(None, description="Observed market price")


class CompetitorCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    competitors: List[CompetitorItem] = Field(..., description="List of competitors to register")


class CompetitorDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    name: str
    website_url: Optional[str] = None
    notes: Optional[str] = None
    product_name: Optional[str] = None
    created_at: datetime
    evidence_count: int = 0
    analyses: List[Dict[str, Any]] = Field(default_factory=list)


class CompetitorListResponse(BaseModel):
    items: List[CompetitorDetailResponse]


class CompetitorPriceSummary(BaseModel):
    competitor_price_min: Optional[str] = None
    competitor_price_median: Optional[str] = None
    competitor_price_max: Optional[str] = None
    competitors_count: int = 0
