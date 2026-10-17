"""Unit tests for recommendation calculation formulas (calculations.py).

Pure math tests: strict Decimal, ROUND_HALF_UP, no float(), exact hand-calculated assertions.
"""

from decimal import Decimal
import pytest

from backend.app.schemas.assumptions import (
    Assumptions,
    CostsAssumptions,
    PackagingAssumptions,
    PricingAssumptions,
)
from backend.app.services.finance import FinanceInputs
from backend.app.services.validation import rules_config
from backend.app.services.validation.recommendations.calculations import (
    calculate_cac_ceiling,
    calculate_competitor_price_gap,
    calculate_max_unit_cost,
    calculate_packaging_cost_ceiling,
    calculate_price_for_target_margin,
)


def test_price_for_target_margin_exact():
    """
    Hand-calculated test:
    base_cost = cogs(60.00) + pkg(20.00) + ship(10.00) = 90.00
    fee_frac = 0.02
    target_margin = 0.40
    denominator = 1 - 0.02 - 0.40 = 0.58
    price_needed = 90.00 / 0.58 = 155.1724... -> 155.17
    """
    assumptions = Assumptions(
        pricing=PricingAssumptions(selling_price=Decimal("100.00"), target_margin_fraction=Decimal("0.40")),
        packaging=PackagingAssumptions(packaging_cost=Decimal("20.00")),
        costs=CostsAssumptions(
            cogs_per_unit=Decimal("60.00"),
            packaging_cost=Decimal("20.00"),
            shipping_cost_per_unit=Decimal("10.00"),
            payment_fee_fraction=Decimal("0.02"),
            fixed_costs_total=Decimal("50000.00"),
        ),
    )

    res = calculate_price_for_target_margin(assumptions, Decimal("0.40"))
    assert res is not None
    sug_price, impact = res
    assert sug_price == Decimal("155.17")
    assert impact["suggested_price"] == Decimal("155.17")
    assert impact["current_price"] == Decimal("100.00")
    assert impact["target_margin_fraction"] == Decimal("0.40")
    assert impact["projected_contribution_margin"] == Decimal("0.4000")
    assert impact["break_even_units_after"] is not None


def test_price_for_target_margin_missing_inputs():
    """Missing cogs/packaging/shipping returns None, never guesses figures."""
    assumptions = Assumptions(
        pricing=PricingAssumptions(selling_price=Decimal("100.00")),
        costs=CostsAssumptions(cogs_per_unit=None),
    )
    assert calculate_price_for_target_margin(assumptions, Decimal("0.40")) is None


def test_price_for_target_margin_impossible_fees():
    """When target margin + fees >= 1.0, formula detects impossibility and returns None."""
    assumptions = Assumptions(
        pricing=PricingAssumptions(selling_price=Decimal("100.00")),
        packaging=PackagingAssumptions(packaging_cost=Decimal("20.00")),
        costs=CostsAssumptions(
            cogs_per_unit=Decimal("50.00"),
            packaging_cost=Decimal("20.00"),
            shipping_cost_per_unit=Decimal("10.00"),
            payment_fee_fraction=Decimal("0.60"),
            platform_fee_fraction=Decimal("0.40"),  # Fees alone = 1.00
        ),
    )
    assert calculate_price_for_target_margin(assumptions, Decimal("0.40")) is None


def test_max_unit_cost_exact():
    """
    Hand-calculated test:
    price = 100.00
    target_margin = 0.40
    max variable cost = 100.00 * (1 - 0.40) = 60.00
    fees = 100.00 * 0.02 = 2.00
    pkg = 20.00
    ship = 10.00
    max cogs = 60.00 - 2.00 - 20.00 - 10.00 = 28.00
    """
    assumptions = Assumptions(
        pricing=PricingAssumptions(selling_price=Decimal("100.00"), target_margin_fraction=Decimal("0.40")),
        packaging=PackagingAssumptions(packaging_cost=Decimal("20.00")),
        costs=CostsAssumptions(
            cogs_per_unit=Decimal("60.00"),
            packaging_cost=Decimal("20.00"),
            shipping_cost_per_unit=Decimal("10.00"),
            payment_fee_fraction=Decimal("0.02"),
            fixed_costs_total=Decimal("50000.00"),
        ),
    )

    res = calculate_max_unit_cost(assumptions, Decimal("0.40"))
    assert res is not None
    max_cogs, impact = res
    assert max_cogs == Decimal("28.00")
    assert impact["max_cogs_per_unit"] == Decimal("28.00")
    assert impact["current_cogs"] == Decimal("60.00")
    assert impact["projected_contribution_margin"] == Decimal("0.4000")
    assert impact["break_even_units_after"] is not None


def test_packaging_cost_ceiling_exact():
    """
    Hand-calculated test:
    selling_price = 100.00
    warn_fraction = 0.15
    ceiling = 100.00 * 0.15 = 15.00
    """
    res = calculate_packaging_cost_ceiling(Decimal("100.00"))
    assert res is not None
    ceiling, impact = res
    assert ceiling == Decimal("15.00")
    assert impact["packaging_ceiling"] == Decimal("15.00")
    assert impact["packaging_warn_fraction"] == rules_config.PACKAGING_WARN_FRACTION

    # Non-positive selling price returns None
    assert calculate_packaging_cost_ceiling(Decimal("0.00")) is None
    assert calculate_packaging_cost_ceiling(None) is None


def test_competitor_price_gap_above_and_below():
    """
    Hand-calculated gap tests:
    - Above: price = 600.00, comp_max = 500.00, warn threshold = 15% (575.00)
      gap = (600 - 500) / 500 = 0.2000 (20%)
      suggested price = 500.00
    - Below: price = 350.00, comp_min = 500.00, warn threshold = 20% (400.00)
      gap = (500 - 350) / 500 = 0.3000 (30%)
      suggested price = 500.00
    """
    # Above market
    res_above = calculate_competitor_price_gap(Decimal("600.00"), Decimal("400.00"), Decimal("500.00"))
    assert res_above is not None
    sug_above, imp_above = res_above
    assert sug_above == Decimal("500.00")
    assert imp_above["price_gap_fraction"] == Decimal("0.2000")
    assert imp_above["direction"] == "above_market"

    # Below market
    res_below = calculate_competitor_price_gap(Decimal("350.00"), Decimal("500.00"), Decimal("600.00"))
    assert res_below is not None
    sug_below, imp_below = res_below
    assert sug_below == Decimal("500.00")
    assert imp_below["price_gap_fraction"] == Decimal("0.3000")
    assert imp_below["direction"] == "below_market"

    # Within market band (450 inside [400, 500]) -> None
    assert calculate_competitor_price_gap(Decimal("450.00"), Decimal("400.00"), Decimal("500.00")) is None


def test_cac_ceiling_exact():
    """
    Hand-calculated test:
    contribution = 20.00
    warn_ratio = 0.60
    ceiling = 20.00 * 0.60 = 12.00
    """
    res = calculate_cac_ceiling(Decimal("20.00"))
    assert res is not None
    ceiling, impact = res
    assert ceiling == Decimal("12.00")
    assert impact["cac_ceiling"] == Decimal("12.00")
    assert impact["cac_warn_ratio"] == rules_config.MARKETING_CAC_RATIO_WARN

    # Non-positive contribution returns None
    assert calculate_cac_ceiling(Decimal("0.00")) is None
    assert calculate_cac_ceiling(Decimal("-5.00")) is None
    assert calculate_cac_ceiling(None) is None
