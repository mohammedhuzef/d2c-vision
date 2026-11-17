"""Pydantic v2 schemas for Assumptions input and output.

Validates assumption values:
- Money amounts must be Decimal >= 0
- Selling price must be Decimal > 0
- Fractions (percentages) must be Decimal between 0 and 1
"""

from decimal import Decimal
from typing import Any, List, Optional
from pydantic import BaseModel, Field, field_validator


class CustomerAssumptionsInput(BaseModel):
    target_customer: Optional[str] = None
    problem_statement: Optional[str] = None
    segment_size_estimate: Optional[Any] = None
    customer_interviews_count: Optional[int] = Field(default=None, ge=0)
    willingness_to_pay_signal: Optional[str] = None


class ProductInfoAssumptionsInput(BaseModel):
    title: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    unique_selling_points: Optional[List[str]] = None
    features: Optional[List[str]] = None
    differentiation_vs_competitors: Optional[str] = None


class PackagingAssumptionsInput(BaseModel):
    material: Optional[str] = None
    packaging_cost: Optional[Decimal] = Field(default=None, ge=Decimal("0"))
    unit_weight_grams: Optional[Decimal] = Field(default=None, ge=Decimal("0"))
    shipping_dimensions_cm: Optional[str] = None
    box_dimensions: Optional[str] = None
    box_type: Optional[str] = None
    sustainability_claim: Optional[str] = None


class PricingAssumptionsInput(BaseModel):
    selling_price: Optional[Decimal] = Field(default=None, gt=Decimal("0"))
    currency: Optional[str] = "USD"
    target_margin_fraction: Optional[Decimal] = Field(default=None, ge=Decimal("0"), le=Decimal("1"))


class CostsAssumptionsInput(BaseModel):
    cogs_per_unit: Optional[Decimal] = Field(default=None, ge=Decimal("0"))
    packaging_cost: Optional[Decimal] = Field(default=None, ge=Decimal("0"))
    shipping_cost_per_unit: Optional[Decimal] = Field(default=None, ge=Decimal("0"))
    payment_fee_fraction: Optional[Decimal] = Field(default=None, ge=Decimal("0"), le=Decimal("1"))
    payment_fee_fixed: Optional[Decimal] = Field(default=None, ge=Decimal("0"))
    platform_fee_fraction: Optional[Decimal] = Field(default=None, ge=Decimal("0"), le=Decimal("1"))
    other_variable_cost_per_unit: Optional[Decimal] = Field(default=None, ge=Decimal("0"))
    fixed_costs_total: Optional[Decimal] = Field(default=None, ge=Decimal("0"))


class MarketingAssumptionsInput(BaseModel):
    channels: Optional[List[str]] = None
    monthly_budget: Optional[Decimal] = Field(default=None, ge=Decimal("0"))
    expected_cac: Optional[Decimal] = Field(default=None, ge=Decimal("0"))
    expected_conversion_rate_fraction: Optional[Decimal] = Field(default=None, ge=Decimal("0"), le=Decimal("1"))


class AssumptionsInput(BaseModel):
    customer: Optional[CustomerAssumptionsInput] = None
    product: Optional[ProductInfoAssumptionsInput] = None
    packaging: Optional[PackagingAssumptionsInput] = None
    pricing: Optional[PricingAssumptionsInput] = None
    costs: Optional[CostsAssumptionsInput] = None
    marketing: Optional[MarketingAssumptionsInput] = None


# Allowed dotted paths for assumptions patch and validation
ALLOWED_ASSUMPTIONS_PATHS: frozenset[str] = frozenset({
    "customer.target_customer",
    "customer.problem_statement",
    "customer.segment_size_estimate",
    "customer.customer_interviews_count",
    "customer.willingness_to_pay_signal",
    "product.title",
    "product.name",
    "product.category",
    "product.description",
    "product.unique_selling_points",
    "product.features",
    "product.differentiation_vs_competitors",
    "packaging.material",
    "packaging.packaging_cost",
    "packaging.unit_weight_grams",
    "packaging.shipping_dimensions_cm",
    "packaging.box_dimensions",
    "packaging.box_type",
    "packaging.sustainability_claim",
    "pricing.selling_price",
    "pricing.currency",
    "pricing.target_margin_fraction",
    "costs.cogs_per_unit",
    "costs.packaging_cost",
    "costs.shipping_cost_per_unit",
    "costs.payment_fee_fraction",
    "costs.payment_fee_fixed",
    "costs.platform_fee_fraction",
    "costs.other_variable_cost_per_unit",
    "costs.fixed_costs_total",
    "marketing.channels",
    "marketing.monthly_budget",
    "marketing.expected_cac",
    "marketing.expected_conversion_rate_fraction",
})
