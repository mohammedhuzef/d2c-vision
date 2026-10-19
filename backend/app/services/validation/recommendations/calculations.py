"""Pure deterministic financial impact calculations for recommendations.

All calculations use strict Decimal arithmetic with ROUND_HALF_UP via finance.py.
Decimal only. No database, network, or external model dependencies.
All thresholds and constants sourced from rules_config.py.
"""

from decimal import Decimal, ROUND_HALF_UP, localcontext
from typing import Any, Dict, Optional, Tuple

from backend.app.services.finance import (
    FinanceInputs,
    FinancialResult,
    calculate_financials,
    from_assumptions,
    fraction_to_str,
    money_to_str,
    round_money_dec,
    round_rate_dec,
)
from backend.app.services.validation import rules_config


def calculate_price_for_target_margin(
    assumptions: Any,
    target_margin: Optional[Decimal] = None,
) -> Optional[Tuple[Decimal, Dict[str, Any]]]:
    """
    Computes selling price needed to hit target_margin_fraction given current unit costs:
    variable_cost = cogs + pkg + ship + other_var + fee_fixed + price * (fee_frac + plat_frac)
    margin = (price - variable_cost) / price >= target_margin
    price = (cogs + pkg + ship + other_var + fee_fixed) / (1 - fee_frac - plat_frac - target_margin)

    Returns (suggested_price, impact_dict) or None if required inputs are missing or impossible.
    """
    inputs = from_assumptions(assumptions) if not isinstance(assumptions, FinanceInputs) else assumptions

    if (
        inputs.cogs_per_unit is None
        or inputs.packaging_cost is None
        or inputs.shipping_cost_per_unit is None
    ):
        return None

    if target_margin is None:
        target_margin = rules_config.PRICING_TARGET_MARGIN_DEFAULT

    other_var = inputs.other_variable_cost_per_unit or rules_config.DECIMAL_ZERO
    fee_fixed = inputs.payment_fee_fixed or rules_config.DECIMAL_ZERO
    fee_frac = (inputs.payment_fee_fraction or rules_config.DECIMAL_ZERO) + (
        inputs.platform_fee_fraction or rules_config.DECIMAL_ZERO
    )

    base_cost = (
        inputs.cogs_per_unit
        + inputs.packaging_cost
        + inputs.shipping_cost_per_unit
        + other_var
        + fee_fixed
    )

    denominator = rules_config.DECIMAL_ONE - fee_frac - target_margin
    if denominator <= rules_config.DECIMAL_ZERO:
        return None

    with localcontext() as ctx:
        ctx.prec = 50
        raw_price = base_cost / denominator
        suggested_price = round_money_dec(raw_price)

    # Calculate financial outcome at suggested price
    modified_inputs = FinanceInputs(
        selling_price=suggested_price,
        cogs_per_unit=inputs.cogs_per_unit,
        packaging_cost=inputs.packaging_cost,
        shipping_cost_per_unit=inputs.shipping_cost_per_unit,
        other_variable_cost_per_unit=inputs.other_variable_cost_per_unit,
        payment_fee_fraction=inputs.payment_fee_fraction,
        payment_fee_fixed=inputs.payment_fee_fixed,
        platform_fee_fraction=inputs.platform_fee_fraction,
        fixed_costs_total=inputs.fixed_costs_total,
    )
    new_fin = calculate_financials(modified_inputs)

    # Current baseline comparison
    cur_fin = calculate_financials(inputs)
    be_delta = None
    if cur_fin.break_even_units is not None and new_fin.break_even_units is not None:
        be_delta = new_fin.break_even_units - cur_fin.break_even_units

    impact: Dict[str, Any] = {
        "target_margin_fraction": target_margin,
        "current_price": inputs.selling_price,
        "suggested_price": suggested_price,
        "projected_contribution_margin": new_fin.contribution_margin,
        "projected_contribution_per_unit": new_fin.contribution_per_unit,
        "break_even_units_after": new_fin.break_even_units,
    }
    if be_delta is not None:
        impact["break_even_units_delta"] = be_delta

    return suggested_price, impact


def calculate_max_unit_cost(
    assumptions: Any,
    target_margin: Optional[Decimal] = None,
) -> Optional[Tuple[Decimal, Dict[str, Any]]]:
    """
    Computes maximum COGS per unit that still hits the target margin at the current price:
    variable_cost <= price * (1 - target_margin)
    cogs_max = price * (1 - target_margin - fee_frac) - pkg - ship - other_var - fee_fixed

    Returns (max_cogs, impact_dict) or None if required inputs are missing.
    """
    inputs = from_assumptions(assumptions) if not isinstance(assumptions, FinanceInputs) else assumptions

    if (
        inputs.selling_price is None
        or inputs.selling_price <= rules_config.DECIMAL_ZERO
        or inputs.packaging_cost is None
        or inputs.shipping_cost_per_unit is None
    ):
        return None

    if target_margin is None:
        target_margin = rules_config.PRICING_TARGET_MARGIN_DEFAULT

    other_var = inputs.other_variable_cost_per_unit or rules_config.DECIMAL_ZERO
    fee_fixed = inputs.payment_fee_fixed or rules_config.DECIMAL_ZERO
    fee_frac = (inputs.payment_fee_fraction or rules_config.DECIMAL_ZERO) + (
        inputs.platform_fee_fraction or rules_config.DECIMAL_ZERO
    )

    with localcontext() as ctx:
        ctx.prec = 50
        max_var_cost = inputs.selling_price * (rules_config.DECIMAL_ONE - target_margin)
        pct_fees = inputs.selling_price * fee_frac
        raw_max_cogs = (
            max_var_cost
            - inputs.packaging_cost
            - inputs.shipping_cost_per_unit
            - other_var
            - fee_fixed
            - pct_fees
        )
        max_cogs = round_money_dec(raw_max_cogs)
        if max_cogs < rules_config.DECIMAL_ZERO:
            max_cogs = rules_config.DECIMAL_ZERO

    # Calculate financial outcome at suggested max COGS
    modified_inputs = FinanceInputs(
        selling_price=inputs.selling_price,
        cogs_per_unit=max_cogs,
        packaging_cost=inputs.packaging_cost,
        shipping_cost_per_unit=inputs.shipping_cost_per_unit,
        other_variable_cost_per_unit=inputs.other_variable_cost_per_unit,
        payment_fee_fraction=inputs.payment_fee_fraction,
        payment_fee_fixed=inputs.payment_fee_fixed,
        platform_fee_fraction=inputs.platform_fee_fraction,
        fixed_costs_total=inputs.fixed_costs_total,
    )
    new_fin = calculate_financials(modified_inputs)

    cur_fin = calculate_financials(inputs)
    be_delta = None
    if cur_fin.break_even_units is not None and new_fin.break_even_units is not None:
        be_delta = new_fin.break_even_units - cur_fin.break_even_units

    impact: Dict[str, Any] = {
        "target_margin_fraction": target_margin,
        "current_cogs": inputs.cogs_per_unit,
        "max_cogs_per_unit": max_cogs,
        "projected_contribution_margin": new_fin.contribution_margin,
        "projected_contribution_per_unit": new_fin.contribution_per_unit,
        "break_even_units_after": new_fin.break_even_units,
    }
    if be_delta is not None:
        impact["break_even_units_delta"] = be_delta

    return max_cogs, impact


def calculate_packaging_cost_ceiling(
    selling_price: Optional[Decimal],
) -> Optional[Tuple[Decimal, Dict[str, Any]]]:
    """
    Computes packaging cost ceiling that brings packaging_cost_fraction back to the warn threshold:
    ceiling = selling_price * rules_config.PACKAGING_WARN_FRACTION

    Returns (packaging_ceiling, impact_dict) or None if selling price is missing/invalid.
    """
    if selling_price is None or selling_price <= rules_config.DECIMAL_ZERO:
        return None

    with localcontext() as ctx:
        ctx.prec = 50
        raw_ceiling = selling_price * rules_config.PACKAGING_WARN_FRACTION
        ceiling = round_money_dec(raw_ceiling)

    impact: Dict[str, Any] = {
        "packaging_warn_fraction": rules_config.PACKAGING_WARN_FRACTION,
        "packaging_ceiling": ceiling,
    }
    return ceiling, impact


def calculate_competitor_price_gap(
    selling_price: Optional[Decimal],
    comp_min: Optional[Decimal],
    comp_max: Optional[Decimal],
) -> Optional[Tuple[Decimal, Dict[str, Any]]]:
    """
    Computes price gap versus the competitor band (how far above/below, as a fraction):
    If price > comp_max * (1 + rules_config.PRICING_ABOVE_BAND_WARN): gap = (price - comp_max) / comp_max
    If price < comp_min * (1 - rules_config.PRICING_BELOW_BAND_WARN): gap = (comp_min - price) / comp_min

    Returns (suggested_price, impact_dict) or None if within band or data missing.
    """
    if selling_price is None or selling_price <= rules_config.DECIMAL_ZERO:
        return None

    with localcontext() as ctx:
        ctx.prec = 50

        if comp_max is not None and comp_max > rules_config.DECIMAL_ZERO:
            max_limit = comp_max * (rules_config.DECIMAL_ONE + rules_config.PRICING_ABOVE_BAND_WARN)
            if selling_price > max_limit:
                gap = round_rate_dec((selling_price - comp_max) / comp_max)
                suggested = round_money_dec(comp_max)
                impact = {
                    "direction": "above_market",
                    "competitor_price_max": comp_max,
                    "price_gap_fraction": gap,
                    "suggested_price": suggested,
                }
                return suggested, impact

        if comp_min is not None and comp_min > rules_config.DECIMAL_ZERO:
            min_limit = comp_min * (rules_config.DECIMAL_ONE - rules_config.PRICING_BELOW_BAND_WARN)
            if selling_price < min_limit:
                gap = round_rate_dec((comp_min - selling_price) / comp_min)
                suggested = round_money_dec(comp_min)
                impact = {
                    "direction": "below_market",
                    "competitor_price_min": comp_min,
                    "price_gap_fraction": gap,
                    "suggested_price": suggested,
                }
                return suggested, impact

    return None


def calculate_cac_ceiling(
    contribution_per_unit: Optional[Decimal],
) -> Optional[Tuple[Decimal, Dict[str, Any]]]:
    """
    Computes CAC ceiling that brings cac_to_contribution_ratio back to the warn threshold:
    cac_ceiling = contribution_per_unit * rules_config.MARKETING_CAC_RATIO_WARN

    Returns (cac_ceiling, impact_dict) or None if contribution is missing/non-positive.
    """
    if contribution_per_unit is None or contribution_per_unit <= rules_config.DECIMAL_ZERO:
        return None

    with localcontext() as ctx:
        ctx.prec = 50
        raw_ceiling = contribution_per_unit * rules_config.MARKETING_CAC_RATIO_WARN
        cac_ceiling = round_money_dec(raw_ceiling)

    impact: Dict[str, Any] = {
        "cac_warn_ratio": rules_config.MARKETING_CAC_RATIO_WARN,
        "contribution_per_unit": contribution_per_unit,
        "cac_ceiling": cac_ceiling,
    }
    return cac_ceiling, impact
