from pydantic import BaseModel
from typing import List, Optional


class ErrorDetail(BaseModel):
    field: Optional[str] = None
    issue: str


class ErrorBody(BaseModel):
    code: str
    message: str
    details: List[ErrorDetail] = []
    request_id: str


class ErrorResponse(BaseModel):
    error: ErrorBody

