"""Pydantic schemas for Project CRUD operations and responses."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    target_market: Optional[str] = Field(default="India (Tier 1 Metros)", max_length=100)
    selling_price: float = Field(..., gt=0)
    mfg_cost: float = Field(..., ge=0)
    moq: int = Field(default=500, ge=1)
    marketing_budget: float = Field(default=50000.0, ge=0)
    margin: Optional[float] = None
    description: Optional[str] = None
    ingredients: Optional[str] = None
    target_audience: Optional[str] = None
    image: str = Field(default="/images/cat-beverages.jpg")
    status: str = Field(default="In Progress")
    viability_score: int = Field(default=50, ge=0, le=100)
    viability_grade: Optional[str] = None
    report: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = "default_user"

    model_config = ConfigDict(
        populate_by_name=True,
        extra="ignore",
    )


class ProjectCreate(BaseModel):
    id: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    target_market: Optional[str] = Field(default="India (Tier 1 Metros)", alias="targetMarket")
    selling_price: float = Field(..., gt=0, alias="sellingPrice")
    mfg_cost: float = Field(..., ge=0, alias="mfgCost")
    moq: Optional[int] = Field(default=500, ge=1)
    marketing_budget: Optional[float] = Field(default=50000.0, ge=0, alias="marketingBudget")
    margin: Optional[float] = None
    description: Optional[str] = None
    ingredients: Optional[str] = None
    target_audience: Optional[str] = Field(default=None, alias="targetAudience")
    image: Optional[str] = Field(default="/images/cat-beverages.jpg")
    status: Optional[str] = Field(default="In Progress")
    viability_score: Optional[int] = Field(default=50, alias="viabilityScore")
    viability_grade: Optional[str] = Field(default=None, alias="viabilityGrade")
    report: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = Field(default="default_user", alias="userId")

    model_config = ConfigDict(
        populate_by_name=True,
        extra="ignore",
    )

    @model_validator(mode="after")
    def compute_margin_if_missing(self) -> "ProjectCreate":
        if self.margin is None and self.selling_price > 0:
            self.margin = round(((self.selling_price - self.mfg_cost) / self.selling_price) * 100.0, 1)
        return self


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    category: Optional[str] = Field(default=None, min_length=1, max_length=100)
    target_market: Optional[str] = Field(default=None, alias="targetMarket")
    selling_price: Optional[float] = Field(default=None, gt=0, alias="sellingPrice")
    mfg_cost: Optional[float] = Field(default=None, ge=0, alias="mfgCost")
    moq: Optional[int] = Field(default=None, ge=1)
    marketing_budget: Optional[float] = Field(default=None, ge=0, alias="marketingBudget")
    margin: Optional[float] = None
    description: Optional[str] = None
    ingredients: Optional[str] = None
    target_audience: Optional[str] = Field(default=None, alias="targetAudience")
    image: Optional[str] = None
    status: Optional[str] = None
    viability_score: Optional[int] = Field(default=None, alias="viabilityScore")
    viability_grade: Optional[str] = Field(default=None, alias="viabilityGrade")
    report: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(
        populate_by_name=True,
        extra="ignore",
    )


class ProjectResponse(BaseModel):
    id: str
    name: str
    category: str
    target_market: Optional[str] = Field(default=None, serialization_alias="targetMarket")
    selling_price: float = Field(..., serialization_alias="sellingPrice")
    mfg_cost: float = Field(..., serialization_alias="mfgCost")
    moq: int = 500
    marketing_budget: float = Field(default=50000.0, serialization_alias="marketingBudget")
    margin: float = 0.0
    description: Optional[str] = None
    ingredients: Optional[str] = None
    target_audience: Optional[str] = Field(default=None, serialization_alias="targetAudience")
    image: str = "/images/cat-beverages.jpg"
    status: str = "In Progress"
    viability_score: int = Field(default=50, serialization_alias="viabilityScore")
    viability_grade: Optional[str] = Field(default=None, serialization_alias="viabilityGrade")
    report: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = Field(default="default_user", serialization_alias="userId")
    created_at: str = Field(..., serialization_alias="createdAt")
    updated_at: str = Field(..., serialization_alias="updatedAt")

    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
    )


class ProjectListResponse(BaseModel):
    items: List[ProjectResponse]
    total: int
    limit: int
    offset: int
