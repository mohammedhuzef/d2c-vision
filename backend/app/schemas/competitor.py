from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator


class CompetitorItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    website_url: Optional[str] = None
    notes: Optional[str] = None
    product_name: Optional[str] = None
    observed_price: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name_not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Competitor name cannot be blank")
        return v.strip()


class CompetitorCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    competitors: List[CompetitorItem]

    @field_validator("competitors")
    @classmethod
    def validate_competitors_not_empty(cls, v: List[CompetitorItem]) -> List[CompetitorItem]:
        if not v:
            raise ValueError("Competitors list cannot be empty")
        return v


class CompetitorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    name: str
    website_url: Optional[str] = None
    notes: Optional[str] = None
    product_name: Optional[str] = None
    created_at: datetime


class CompetitorDetailResponse(CompetitorResponse):
    evidence_count: int = 0
    analyses: List[Dict[str, Any]] = []



class CompetitorListResponse(BaseModel):
    items: List[CompetitorDetailResponse]
