from datetime import datetime
from typing import Any, Dict, List
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    version_id: UUID
    format: str = "json_markdown"
    content: Dict[str, Any]
    markdown: str
    generated_at: datetime


class ReportListResponse(BaseModel):
    items: List[ReportResponse]
    total: int
    limit: int
    offset: int

