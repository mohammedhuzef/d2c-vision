import uuid
from datetime import datetime
from typing import Any, Dict, List
from pydantic import BaseModel, ConfigDict, Field


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    version_id: uuid.UUID
    format: str = "json_markdown"
    content: Dict[str, Any]
    markdown: str
    generated_at: datetime


class ReportListResponse(BaseModel):
    items: List[ReportResponse]
    total: int
    limit: int
    offset: int
