"""Deterministic financial computation engine for LaunchTwin AI.

Pure functions, Decimal only, no I/O, no imports from db, api, or models.
Local decimal context (prec=50, ROUND_HALF_UP) is used for all operations.

Rounding rule:
Round variable_cost to 2 decimal places (dp) first, derive contribution from
the rounded variable cost, and round contribution margin to 4 dp. All sign
checks and break-even units use these rounded values, ensuring displayed
numbers and metrics are always self-consistent.
"""

from dataclasses import dataclass, field
import decimal
from decimal import Decimal, ROUND_HALF_UP, Context
import json
from typing import Any, Dict, List, Optional, Union

LOCAL_CTX = Context(prec=50, rounding=ROUND_HALF_UP)


def round_money_dec(val: Decimal) -> Decimal:
    """Rounds a Decimal value to 2 decimal places using ROUND_HALF_UP."""
    return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def round_rate_dec(val: Decimal) -> Decimal:
    """Rounds a Decimal rate/margin to 4 decimal places using ROUND_HALF_UP."""
    return val.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)


def money_to_str(val: Optional[Decimal]) -> Optional[str]:
    """Serializes a money Decimal to a 2 dp string (e.g. '230.00')."""
    if val is None:
        return None
    with decimal.localcontext(LOCAL_CTX):
        rounded = round_money_dec(val)
        return f"{rounded:.2f}"


def fraction_to_str(val: Optional[Decimal]) -> Optional[str]:
    """Serializes a rate/fraction Decimal to a 4 dp string (e.g. '0.5400')."""
    if val is None:
        return None
    with decimal.localcontext(LOCAL_CTX):
        rounded = round_rate_dec(val)
        return f"{rounded:.4f}"


class IssueCode(str):
    """
    String subclass supporting dual equality checks:
    Matches both the generic base code ('NEGATIVE_COST') and the specific
    field-qualified code ('NEGATIVE_COST:<field>') for seamless backwards compatibility.
    """
    field_name: Optional[str]

    def __new__(cls, base_code: str, field_name: Optional[str] = None):
        instance = super().__new__(cls, base_code)
        instance.field_name = field_name
        return instance

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, str):
            return False
        if super().__eq__(other):
            return True
        if self == "NEGATIVE_COST" and self.field_name and other == f"NEGATIVE_COST:{self.field_name}":
            return True
        if other == "NEGATIVE_COST" and self.field_name and self == f"NEGATIVE_COST:{self.field_name}":
            return True
        return False

    def __hash__(self) -> int:
        return super().__hash__()


@dataclass(frozen=True)
class Issue:
    code: str
    field: Optional[str] = None
    message: str = ""


# Alias for backward compatibility with existing callers
FinancialIssue = Issue


@dataclass(frozen=True)
class FinanceInputs:
    selling_price: Optional[Decimal] = None
    cogs_per_unit: Optional[Decimal] = None
    packaging_cost: Optional[Decimal] = None
    shipping_cost_per_unit: Optional[Decimal] = None
    other_variable_cost_per_unit: Optional[Decimal] = Decimal("0")
    payment_fee_fraction: Optional[Decimal] = Decimal("0.02")
    payment_fee_fixed: Optional[Decimal] = Decimal("0")
    platform_fee_fraction: Optional[Decimal] = Decimal("0")
    fixed_costs_total: Optional[Decimal] = None

    @classmethod
    def from_assumptions(cls, assumptions: Any) -> "FinanceInputs":
        """
        Builds FinanceInputs from Assumptions model, schema or dictionary.
        Applies defaults and the packaging_cost mirroring rule
        (packaging.packaging_cost is the single source of truth).
        """
        return from_assumptions(assumptions)


def _safe_to_decimal(val: Any) -> Optional[Decimal]:
    if val is None:
        return None
    if isinstance(val, Decimal):
        return val
    try:
        return Decimal(str(val))
    except (decimal.InvalidOperation, ValueError, TypeError):
        return Decimal("NaN")


def from_assumptions(assumptions: Any) -> FinanceInputs:
    """
    Reads an Assumptions schema instance or dictionary and produces a FinanceInputs object.
    Applies defaults and respects packaging.packaging_cost as the source of truth.
    """
    # 1. Pricing
    pricing = getattr(assumptions, "pricing", None) if not isinstance(assumptions, dict) else assumptions.get("pricing")
    price = getattr(pricing, "selling_price", None) if pricing and not isinstance(pricing, dict) else (pricing.get("selling_price") if isinstance(pricing, dict) else None)

    # 2. Packaging (source of truth is packaging.packaging_cost)
    packaging = getattr(assumptions, "packaging", None) if not isinstance(assumptions, dict) else assumptions.get("packaging")
    pkg_cost = getattr(packaging, "packaging_cost", None) if packaging and not isinstance(packaging, dict) else (packaging.get("packaging_cost") if isinstance(packaging, dict) else None)

    # 3. Costs
    costs = getattr(assumptions, "costs", None) if not isinstance(assumptions, dict) else assumptions.get("costs")
    if pkg_cost is None and costs is not None:
        pkg_cost = getattr(costs, "packaging_cost", None) if not isinstance(costs, dict) else costs.get("packaging_cost")

    cogs = getattr(costs, "cogs_per_unit", None) if costs and not isinstance(costs, dict) else (costs.get("cogs_per_unit") if isinstance(costs, dict) else None)
    shipping = getattr(costs, "shipping_cost_per_unit", None) if costs and not isinstance(costs, dict) else (costs.get("shipping_cost_per_unit") if isinstance(costs, dict) else None)
    other_var = getattr(costs, "other_variable_cost_per_unit", None) if costs and not isinstance(costs, dict) else (costs.get("other_variable_cost_per_unit") if isinstance(costs, dict) else None)
    if other_var is None:
        other_var = Decimal("0")

    fee_frac = getattr(costs, "payment_fee_fraction", None) if costs and not isinstance(costs, dict) else (costs.get("payment_fee_fraction") if isinstance(costs, dict) else None)
    if fee_frac is None:
        fee_frac = Decimal("0.02")

    fee_fixed = getattr(costs, "payment_fee_fixed", None) if costs and not isinstance(costs, dict) else (costs.get("payment_fee_fixed") if isinstance(costs, dict) else None)
    if fee_fixed is None:
        fee_fixed = Decimal("0")

    plat_frac = getattr(costs, "platform_fee_fraction", None) if costs and not isinstance(costs, dict) else (costs.get("platform_fee_fraction") if isinstance(costs, dict) else None)
    if plat_frac is None:
        plat_frac = Decimal("0")

    fixed_costs = getattr(costs, "fixed_costs_total", None) if costs and not isinstance(costs, dict) else (costs.get("fixed_costs_total") if isinstance(costs, dict) else None)

    return FinanceInputs(
        selling_price=_safe_to_decimal(price),
        cogs_per_unit=_safe_to_decimal(cogs),
        packaging_cost=_safe_to_decimal(pkg_cost),
        shipping_cost_per_unit=_safe_to_decimal(shipping),
        other_variable_cost_per_unit=_safe_to_decimal(other_var),
        payment_fee_fraction=_safe_to_decimal(fee_frac),
        payment_fee_fixed=_safe_to_decimal(fee_fixed),
        platform_fee_fraction=_safe_to_decimal(plat_frac),
        fixed_costs_total=_safe_to_decimal(fixed_costs),
    )


@dataclass(frozen=True)
class FinancialResult:
    variable_cost_per_unit: Optional[Decimal] = None
    contribution_per_unit: Optional[Decimal] = None
    contribution_margin: Optional[Decimal] = None
    break_even_units: Optional[int] = None
    issues: List[Issue] = field(default_factory=list)
    # Supplementary fields for backward compatibility with stages & tests
    selling_price: Optional[Decimal] = None
    fixed_costs_total: Optional[Decimal] = None

    @property
    def metrics(self) -> "FinancialResult":
        """Provides backward-compatible .metrics property."""
        return self

    def to_dict(self) -> Dict[str, Any]:
        """Produces a JSONB-safe metrics dictionary."""
        return to_metrics_dict(self)


def to_metrics_dict(result: FinancialResult) -> Dict[str, Any]:
    """
    Serializes a FinancialResult into a JSONB-safe dictionary:
    - Money fields serialized as 2 dp strings
    - Fractions serialized as 4 dp numbers (or null)
    - Break-even units serialized as integer (or null)
    """
    margin_val = None
    if result.contribution_margin is not None:
        with decimal.localcontext(LOCAL_CTX):
            rounded_m = round_rate_dec(result.contribution_margin)
            margin_val = json.loads(f"{rounded_m:.4f}")

    return {
        "selling_price": money_to_str(result.selling_price),
        "variable_cost_per_unit": money_to_str(result.variable_cost_per_unit),
        "contribution_per_unit": money_to_str(result.contribution_per_unit),
        "contribution_margin": margin_val,
        "break_even_units": result.break_even_units,
        "fixed_costs_total": money_to_str(result.fixed_costs_total),
    }


def calculate_financials(inputs: Union[FinanceInputs, Any]) -> FinancialResult:
    """
    Pure deterministic financial computation engine using Decimal only.
    Computes variable_cost_per_unit, contribution_per_unit, contribution_margin, and break_even_units.
    Never returns 0 or inf on invalid inputs and never raises an exception.
    """
    with decimal.localcontext(LOCAL_CTX):
        if not isinstance(inputs, FinanceInputs):
            inputs = from_assumptions(inputs)

        issues: List[Issue] = []

        # 1. NaN and Infinity validation (INVALID_NUMBER)
        all_fields = [
            ("selling_price", inputs.selling_price),
            ("cogs_per_unit", inputs.cogs_per_unit),
            ("packaging_cost", inputs.packaging_cost),
            ("shipping_cost_per_unit", inputs.shipping_cost_per_unit),
            ("other_variable_cost_per_unit", inputs.other_variable_cost_per_unit),
            ("payment_fee_fraction", inputs.payment_fee_fraction),
            ("payment_fee_fixed", inputs.payment_fee_fixed),
            ("platform_fee_fraction", inputs.platform_fee_fraction),
            ("fixed_costs_total", inputs.fixed_costs_total),
        ]

        has_invalid_number = False
        for field_name, val in all_fields:
            if val is not None and not val.is_finite():
                has_invalid_number = True
                issues.append(Issue(code="INVALID_NUMBER", field=field_name, message=f"{field_name} must be a finite number"))

        if has_invalid_number:
            return FinancialResult(issues=issues)

        # 2. Fraction range validation (INVALID_FRACTION: 0..1)
        has_invalid_fraction = False
        if inputs.payment_fee_fraction is not None and (inputs.payment_fee_fraction < Decimal("0") or inputs.payment_fee_fraction > Decimal("1")):
            has_invalid_fraction = True
            issues.append(Issue(code="INVALID_FRACTION", field="payment_fee_fraction", message="payment_fee_fraction must be between 0 and 1"))

        if inputs.platform_fee_fraction is not None and (inputs.platform_fee_fraction < Decimal("0") or inputs.platform_fee_fraction > Decimal("1")):
            has_invalid_fraction = True
            issues.append(Issue(code="INVALID_FRACTION", field="platform_fee_fraction", message="platform_fee_fraction must be between 0 and 1"))

        # 3. Price validation
        has_price_issue = False
        if inputs.selling_price is None:
            has_price_issue = True
            issues.append(Issue(code="MISSING_INPUT:selling_price", field="selling_price", message="selling_price is missing"))
        elif inputs.selling_price <= Decimal("0"):
            has_price_issue = True
            issues.append(Issue(code="NON_POSITIVE_PRICE", field="selling_price", message="Selling price must be greater than zero"))

        # 4. Cost sign validation (NEGATIVE_COST)
        has_negative_var_cost = False
        cost_fields = [
            ("cogs_per_unit", inputs.cogs_per_unit, True),
            ("packaging_cost", inputs.packaging_cost, True),
            ("shipping_cost_per_unit", inputs.shipping_cost_per_unit, True),
            ("other_variable_cost_per_unit", inputs.other_variable_cost_per_unit, True),
            ("payment_fee_fixed", inputs.payment_fee_fixed, True),
            ("fixed_costs_total", inputs.fixed_costs_total, False),
        ]

        for field_name, val, is_variable in cost_fields:
            if val is not None and val < Decimal("0"):
                if is_variable:
                    has_negative_var_cost = True
                issues.append(Issue(code=IssueCode("NEGATIVE_COST", field_name), field=field_name, message=f"{field_name} cannot be negative"))

        # 5. Missing required inputs
        has_missing_var_input = False
        required_var_inputs = [
            ("cogs_per_unit", inputs.cogs_per_unit),
            ("packaging_cost", inputs.packaging_cost),
            ("shipping_cost_per_unit", inputs.shipping_cost_per_unit),
        ]
        for field_name, val in required_var_inputs:
            if val is None:
                has_missing_var_input = True
                issues.append(Issue(code=f"MISSING_INPUT:{field_name}", field=field_name, message=f"{field_name} is missing"))

        # Check blocking conditions for variable cost / contribution
        if has_invalid_fraction or has_price_issue or has_negative_var_cost or has_missing_var_input:
            # If price was missing/non-positive, all metrics null
            # If cogs, packaging, or shipping missing, all metrics null
            price_out = round_money_dec(inputs.selling_price) if inputs.selling_price is not None and inputs.selling_price > Decimal("0") else None
            fixed_out = round_money_dec(inputs.fixed_costs_total) if inputs.fixed_costs_total is not None and inputs.fixed_costs_total >= Decimal("0") else None
            return FinancialResult(
                selling_price=price_out,
                fixed_costs_total=fixed_out,
                issues=issues,
            )

        # 6. Variable Cost Calculation
        # Defaults for optional components
        other_var = inputs.other_variable_cost_per_unit if inputs.other_variable_cost_per_unit is not None else Decimal("0")
        fee_frac = inputs.payment_fee_fraction if inputs.payment_fee_fraction is not None else Decimal("0.02")
        fee_fixed = inputs.payment_fee_fixed if inputs.payment_fee_fixed is not None else Decimal("0")
        plat_frac = inputs.platform_fee_fraction if inputs.platform_fee_fraction is not None else Decimal("0")

        pct_fees = (inputs.selling_price * fee_frac) + (inputs.selling_price * plat_frac)
        raw_variable_cost = inputs.cogs_per_unit + inputs.packaging_cost + inputs.shipping_cost_per_unit + other_var + fee_fixed + pct_fees
        variable_cost = round_money_dec(raw_variable_cost)

        # 7. Contribution per unit & Contribution margin
        raw_contribution = inputs.selling_price - variable_cost
        contribution = round_money_dec(raw_contribution)

        raw_margin = contribution / inputs.selling_price
        margin = round_rate_dec(raw_margin)

        # 8. Contribution sign checks & break-even calculation
        break_even: Optional[int] = None
        if contribution < Decimal("0"):
            issues.append(Issue(code="NEGATIVE_CONTRIBUTION", field="selling_price", message=f"Contribution per unit is negative ({contribution})"))
        elif contribution == Decimal("0"):
            issues.append(Issue(code="ZERO_CONTRIBUTION", field="selling_price", message="Contribution per unit is zero"))
        else:
            # contribution > 0
            if inputs.fixed_costs_total is None:
                issues.append(Issue(code="MISSING_INPUT:fixed_costs_total", field="fixed_costs_total", message="fixed_costs_total is missing"))
                break_even = None
            elif inputs.fixed_costs_total < Decimal("0"):
                break_even = None
            elif inputs.fixed_costs_total == Decimal("0"):
                break_even = 0
            else:
                q, r = divmod(inputs.fixed_costs_total, contribution)
                break_even = int(q) + (1 if r > Decimal("0") else 0)

        return FinancialResult(
            variable_cost_per_unit=variable_cost,
            contribution_per_unit=contribution,
            contribution_margin=margin,
            break_even_units=break_even,
            issues=issues,
            selling_price=round_money_dec(inputs.selling_price),
            fixed_costs_total=round_money_dec(inputs.fixed_costs_total) if inputs.fixed_costs_total is not None and inputs.fixed_costs_total >= Decimal("0") else None,
        )
