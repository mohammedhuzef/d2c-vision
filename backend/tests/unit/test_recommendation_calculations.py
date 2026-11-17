"""Unit tests for pure Decimal recommendation calculations."""

from decimal import Decimal
import pytest

from backend.app.services.finance import calculate_financials, FinanceInputs, round_margin
from backend.app.services.validation.recommendations.calculations import (
    break_even_after_change,
    cac_ceiling,
    max_cogs_for_target_margin,
    packaging_cost_ceiling,
    price_for_target_margin,
    price_gap_vs_band,
)
from backend.app.services.validation.rules_config import (
    MARKETING_CAC_RATIO_WARN,
    PACKAGING_WARN_FRACTION,
)


@pytest.fixture
def sample_assumptions() -> dict:
    return {
        "pricing": {
            "selling_price": "100.00",
            "target_margin_fraction": "0.40",
        },
        "costs": {
            "cogs_per_unit": "45.00",
            "packaging_cost": "5.00",
            "shipping_cost_per_unit": "5.00",
            "payment_fee_fraction": "0.02",
            "payment_fee_fixed": "0.30",
            "platform_fee_fraction": "0.00",
            "other_variable_cost_per_unit": "0.00",
            "fixed_costs_total": "10000.00",
        },
        "packaging": {
            "packaging_cost": "5.00",
        },
    }


def test_price_for_target_margin_round_trip(sample_assumptions: dict):
    """Calculated price guarantees margin >= target, while 0.01 lower is strictly below target."""
    target = Decimal("0.40")
    rec_price = price_for_target_margin(sample_assumptions, target)
    assert rec_price is not None

    # Apply rec_price through finance.py
    costs = sample_assumptions["costs"]
    fin_inputs = FinanceInputs(
        selling_price=rec_price,
        cogs_per_unit=Decimal(costs["cogs_per_unit"]),
        packaging_cost=Decimal(costs["packaging_cost"]),
        shipping_cost_per_unit=Decimal(costs["shipping_cost_per_unit"]),
        payment_fee_fraction=Decimal(costs["payment_fee_fraction"]),
        payment_fee_fixed=Decimal(costs["payment_fee_fixed"]),
        platform_fee_fraction=Decimal(costs["platform_fee_fraction"]),
        other_variable_cost_per_unit=Decimal(costs["other_variable_cost_per_unit"]),
        fixed_costs_total=Decimal(costs["fixed_costs_total"]),
    )
    res = calculate_financials(fin_inputs)
    assert res.contribution_margin >= target

    # 0.01 lower price is below target
    fin_lower = FinanceInputs(
        selling_price=rec_price - Decimal("0.01"),
        cogs_per_unit=Decimal(costs["cogs_per_unit"]),
        packaging_cost=Decimal(costs["packaging_cost"]),
        shipping_cost_per_unit=Decimal(costs["shipping_cost_per_unit"]),
        payment_fee_fraction=Decimal(costs["payment_fee_fraction"]),
        payment_fee_fixed=Decimal(costs["payment_fee_fixed"]),
        platform_fee_fraction=Decimal(costs["platform_fee_fraction"]),
        other_variable_cost_per_unit=Decimal(costs["other_variable_cost_per_unit"]),
        fixed_costs_total=Decimal(costs["fixed_costs_total"]),
    )
    res_lower = calculate_financials(fin_lower)
    assert res_lower.contribution_margin < target


def test_max_cogs_for_target_margin_round_trip(sample_assumptions: dict):
    """Calculated max_cogs guarantees margin >= target, while 0.01 higher is strictly below target."""
    target = Decimal("0.40")
    max_cogs = max_cogs_for_target_margin(sample_assumptions, target)
    assert max_cogs is not None

    costs = sample_assumptions["costs"]
    price = Decimal(sample_assumptions["pricing"]["selling_price"])

    fin_inputs = FinanceInputs(
        selling_price=price,
        cogs_per_unit=max_cogs,
        packaging_cost=Decimal(costs["packaging_cost"]),
        shipping_cost_per_unit=Decimal(costs["shipping_cost_per_unit"]),
        payment_fee_fraction=Decimal(costs["payment_fee_fraction"]),
        payment_fee_fixed=Decimal(costs["payment_fee_fixed"]),
        platform_fee_fraction=Decimal(costs["platform_fee_fraction"]),
        other_variable_cost_per_unit=Decimal(costs["other_variable_cost_per_unit"]),
        fixed_costs_total=Decimal(costs["fixed_costs_total"]),
    )
    res = calculate_financials(fin_inputs)
    assert res.contribution_margin >= target

    # 0.01 higher COGS is below target
    fin_higher = FinanceInputs(
        selling_price=price,
        cogs_per_unit=max_cogs + Decimal("0.01"),
        packaging_cost=Decimal(costs["packaging_cost"]),
        shipping_cost_per_unit=Decimal(costs["shipping_cost_per_unit"]),
        payment_fee_fraction=Decimal(costs["payment_fee_fraction"]),
        payment_fee_fixed=Decimal(costs["payment_fee_fixed"]),
        platform_fee_fraction=Decimal(costs["platform_fee_fraction"]),
        other_variable_cost_per_unit=Decimal(costs["other_variable_cost_per_unit"]),
        fixed_costs_total=Decimal(costs["fixed_costs_total"]),
    )
    res_higher = calculate_financials(fin_higher)
    assert res_higher.contribution_margin < target


def test_packaging_cost_ceiling_round_trip():
    """packaging_cost_ceiling for $500 selling price is exactly 75.00."""
    price = Decimal("500.00")
    ceil = packaging_cost_ceiling(price)
    assert ceil == Decimal("75.00")
    # At 75.00, ratio is 75/500 = 0.1500 (<= 0.15)
    ratio_at_ceil = round_margin(ceil / price)
    assert ratio_at_ceil <= PACKAGING_WARN_FRACTION

    # At 75.05, ratio is 75.05 / 500 = 0.1501 (> 0.15)
    ratio_above = round_margin((ceil + Decimal("0.05")) / price)
    assert ratio_above > PACKAGING_WARN_FRACTION


def test_cac_ceiling_round_trip():
    """cac_ceiling for $100 contribution is exactly 60.00."""
    contrib = Decimal("100.00")
    ceil = cac_ceiling(contrib)
    assert ceil == Decimal("60.00")
    ratio_at_ceil = round_margin(ceil / contrib)
    assert ratio_at_ceil <= MARKETING_CAC_RATIO_WARN

    # 60.01 exceeds 0.60
    ratio_above = round_margin((ceil + Decimal("0.01")) / contrib)
    assert ratio_above > MARKETING_CAC_RATIO_WARN


def test_price_gap_vs_band():
    """Calculates price gap vs competitor band accurately."""
    below = price_gap_vs_band(Decimal("300.00"), Decimal("400.00"), Decimal("500.00"))
    assert below["position"] == "below_band"
    assert below["gap_fraction"] == Decimal("0.2500")

    above = price_gap_vs_band(Decimal("600.00"), Decimal("400.00"), Decimal("500.00"))
    assert above["position"] == "above_band"
    assert above["gap_fraction"] == Decimal("0.2000")

    within = price_gap_vs_band(Decimal("450.00"), Decimal("400.00"), Decimal("500.00"))
    assert within["position"] == "within_band"
    assert within["gap_fraction"] == Decimal("0.0000")


def test_break_even_after_change(sample_assumptions: dict):
    """Computes updated break even volume when assumption overrides are applied."""
    orig_be = break_even_after_change(sample_assumptions, {})
    assert orig_be is not None

    # Higher price increases unit contribution and reduces break even volume
    reduced_be = break_even_after_change(sample_assumptions, {"selling_price": "150.00"})
    assert reduced_be is not None
    assert reduced_be < orig_be

