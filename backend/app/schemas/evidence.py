import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    competitor_id: Optional[uuid.UUID] = None
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
