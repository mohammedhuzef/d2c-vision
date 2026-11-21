import uuid
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class EvidenceIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_type: Literal["website", "review", "pricing_page", "social", "manual", "sample_seed", "other"] = "website"
    source_url: Optional[str] = None
    title: str
    excerpt: str
    confidence: Optional[float] = None
    data: Optional[Dict[str, Any]] = None


class AnalysisIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    competitor_id: Optional[uuid.UUID] = None
    summary: str
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    price_observed: Optional[float] = None
    evidence_ids: List[uuid.UUID] = Field(default_factory=list)
    produced_by: str = "mock"


class ResearchIngestRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_id: uuid.UUID
    competitor_id: Optional[uuid.UUID] = None
    evidence: List[EvidenceIn] = Field(default_factory=list)
    analyses: List[AnalysisIn] = Field(default_factory=list)


class ResearchIngestResponse(BaseModel):
    status: str = "success"
    evidence_inserted: int
    analyses_inserted: int


class ResearchStartResponse(BaseModel):
    research_id: uuid.UUID
    status: str
    evidence_count: int


class CompetitorOutcome(BaseModel):
    competitor_id: uuid.UUID
    status: str
    error_code: Optional[str] = None
    evidence_count: int = 0


class ResearchStatusResponse(BaseModel):
    research_id: uuid.UUID
    status: str
    evidence_count: int
    competitor_count: int = 0
    competitor_outcomes: List[CompetitorOutcome] = Field(default_factory=list)
    provider: Optional[str] = "mock"
    errors: Optional[Any] = None


class ResearchRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    status: str
    provider: str
    evidence_count: int
    started_at: datetime
    finished_at: Optional[datetime] = None
    errors: Optional[Any] = None


class ResearchRunListResponse(BaseModel):
    items: List[ResearchRunResponse]
    total: int
    limit: int
    offset: int
