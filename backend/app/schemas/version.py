from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from backend.app.schemas.assumptions import Assumptions


class ProductVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    version_number: int
    assumptions: Assumptions
    change_summary: Dict[str, Any] = {}
    created_by: Optional[str] = None
    created_at: datetime


class ProductVersionListResponse(BaseModel):
    items: List[ProductVersionResponse]
