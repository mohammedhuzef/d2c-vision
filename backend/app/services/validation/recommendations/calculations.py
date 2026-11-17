"""Pure Decimal calculation helpers for validation recommendations.

Calculates exact corrective thresholds and targets:
- price_for_target_margin: Minimum selling price to achieve target margin (rounded UP to 2 dp)
- max_cogs_for_target_margin: Maximum allowable COGS at current selling price (rounded DOWN to 2 dp)
- packaging_cost_ceiling: Maximum packaging cost to satisfy warn fraction (rounded DOWN to 2 dp)
- price_gap_vs_band: 4 dp fractional gap vs competitor benchmark band
- cac_ceiling: Maximum allowable expected CAC to satisfy warn ratio (rounded DOWN to 2 dp)
- break_even_after_change: Resulting break-even volume using finance.py
"""

import copy
from decimal import Decimal, ROUND_CEILING, ROUND_FLOOR, ROUND_HALF_UP
from typing import Any, Optional

from backend.app.services.finance import (
    calculate_financials,
    from_assumptions,
    resolve_packaging_cost,
    round_margin,
    round_money,
    to_decimal,
)
from backend.app.services.validation.rules_config import (
    MARKETING_CAC_RATIO_WARN,
    PACKAGING_WARN_FRACTION,
    PRICING_TARGET_MARGIN_DEFAULT,
)

CENTS: Decimal = Decimal("0.01")
ONE: Decimal = Decimal("1")
ZERO: Decimal = Decimal("0")


def price_for_target_margin(
    assumptions: dict[str, Any],
    target_margin: Optional[Decimal] = None,
) -> Optional[Decimal]:
    """Calculates the minimum retail selling price needed to achieve target margin.

    Formula:
        fixed_var = cogs + packaging + shipping + other_variable + payment_fee_fixed
        pct = payment_fee_fraction + platform_fee_fraction
        price = fixed_var / (1 - pct - target)
    Rounded UP (ROUND_CEILING) to 2 decimal places to guarantee realized margin >= target.

    Returns:
        Decimal selling price or None if target is unreachable (denominator <= 0).
    """
    costs = assumptions.get("costs") or {}
    pricing = assumptions.get("pricing") or {}

    cogs = to_decimal(costs.get("cogs_per_unit")) or ZERO
    packaging_cost, _ = resolve_packaging_cost(assumptions)
    pkg = packaging_cost or ZERO
    shipping = to_decimal(costs.get("shipping_cost_per_unit")) or ZERO
    other_var = to_decimal(costs.get("other_variable_cost_per_unit")) or ZERO
    fee_fixed = to_decimal(costs.get("payment_fee_fixed")) or ZERO

    fixed_var = cogs + pkg + shipping + other_var + fee_fixed

    fee_frac = to_decimal(costs.get("payment_fee_fraction")) or ZERO
    platform_frac = to_decimal(costs.get("platform_fee_fraction")) or ZERO
    pct = fee_frac + platform_frac

    target = target_margin
    if target is None:
        target = to_decimal(pricing.get("target_margin_fraction")) or PRICING_TARGET_MARGIN_DEFAULT

    denom = ONE - pct - target
    if denom <= ZERO or fixed_var <= ZERO:
        return None

    raw_price = fixed_var / denom
    return raw_price.quantize(CENTS, rounding=ROUND_CEILING)


def max_cogs_for_target_margin(
    assumptions: dict[str, Any],
    target_margin: Optional[Decimal] = None,
) -> Optional[Decimal]:
    """Calculates the maximum allowable COGS at current selling price to achieve target margin.

    Formula:
        other_fixed_var = packaging + shipping + other_variable + payment_fee_fixed
        pct = payment_fee_fraction + platform_fee_fraction
        max_cogs = price * (1 - pct - target) - other_fixed_var
    Rounded DOWN (ROUND_FLOOR) to 2 decimal places.

    Returns:
        Decimal max COGS or None if impossible (result <= 0).
    """
    costs = assumptions.get("costs") or {}
    pricing = assumptions.get("pricing") or {}

    selling_price = to_decimal(pricing.get("selling_price"))
    if selling_price is None or selling_price <= ZERO:
        return None

    packaging_cost, _ = resolve_packaging_cost(assumptions)
    pkg = packaging_cost or ZERO
    shipping = to_decimal(costs.get("shipping_cost_per_unit")) or ZERO
    other_var = to_decimal(costs.get("other_variable_cost_per_unit")) or ZERO
    fee_fixed = to_decimal(costs.get("payment_fee_fixed")) or ZERO

    other_fixed_var = pkg + shipping + other_var + fee_fixed

    fee_frac = to_decimal(costs.get("payment_fee_fraction")) or ZERO
    platform_frac = to_decimal(costs.get("platform_fee_fraction")) or ZERO
    pct = fee_frac + platform_frac

    target = target_margin
    if target is None:
        target = to_decimal(pricing.get("target_margin_fraction")) or PRICING_TARGET_MARGIN_DEFAULT

    max_cogs = selling_price * (ONE - pct - target) - other_fixed_var
    if max_cogs <= ZERO:
        return None

    return max_cogs.quantize(CENTS, rounding=ROUND_FLOOR)


def packaging_cost_ceiling(
    selling_price: Optional[Decimal],
    warn_fraction: Optional[Decimal] = None,
) -> Optional[Decimal]:
    """Calculates the maximum packaging cost to stay within warn fraction.

    Formula:
        ceiling = selling_price * warn_fraction
    Rounded DOWN (ROUND_FLOOR) to 2 decimal places.
    """
    if selling_price is None or selling_price <= ZERO:
        return None

    threshold = warn_fraction if warn_fraction is not None else PACKAGING_WARN_FRACTION
    ceiling = selling_price * threshold
    return ceiling.quantize(CENTS, rounding=ROUND_FLOOR)


def price_gap_vs_band(
    selling_price: Optional[Decimal],
    band_min: Optional[Decimal],
    band_max: Optional[Decimal],
) -> Optional[dict[str, Any]]:
    """Calculates price positioning and fractional gap vs competitor price band."""
    if selling_price is None or band_min is None or band_max is None:
        return None

    if selling_price < band_min and band_min > ZERO:
        gap = round_margin((band_min - selling_price) / band_min)
        return {
            "position": "below_band",
            "gap_fraction": gap,
            "band_min": band_min,
            "band_max": band_max,
        }
    elif selling_price > band_max and band_max > ZERO:
        gap = round_margin((selling_price - band_max) / band_max)
        return {
            "position": "above_band",
            "gap_fraction": gap,
            "band_min": band_min,
            "band_max": band_max,
        }
    else:
        return {
            "position": "within_band",
            "gap_fraction": Decimal("0.0000"),
            "band_min": band_min,
            "band_max": band_max,
        }


def cac_ceiling(
    contribution_per_unit: Optional[Decimal],
    warn_ratio: Optional[Decimal] = None,
) -> Optional[Decimal]:
    """Calculates the maximum allowable expected CAC to stay within warning ratio.

    Formula:
        ceiling = contribution_per_unit * warn_ratio
    Rounded DOWN (ROUND_FLOOR) to 2 decimal places.
    """
    if contribution_per_unit is None or contribution_per_unit <= ZERO:
        return None

    ratio = warn_ratio if warn_ratio is not None else MARKETING_CAC_RATIO_WARN
    ceiling = contribution_per_unit * ratio
    return ceiling.quantize(CENTS, rounding=ROUND_FLOOR)


def break_even_after_change(
    assumptions: dict[str, Any],
    overrides: dict[str, Any],
) -> Optional[int]:
    """Computes the resulting break-even sales volume after applying assumption overrides."""
    modified = copy.deepcopy(assumptions)
    for key, val in overrides.items():
        if "." in key:
            section, field_name = key.split(".", 1)
            modified.setdefault(section, {})[field_name] = val
        else:
            if key == "selling_price":
                modified.setdefault("pricing", {})["selling_price"] = val
            elif key in ("packaging_cost",):
                modified.setdefault("packaging", {})["packaging_cost"] = val
                modified.setdefault("costs", {})["packaging_cost"] = val
            elif key in ("cogs_per_unit", "shipping_cost_per_unit", "fixed_costs_total"):
                modified.setdefault("costs", {})[key] = val
            elif key == "expected_cac":
                modified.setdefault("marketing", {})["expected_cac"] = val

    inputs = from_assumptions(modified)
    res = calculate_financials(inputs)
    return res.break_even_units

