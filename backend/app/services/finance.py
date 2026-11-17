"""Deterministic financial computation engine for LaunchTwin AI.

Pure Python only:
- Uses Decimal exclusively with ROUND_HALF_UP
- Pure Decimal arithmetic (zero Python float usage)
- No imports from database, ORM, HTTP clients, or LLMs
- All business constants imported from validation/rules_config.py
"""

from dataclasses import dataclass, field
import decimal
from decimal import Decimal, ROUND_HALF_UP
import math
from typing import Any, Iterable, List, Optional, Tuple, Union

from backend.app.services.validation.base import Finding, Severity
from backend.app.services.validation.rules_config import (
    DEFAULT_OTHER_VARIABLE_COST,
    DEFAULT_PAYMENT_FEE_FIXED,
    DEFAULT_PAYMENT_FEE_FRACTION,
    DEFAULT_PLATFORM_FEE_FRACTION,
)

CENTS: Decimal = Decimal("0.01")
MARGIN_PRECISION: Decimal = Decimal("0.0001")


def to_decimal(val: Any) -> Optional[Decimal]:
    """Converts int, str, or float-from-JSON to Decimal at the boundary using Decimal(str(val))."""
    if val is None:
        return None
    if isinstance(val, Decimal):
        return val
    try:
        s = str(val).strip()
        if not s:
            return None
        return Decimal(s)
    except (decimal.InvalidOperation, ValueError, TypeError):
        return None


def round_money(val: Decimal) -> Decimal:
    """Rounds a money Decimal to 2 decimal places using ROUND_HALF_UP."""
    return val.quantize(CENTS, rounding=ROUND_HALF_UP)


def round_margin(val: Decimal) -> Decimal:
    """Rounds a margin Decimal to 4 decimal places using ROUND_HALF_UP."""
    return val.quantize(MARGIN_PRECISION, rounding=ROUND_HALF_UP)


@dataclass(frozen=True)
class Issue:
    """Defect or missing input in financial parameters."""
    code: str
    field: Optional[str] = None
    message: str = ""


@dataclass(frozen=True)
class FinanceInputs:
    """Pure, immutable inputs for financial calculation."""
    selling_price: Optional[Decimal] = None
    cogs_per_unit: Optional[Decimal] = None
    packaging_cost: Optional[Decimal] = None
    shipping_cost_per_unit: Optional[Decimal] = None
    other_variable_cost_per_unit: Optional[Decimal] = None
    payment_fee_fraction: Optional[Decimal] = None
    payment_fee_fixed: Optional[Decimal] = None
    platform_fee_fraction: Optional[Decimal] = None
    fixed_costs_total: Optional[Decimal] = None

    @classmethod
    def from_assumptions(cls, assumptions: Any) -> "FinanceInputs":
        """Builds FinanceInputs from assumptions model or dict."""
        return from_assumptions(assumptions)


@dataclass(frozen=True)
class FinancialResult:
    """Deterministic financial metrics."""
    selling_price: Optional[Decimal] = None
    variable_cost_per_unit: Optional[Decimal] = None
    contribution_per_unit: Optional[Decimal] = None
    contribution_margin: Optional[Decimal] = None
    break_even_units: Optional[int] = None
    fixed_costs_total: Optional[Decimal] = None
    issues: tuple[Issue, ...] = field(default_factory=tuple)

    def __post_init__(self) -> None:
        if isinstance(self.issues, list):
            object.__setattr__(self, "issues", tuple(self.issues))


def resolve_packaging_cost(assumptions: Any) -> Tuple[Optional[Decimal], List[Finding]]:
    """
    Single resolver for packaging cost.
    packaging.packaging_cost is authoritative; falls back to costs.packaging_cost.
    If both exist and differ, emits PACKAGING_COST_MISMATCH warning and uses packaging.packaging_cost.
    """
    findings: List[Finding] = []

    pkg = getattr(assumptions, "packaging", None) if not isinstance(assumptions, dict) else assumptions.get("packaging")
    costs = getattr(assumptions, "costs", None) if not isinstance(assumptions, dict) else assumptions.get("costs")

    pkg_raw = None
    if pkg is not None:
        pkg_raw = getattr(pkg, "packaging_cost", None) if not isinstance(pkg, dict) else pkg.get("packaging_cost")

    costs_raw = None
    if costs is not None:
        costs_raw = getattr(costs, "packaging_cost", None) if not isinstance(costs, dict) else costs.get("packaging_cost")

    pkg_cost = to_decimal(pkg_raw)
    costs_pkg = to_decimal(costs_raw)

    if pkg_cost is not None and costs_pkg is not None:
        if pkg_cost != costs_pkg:
            findings.append(
                Finding(
                    code="PACKAGING_COST_MISMATCH",
                    severity=Severity.WARNING,
                    message=(
                        f"packaging.packaging_cost ({pkg_cost}) and costs.packaging_cost ({costs_pkg}) conflict; "
                        "packaging.packaging_cost was used."
                    ),
                    field="packaging.packaging_cost",
                )
            )
        return pkg_cost, findings
    elif pkg_cost is not None:
        return pkg_cost, findings
    elif costs_pkg is not None:
        return costs_pkg, findings
    return None, findings


def from_assumptions(assumptions: Any) -> FinanceInputs:
    """Parses assumptions dictionary or object into FinanceInputs."""
    pricing = getattr(assumptions, "pricing", None) if not isinstance(assumptions, dict) else assumptions.get("pricing")
    costs = getattr(assumptions, "costs", None) if not isinstance(assumptions, dict) else assumptions.get("costs")

    selling_price_raw = (
        getattr(pricing, "selling_price", None)
        if pricing is not None and not isinstance(pricing, dict)
        else (pricing.get("selling_price") if isinstance(pricing, dict) else None)
    )

    resolved_pkg_cost, _ = resolve_packaging_cost(assumptions)

    cogs_raw = None
    shipping_raw = None
    other_var_raw = None
    fee_frac_raw = None
    fee_fixed_raw = None
    plat_frac_raw = None
    fixed_raw = None

    if costs is not None:
        if isinstance(costs, dict):
            cogs_raw = costs.get("cogs_per_unit")
            shipping_raw = costs.get("shipping_cost_per_unit")
            other_var_raw = costs.get("other_variable_cost_per_unit")
            fee_frac_raw = costs.get("payment_fee_fraction")
            fee_fixed_raw = costs.get("payment_fee_fixed")
            plat_frac_raw = costs.get("platform_fee_fraction")
            fixed_raw = costs.get("fixed_costs_total")
        else:
            cogs_raw = getattr(costs, "cogs_per_unit", None)
            shipping_raw = getattr(costs, "shipping_cost_per_unit", None)
            other_var_raw = getattr(costs, "other_variable_cost_per_unit", None)
            fee_frac_raw = getattr(costs, "payment_fee_fraction", None)
            fee_fixed_raw = getattr(costs, "payment_fee_fixed", None)
            plat_frac_raw = getattr(costs, "platform_fee_fraction", None)
            fixed_raw = getattr(costs, "fixed_costs_total", None)

    return FinanceInputs(
        selling_price=to_decimal(selling_price_raw),
        cogs_per_unit=to_decimal(cogs_raw),
        packaging_cost=resolved_pkg_cost,
        shipping_cost_per_unit=to_decimal(shipping_raw),
        other_variable_cost_per_unit=to_decimal(other_var_raw),
        payment_fee_fraction=to_decimal(fee_frac_raw),
        payment_fee_fixed=to_decimal(fee_fixed_raw),
        platform_fee_fraction=to_decimal(plat_frac_raw),
        fixed_costs_total=to_decimal(fixed_raw),
    )


def calculate_variable_cost(
    cogs: Decimal,
    packaging: Decimal,
    shipping: Decimal,
    other_variable: Decimal,
    payment_fee_fixed: Decimal,
    payment_fee_fraction: Decimal,
    platform_fee_fraction: Decimal,
    selling_price: Decimal,
) -> Decimal:
    """Calculates variable cost per unit, rounded to 2 decimal places FIRST."""
    pct_fees = (payment_fee_fraction + platform_fee_fraction) * selling_price
    raw_var = cogs + packaging + shipping + other_variable + payment_fee_fixed + pct_fees
    return round_money(raw_var)


def calculate_contribution_per_unit(selling_price: Decimal, variable_cost: Decimal) -> Decimal:
    """Calculates contribution per unit (price - variable_cost), rounded to 2 decimal places."""
    return round_money(selling_price - variable_cost)


def calculate_contribution_margin(contribution: Decimal, selling_price: Decimal) -> Decimal:
    """Calculates contribution margin fraction (contribution / selling_price), rounded to 4 dp."""
    if selling_price <= Decimal("0"):
        return Decimal("0.0000")
    return round_margin(contribution / selling_price)


def calculate_break_even_units(fixed_costs: Decimal, contribution: Decimal) -> Optional[int]:
    """Calculates break-even units: ceil(fixed_costs / contribution) only if contribution > 0."""
    if contribution <= Decimal("0"):
        return None
    if fixed_costs <= Decimal("0"):
        return 0
    q, r = divmod(fixed_costs, contribution)
    return int(q) + (1 if r > Decimal("0") else 0)


@dataclass(frozen=True)
class SensitivityRow:
    """Sensitivity projection for a given price offset."""
    price_delta: Decimal
    selling_price: Decimal
    variable_cost_per_unit: Decimal
    contribution_per_unit: Decimal
    contribution_margin: Decimal
    break_even_units: Optional[int]


def calculate_sensitivity(
    base_inputs: FinanceInputs,
    price_deltas: Iterable[Decimal] = (Decimal("-5.00"), Decimal("0.00"), Decimal("5.00")),
) -> List[SensitivityRow]:
    """Helper generating financial sensitivity rows across price variations."""
    rows: List[SensitivityRow] = []
    if base_inputs.selling_price is None or base_inputs.selling_price <= Decimal("0"):
        return rows

    for delta in price_deltas:
        adj_price = base_inputs.selling_price + delta
        if adj_price <= Decimal("0"):
            continue
        adj_inputs = FinanceInputs(
            selling_price=adj_price,
            cogs_per_unit=base_inputs.cogs_per_unit,
            packaging_cost=base_inputs.packaging_cost,
            shipping_cost_per_unit=base_inputs.shipping_cost_per_unit,
            other_variable_cost_per_unit=base_inputs.other_variable_cost_per_unit,
            payment_fee_fraction=base_inputs.payment_fee_fraction,
            payment_fee_fixed=base_inputs.payment_fee_fixed,
            platform_fee_fraction=base_inputs.platform_fee_fraction,
            fixed_costs_total=base_inputs.fixed_costs_total,
        )
        res = calculate_financials(adj_inputs)
        if res.variable_cost_per_unit is not None and res.contribution_per_unit is not None and res.contribution_margin is not None:
            rows.append(
                SensitivityRow(
                    price_delta=delta,
                    selling_price=adj_price,
                    variable_cost_per_unit=res.variable_cost_per_unit,
                    contribution_per_unit=res.contribution_per_unit,
                    contribution_margin=res.contribution_margin,
                    break_even_units=res.break_even_units,
                )
            )
    return rows


def calculate_financials(inputs_source: Union[FinanceInputs, dict, Any]) -> FinancialResult:
    """
    Main deterministic financial evaluation function.
    Validates inputs, tracks Issues for bad/missing values, and computes metrics.
    """
    if isinstance(inputs_source, FinanceInputs):
        inputs = inputs_source
    else:
        inputs = from_assumptions(inputs_source)

    issues: List[Issue] = []

    # 1. Price validation
    if inputs.selling_price is None:
        issues.append(Issue(code="MISSING_INPUT", field="selling_price", message="selling_price is missing"))
    elif inputs.selling_price == Decimal("0"):
        issues.append(Issue(code="ZERO_PRICE", field="selling_price", message="selling_price must be greater than zero"))
    elif inputs.selling_price < Decimal("0"):
        issues.append(Issue(code="NEGATIVE_PRICE", field="selling_price", message="selling_price must be greater than zero"))

    # 2. Required cost inputs
    if inputs.cogs_per_unit is None:
        issues.append(Issue(code="MISSING_INPUT", field="cogs_per_unit", message="cogs_per_unit is missing"))
    if inputs.packaging_cost is None:
        issues.append(Issue(code="MISSING_INPUT", field="packaging_cost", message="packaging_cost is missing"))
    if inputs.shipping_cost_per_unit is None:
        issues.append(Issue(code="MISSING_INPUT", field="shipping_cost_per_unit", message="shipping_cost_per_unit is missing"))

    # 3. Non-negative cost checks
    cost_checks = [
        ("cogs_per_unit", inputs.cogs_per_unit),
        ("packaging_cost", inputs.packaging_cost),
        ("shipping_cost_per_unit", inputs.shipping_cost_per_unit),
        ("other_variable_cost_per_unit", inputs.other_variable_cost_per_unit),
        ("payment_fee_fixed", inputs.payment_fee_fixed),
        ("fixed_costs_total", inputs.fixed_costs_total),
    ]
    for field_name, val in cost_checks:
        if val is not None and val < Decimal("0"):
            issues.append(Issue(code="NEGATIVE_COST", field=field_name, message=f"{field_name} cannot be negative"))

    # 4. Fee fraction checks
    for field_name, val in [("payment_fee_fraction", inputs.payment_fee_fraction), ("platform_fee_fraction", inputs.platform_fee_fraction)]:
        if val is not None and (val < Decimal("0") or val > Decimal("1")):
            issues.append(Issue(code="INVALID_FRACTION", field=field_name, message=f"{field_name} must be between 0 and 1"))

    # If any required variable cost input or price is missing or invalid, do not guess
    has_blocking_var_issue = any(
        i.field in ("selling_price", "cogs_per_unit", "packaging_cost", "shipping_cost_per_unit")
        or i.code in ("NEGATIVE_COST", "INVALID_FRACTION")
        for i in issues
    )

    if has_blocking_var_issue or inputs.selling_price is None or inputs.cogs_per_unit is None or inputs.packaging_cost is None or inputs.shipping_cost_per_unit is None:
        return FinancialResult(
            selling_price=round_money(inputs.selling_price) if inputs.selling_price is not None and inputs.selling_price > Decimal("0") else None,
            fixed_costs_total=round_money(inputs.fixed_costs_total) if inputs.fixed_costs_total is not None and inputs.fixed_costs_total >= Decimal("0") else None,
            issues=tuple(issues),
        )

    # Resolve optional components with defaults from rules_config
    other_var = inputs.other_variable_cost_per_unit if inputs.other_variable_cost_per_unit is not None else DEFAULT_OTHER_VARIABLE_COST
    fee_frac = inputs.payment_fee_fraction if inputs.payment_fee_fraction is not None else DEFAULT_PAYMENT_FEE_FRACTION
    fee_fixed = inputs.payment_fee_fixed if inputs.payment_fee_fixed is not None else DEFAULT_PAYMENT_FEE_FIXED
    plat_frac = inputs.platform_fee_fraction if inputs.platform_fee_fraction is not None else DEFAULT_PLATFORM_FEE_FRACTION

    # Variable Cost (rounded to 2 dp FIRST)
    var_cost = calculate_variable_cost(
        cogs=inputs.cogs_per_unit,
        packaging=inputs.packaging_cost,
        shipping=inputs.shipping_cost_per_unit,
        other_variable=other_var,
        payment_fee_fixed=fee_fixed,
        payment_fee_fraction=fee_frac,
        platform_fee_fraction=plat_frac,
        selling_price=inputs.selling_price,
    )

    # Contribution per unit (rounded to 2 dp)
    contribution = calculate_contribution_per_unit(inputs.selling_price, var_cost)

    # Contribution margin (rounded to 4 dp)
    margin = calculate_contribution_margin(contribution, inputs.selling_price)

    # Contribution checks & break-even calculation
    break_even: Optional[int] = None
    if contribution < Decimal("0"):
        issues.append(Issue(code="NEGATIVE_CONTRIBUTION", field="selling_price", message=f"Contribution per unit is negative ({contribution})"))
    elif contribution == Decimal("0"):
        issues.append(Issue(code="ZERO_CONTRIBUTION", field="selling_price", message="Contribution per unit is zero"))
    else:
        # contribution > 0
        if inputs.fixed_costs_total is None:
            issues.append(Issue(code="MISSING_INPUT", field="fixed_costs_total", message="fixed_costs_total is missing"))
        elif inputs.fixed_costs_total < Decimal("0"):
            break_even = None
        else:
            break_even = calculate_break_even_units(inputs.fixed_costs_total, contribution)

    return FinancialResult(
        selling_price=round_money(inputs.selling_price),
        variable_cost_per_unit=var_cost,
        contribution_per_unit=contribution,
        contribution_margin=margin,
        break_even_units=break_even,
        fixed_costs_total=round_money(inputs.fixed_costs_total) if inputs.fixed_costs_total is not None and inputs.fixed_costs_total >= Decimal("0") else None,
        issues=tuple(issues),
    )


__all__ = [
    "to_decimal",
    "round_money",
    "round_margin",
    "Issue",
    "FinanceInputs",
    "FinancialResult",
    "SensitivityRow",
    "resolve_packaging_cost",
    "from_assumptions",
    "calculate_variable_cost",
    "calculate_contribution_per_unit",
    "calculate_contribution_margin",
    "calculate_break_even_units",
    "calculate_sensitivity",
    "calculate_financials",
]
