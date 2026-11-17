"""Schemas package exporting API request/response contracts."""

from backend.app.schemas.assumptions import (
    ALLOWED_ASSUMPTIONS_PATHS,
    AssumptionsInput,
)
from backend.app.schemas.common import ErrorBody, ErrorDetail, ErrorResponse
from backend.app.schemas.impact import (
    ImpactEventListResponse,
    ImpactEventResponse,
)
from backend.app.schemas.patch import (
    AssumptionsPatchRequest,
    AssumptionsPatchResponse,
)
from backend.app.schemas.product import (
    LatestReadiness,
    ProductCreate,
    ProductDetailResponse,
    ProductListResponse,
    ProductResponse,
)
from backend.app.schemas.version import (
    ProductVersionListResponse,
    ProductVersionResponse,
    StageDelta,
    VersionCompareResponse,
)

__all__ = [
    "ALLOWED_ASSUMPTIONS_PATHS",
    "AssumptionsInput",
    "ErrorBody",
    "ErrorDetail",
    "ErrorResponse",
    "ImpactEventListResponse",
    "ImpactEventResponse",
    "AssumptionsPatchRequest",
    "AssumptionsPatchResponse",
    "LatestReadiness",
    "ProductCreate",
    "ProductDetailResponse",
    "ProductListResponse",
    "ProductResponse",
    "ProductVersionListResponse",
    "ProductVersionResponse",
    "StageDelta",
    "VersionCompareResponse",
]
