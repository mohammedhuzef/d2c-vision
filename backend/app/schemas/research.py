from datetime import datetime
from typing import Any, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field
from backend.app.schemas.evidence import EvidenceIn
from backend.app.schemas.analysis import AnalysisIn


class ResearchRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
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


class ResearchStartResponse(BaseModel):
    research_id: UUID
    status: str
    evidence_count: int


class CompetitorOutcome(BaseModel):
    competitor_id: UUID
    status: str
    error_code: Optional[str] = None
    evidence_count: int = 0


class ResearchStatusResponse(BaseModel):
    research_id: UUID
    status: str
    evidence_count: int
    competitor_count: int
    competitor_outcomes: List[CompetitorOutcome] = Field(default_factory=list)


class ResearchIngestRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_id: UUID
    competitor_id: Optional[UUID] = None
    evidence: List[EvidenceIn] = Field(default_factory=list)
    analyses: List[AnalysisIn] = Field(default_factory=list)


class ResearchIngestResponse(BaseModel):
    status: str
    evidence_inserted: int
    analyses_inserted: int


class ResearchOutput(BaseModel):
    evidence: List[EvidenceIn] = Field(default_factory=list)
    analyses: List[AnalysisIn] = Field(default_factory=list)
    competitor_outcomes: List[CompetitorOutcome] = Field(default_factory=list)
    run_status: Optional[str] = None

