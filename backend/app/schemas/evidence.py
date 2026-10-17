from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, Literal, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

SourceType = Literal["website", "review", "pricing_page", "social", "manual", "other"]


class EvidenceIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_type: SourceType = "website"
    source_url: Optional[str] = None
    title: str
    excerpt: str
    confidence: Optional[Decimal] = Field(default=None, ge=0, le=1)
    data: Optional[Dict[str, Any]] = None


from typing import Any, Dict, List, Literal, Optional


class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    competitor_id: Optional[UUID] = None
    source_type: str
    source_url: Optional[str] = None
    title: str
    excerpt: str
    retrieved_at: datetime
    confidence: Optional[float] = None
    data: Optional[Dict[str, Any]] = None
    created_at: datetime


class EvidenceListResponse(BaseModel):
    items: List[EvidenceResponse]
    total: int
    limit: int
    offset: int

