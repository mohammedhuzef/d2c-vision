"""Pydantic v2 schemas for Products matching OpenAPI contract."""

from decimal import Decimal
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, model_validator

from backend.app.schemas.assumptions import AssumptionsInput


class LatestReadiness(BaseModel):
    label: str
    score: Optional[float] = None
    calculated_at: Optional[str] = None


class ProductCreate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    target_market: Optional[str] = None
    assumptions: Optional[Union[AssumptionsInput, Dict[str, Any]]] = None

    # Optional flat convenience fields
    target_retail_price: Optional[Union[Decimal, str, float]] = None
    cogs: Optional[Union[Decimal, str, float]] = None
    packaging_cost: Optional[Union[Decimal, str, float]] = None
    shipping_cost: Optional[Union[Decimal, str, float]] = None
    target_margin_percent: Optional[Union[Decimal, str, float]] = None

    @model_validator(mode="after")
    def validate_name_and_pricing(self) -> "ProductCreate":
        # Resolve product name
        resolved_name = self.name or self.title
        if not resolved_name or not resolved_name.strip():
            raise ValueError("Product name or title must be provided")

        # Validate flat fields if provided
        if self.target_retail_price is not None:
            try:
                p = Decimal(str(self.target_retail_price))
                if p <= Decimal("0"):
                    raise ValueError("Target retail price must be greater than zero")
            except Exception as e:
                raise ValueError(f"Invalid target_retail_price: {e}")

        for field_name, val in [
            ("cogs", self.cogs),
            ("packaging_cost", self.packaging_cost),
            ("shipping_cost", self.shipping_cost),
        ]:
            if val is not None:
                try:
                    c = Decimal(str(val))
                    if c < Decimal("0"):
                        raise ValueError(f"{field_name} cannot be negative")
                except Exception as e:
                    raise ValueError(f"Invalid {field_name}: {e}")

        if self.target_margin_percent is not None:
            try:
                m = Decimal(str(self.target_margin_percent))
                if m < Decimal("0") or m > Decimal("100"):
                    raise ValueError("target_margin_percent must be between 0 and 100")
            except Exception as e:
                raise ValueError(f"Invalid target_margin_percent: {e}")

        return self


class ProductResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    target_market: Optional[str] = None
    current_version: int
    status: str
    created_at: str
    validated_version: Optional[int] = None
    stage_statuses: Dict[str, str] = Field(default_factory=dict)
    competitors_count: int = 0
    missing_evidence_count: int = 0
    revalidation_required: bool = False
    research_provider: str = "mock"
    latest_readiness: Optional[LatestReadiness] = None


class ProductDetailResponse(ProductResponse):
    assumptions: Dict[str, Any] = Field(default_factory=dict)


class ProductListResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    limit: int
    offset: int
