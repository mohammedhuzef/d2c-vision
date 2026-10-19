from decimal import Decimal
from typing import Annotated, List, Optional
from pydantic import BaseModel, ConfigDict, Field, PlainSerializer, model_validator
from backend.app.schemas.common import round_money, round_rate

MoneyDecimal = Annotated[
    Decimal,
    PlainSerializer(
        lambda v: round_money(v) if v is not None else None,
        return_type=Optional[float],
        when_used="json",
    ),
]

RateDecimal = Annotated[
    Decimal,
    PlainSerializer(
        lambda v: round_rate(v) if v is not None else None,
        return_type=Optional[float],
        when_used="json",
    ),
]


class CustomerAssumptions(BaseModel):
    model_config = ConfigDict(extra="forbid")

    target_customer: Optional[str] = None
    problem_statement: Optional[str] = None
    segment_size_estimate: Optional[str] = None
    customer_interviews_count: Optional[int] = None
    willingness_to_pay_signal: Optional[str] = None


class ProductAssumptions(BaseModel):
    model_config = ConfigDict(extra="forbid")

    unique_selling_points: List[str] = Field(default_factory=list)
    features: List[str] = Field(default_factory=list)
    differentiation_vs_competitors: Optional[str] = None


class PackagingAssumptions(BaseModel):
    model_config = ConfigDict(extra="forbid")

    material: Optional[str] = None
    packaging_cost: Optional[MoneyDecimal] = None
    unit_weight_grams: Optional[Decimal] = None
    shipping_dimensions_cm: Optional[str] = None
    sustainability_claim: Optional[str] = None


class PricingAssumptions(BaseModel):
    model_config = ConfigDict(extra="forbid")

    selling_price: Optional[MoneyDecimal] = None
    currency: str = "USD"
    target_margin_fraction: Optional[RateDecimal] = Field(default=Decimal("0.40"))


class CostsAssumptions(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cogs_per_unit: Optional[MoneyDecimal] = None
    shipping_cost_per_unit: Optional[MoneyDecimal] = None
    packaging_cost: Optional[MoneyDecimal] = None
    payment_fee_fraction: Optional[RateDecimal] = Field(default=Decimal("0.02"))
    payment_fee_fixed: Optional[MoneyDecimal] = Field(default=Decimal("0.00"))
    platform_fee_fraction: Optional[RateDecimal] = Field(default=Decimal("0.00"))
    other_variable_cost_per_unit: Optional[MoneyDecimal] = Field(default=Decimal("0.00"))
    fixed_costs_total: Optional[MoneyDecimal] = None


class MarketingAssumptions(BaseModel):
    model_config = ConfigDict(extra="forbid")

    channels: List[str] = Field(default_factory=list)
    monthly_budget: Optional[MoneyDecimal] = None
    expected_cac: Optional[MoneyDecimal] = None
    expected_conversion_rate_fraction: Optional[RateDecimal] = None


class Assumptions(BaseModel):
    model_config = ConfigDict(extra="forbid")

    customer: CustomerAssumptions = Field(default_factory=CustomerAssumptions)
    product: ProductAssumptions = Field(default_factory=ProductAssumptions)
    packaging: PackagingAssumptions = Field(default_factory=PackagingAssumptions)
    pricing: PricingAssumptions = Field(default_factory=PricingAssumptions)
    costs: CostsAssumptions = Field(default_factory=CostsAssumptions)
    marketing: MarketingAssumptions = Field(default_factory=MarketingAssumptions)

    @model_validator(mode="after")
    def validate_packaging_cost_mirror(self) -> "Assumptions":
        pkg_cost = self.packaging.packaging_cost
        costs_cost = self.costs.packaging_cost

        if pkg_cost is not None and costs_cost is not None:
            if pkg_cost != costs_cost:
                raise ValueError(
                    f"packaging.packaging_cost ({pkg_cost}) and costs.packaging_cost ({costs_cost}) conflict and must be equal."
                )
        elif pkg_cost is not None and costs_cost is None:
            self.costs.packaging_cost = pkg_cost
        elif costs_cost is not None and pkg_cost is None:
            self.packaging.packaging_cost = costs_cost

        return self
