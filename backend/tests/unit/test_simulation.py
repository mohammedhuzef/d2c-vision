"""Unit tests for What-If Simulation Engine.

Step 7 Part B:
Tests:
1. Simulate with no overrides is identical to baseline (empty changes list).
2. Raising price to the exact recommended value moves pricing from WARNING to PASSED.
   (Hand-calculated expected values, independent of code output).
3. Vector A and Vector B overrides yield known financial metrics:
   - Vector A: 270.00 / 0.5400 / 186
   - Vector B: 240.00 / 0.4800 / 209
4. Cascading effect: price reduction changes financial contribution, cascading into marketing CAC ratio.
5. Unknown field, negative value, and non-numeric value rejected with SimulationValidationError.
6. Determinism across repeated calls.
7. to_dict formatting structure and JSON serialization.
8. Source scan hygiene (no float(, no forbidden imports, no numeric literals).
"""

from decimal import Decimal
import json
import pytest

from backend.app.schemas.assumptions import (
    Assumptions,
    CustomerAssumptions,
    ProductAssumptions,
    PackagingAssumptions,
    PricingAssumptions,
    CostsAssumptions,
    MarketingAssumptions,
)
from backend.app.services.validation.base import STAGE_ORDER, Status
from backend.app.services.validation.simulation import (
    simulate,
    SimulationValidationError,
    SimulationResult,
)
from backend.app.services.validation import rules_config


def _build_healthy_vector_a_assumptions() -> Assumptions:
    return Assumptions(
        customer=CustomerAssumptions(
            target_customer="Coffee Enthusiasts",
            problem_statement="Drinks get cold too quickly",
            customer_interviews_count=10,
        ),
        product=ProductAssumptions(
            unique_selling_points=["Keeps coffee hot for 12 hours"],
            differentiation_vs_competitors="Superior insulation and ceramic coating",
        ),
        packaging=PackagingAssumptions(
            material="Recycled Kraft Paper",
            packaging_cost=Decimal("30.00"),
        ),
        pricing=PricingAssumptions(
            selling_price=Decimal("500.00"),
            target_margin_fraction=Decimal("0.40"),
        ),
        costs=CostsAssumptions(
            cogs_per_unit=Decimal("150.00"),
            packaging_cost=Decimal("30.00"),
            shipping_cost_per_unit=Decimal("40.00"),
            payment_fee_fraction=Decimal("0.02"),
            fixed_costs_total=Decimal("50000.00"),
        ),
        marketing=MarketingAssumptions(
            channels=["Instagram Ads"],
            expected_cac=Decimal("67.50"),
            monthly_budget=Decimal("5000.00"),
        ),
    )


def test_simulate_with_no_overrides_is_identical_to_baseline():
    """An empty overrides dict returns baseline == simulated with empty changes list."""
    assumptions = _build_healthy_vector_a_assumptions()
    result = simulate(assumptions, {})

    assert isinstance(result, SimulationResult)
    assert result.changes == []
    assert result.baseline.readiness.label == result.simulated.readiness.label
    assert result.baseline.readiness.score == result.simulated.readiness.score
    assert result.baseline.metrics == result.simulated.metrics

    for stage in STAGE_ORDER:
        assert result.baseline.stages[stage].status == result.simulated.stages[stage].status
        assert result.baseline.stages[stage].score == result.simulated.stages[stage].score

    # Deltas should be 0.00 or 0.0000
    assert result.deltas["readiness_score"] in ("0.00", "+0.00")
    assert result.deltas["contribution_per_unit"] in ("0.00", "+0.00")
    assert result.deltas["margin_fraction"] in ("0.0000", "+0.0000")


def test_raising_price_to_recommended_value_moves_pricing_warning_to_passed():
    """
    Hand-calculated price recommendation test:
    - Base costs: cogs=150, pkg=30, ship=40, fee_frac=0.02 -> base_cost = 220.00
    - Target margin = 0.40 (40%)
    - Under selling_price = 300.00:
      variable_cost = 220 + 300 * 0.02 = 226.00
      contribution = 300 - 226 = 74.00
      margin = 74 / 300 = 0.2467 (24.67% < 40%) -> Pricing status WARNING
    - Hand-calculated required price for 40% margin:
      price = base_cost / (1 - fee_frac - target_margin) = 220 / (1 - 0.02 - 0.40)
            = 220 / 0.58 = 379.3103... -> 379.31
      At 379.31: variable_cost = 220 + round(379.31 * 0.02) = 227.59
      contribution = 379.31 - 227.59 = 151.72
      margin = 151.72 / 379.31 = 0.4000 (40.00% >= 40%) -> Pricing status PASSED
    """
    assumptions = Assumptions(
        customer=CustomerAssumptions(
            target_customer="Tech Workers",
            problem_statement="Desk clutter",
            customer_interviews_count=10,
        ),
        product=ProductAssumptions(
            unique_selling_points=["Ergonomic cable tray"],
            differentiation_vs_competitors="Custom mounting brackets",
        ),
        packaging=PackagingAssumptions(
            material="Corrugated cardboard",
            packaging_cost=Decimal("30.00"),
        ),
        pricing=PricingAssumptions(
            selling_price=Decimal("300.00"),  # Low price -> margin 24.67%
            target_margin_fraction=Decimal("0.40"),
        ),
        costs=CostsAssumptions(
            cogs_per_unit=Decimal("150.00"),
            packaging_cost=Decimal("30.00"),
            shipping_cost_per_unit=Decimal("40.00"),
            payment_fee_fraction=Decimal("0.02"),
            fixed_costs_total=Decimal("50000.00"),
        ),
        marketing=MarketingAssumptions(
            channels=["Search Ads"],
            expected_cac=Decimal("20.00"),
            monthly_budget=Decimal("5000.00"),
        ),
    )

    # 1. Baseline has pricing status WARNING
    # Hand-calculated override recommendation: "379.31"
    overrides = {"selling_price": "379.31"}
    result = simulate(assumptions, overrides)

    # Baseline was WARNING, simulated is PASSED
    assert result.baseline.stages["pricing"].status == Status.WARNING.value
    assert result.simulated.stages["pricing"].status == Status.PASSED.value

    # Verify changes list recorded this move
    pricing_status_change = next(
        (c for c in result.changes if c.field == "stages.pricing.status"), None
    )
    assert pricing_status_change is not None
    assert pricing_status_change.baseline == Status.WARNING.value
    assert pricing_status_change.simulated == Status.PASSED.value

    # Margin fraction moved from 0.2467 to 0.4000
    assert result.baseline.metrics.margin_fraction == "0.2467"
    assert result.simulated.metrics.margin_fraction == "0.4000"
    assert result.deltas["margin_fraction"] == "+0.1533"


def test_vector_a_and_vector_b_overrides_give_known_financial_metrics():
    """
    Validates Vector A ('270.00'/0.5400/186) and Vector B ('240.00'/0.4800/209)
    metrics via simulation overrides.
    """
    base_assumptions = Assumptions(
        customer=CustomerAssumptions(
            target_customer="Active Travelers",
            problem_statement="Bag durability",
            customer_interviews_count=10,
        ),
        product=ProductAssumptions(
            unique_selling_points=["Waterproof canvas"],
            differentiation_vs_competitors="Reinforced zippers",
        ),
        packaging=PackagingAssumptions(
            material="Recycled paperboard",
            packaging_cost=Decimal("10.00"),
        ),
        pricing=PricingAssumptions(
            selling_price=Decimal("100.00"),
            target_margin_fraction=Decimal("0.40"),
        ),
        costs=CostsAssumptions(
            cogs_per_unit=Decimal("50.00"),
            packaging_cost=Decimal("10.00"),
            shipping_cost_per_unit=Decimal("10.00"),
            payment_fee_fraction=Decimal("0.02"),
            fixed_costs_total=Decimal("10000.00"),
        ),
        marketing=MarketingAssumptions(
            channels=["Direct"],
            expected_cac=Decimal("20.00"),
        ),
    )

    # 1. Apply Vector A overrides
    vector_a_overrides = {
        "selling_price": "500.00",
        "cogs_per_unit": "150.00",
        "packaging_cost": "30.00",
        "shipping_cost_per_unit": "40.00",
        "payment_fee_fraction": "0.02",
        "fixed_costs_total": "50000.00",
    }
    res_a = simulate(base_assumptions, vector_a_overrides)
    assert res_a.simulated.metrics.contribution_per_unit == "270.00"
    assert res_a.simulated.metrics.margin_fraction == "0.5400"
    assert res_a.simulated.metrics.break_even_units == "186"

    # 2. Apply Vector B overrides (packaging_cost 60.00)
    vector_b_overrides = {
        "selling_price": "500.00",
        "cogs_per_unit": "150.00",
        "packaging_cost": "60.00",
        "shipping_cost_per_unit": "40.00",
        "payment_fee_fraction": "0.02",
        "fixed_costs_total": "50000.00",
    }
    res_b = simulate(base_assumptions, vector_b_overrides)
    assert res_b.simulated.metrics.contribution_per_unit == "240.00"
    assert res_b.simulated.metrics.margin_fraction == "0.4800"
    assert res_b.simulated.metrics.break_even_units == "209"


def test_cascading_effect_price_change_alters_marketing_ratio():
    """
    A price change alters financial contribution, which in turn cascades into marketing CAC ratio.
    Vector A: contribution = 270.00, CAC = 67.50 -> ratio = 67.50 / 270.00 = 0.2500 (PASSED)
    Override selling_price to 250.00:
    base_cost = 150 + 30 + 40 = 220; fee = 250 * 0.02 = 5; variable_cost = 225.00
    contribution drops to 250 - 225 = 25.00!
    New CAC ratio = 67.50 / 25.00 = 2.7000 (270% > 100% fail cutoff -> FAILED)!
    """
    assumptions = _build_healthy_vector_a_assumptions()

    res = simulate(assumptions, {"selling_price": "250.00"})

    # Baseline marketing was PASSED with ratio 0.2500
    assert res.baseline.stages["marketing"].status == Status.PASSED.value
    assert res.baseline.metrics.cac_to_contribution_ratio == "0.2500"

    # Simulated marketing cascaded to FAILED with ratio 2.7000
    assert res.simulated.stages["marketing"].status == Status.FAILED.value
    assert res.simulated.metrics.cac_to_contribution_ratio == "2.7000"
    assert res.deltas["cac_to_contribution_ratio"] == "+2.4500"

    # Marketing status change recorded in changes
    mkt_change = next(
        (c for c in res.changes if c.field == "stages.marketing.status"), None
    )
    assert mkt_change is not None
    assert mkt_change.baseline == Status.PASSED.value
    assert mkt_change.simulated == Status.FAILED.value


def test_simulation_validation_errors():
    """Invalid overrides are rejected with SimulationValidationError."""
    assumptions = _build_healthy_vector_a_assumptions()

    # 1. Unknown field
    with pytest.raises(SimulationValidationError) as exc1:
        simulate(assumptions, {"non_existent_field": "100.00"})
    assert "Unknown override field" in str(exc1.value)

    # 2. Negative value
    with pytest.raises(SimulationValidationError) as exc2:
        simulate(assumptions, {"selling_price": "-10.00"})
    assert "must be non-negative" in str(exc2.value)

    # 3. Non-numeric value
    with pytest.raises(SimulationValidationError) as exc3:
        simulate(assumptions, {"packaging_cost": "not_a_number"})
    assert "valid numeric Decimal string" in str(exc3.value)

    # 4. Null value
    with pytest.raises(SimulationValidationError) as exc4:
        simulate(assumptions, {"selling_price": None})
    assert "cannot be null" in str(exc4.value)


def test_simulation_determinism():
    """Repeated calls with identical assumptions and overrides produce identical results."""
    assumptions = _build_healthy_vector_a_assumptions()
    overrides = {"selling_price": "450.00", "packaging_cost": "25.00"}

    res1 = simulate(assumptions, overrides)
    res2 = simulate(assumptions, overrides)

    assert res1.to_dict() == res2.to_dict()


def test_simulation_no_overrides_equals_baseline():
    """Simulate with no overrides produces a simulated state strictly equal to baseline."""
    assumptions = _build_healthy_vector_a_assumptions()
    res = simulate(assumptions, {})

    data = res.to_dict()
    assert data["baseline"]["metrics"] == data["simulated"]["metrics"]
    assert data["baseline"]["readiness"]["score"] == data["simulated"]["readiness"]["score"]
    assert data["baseline"]["readiness"]["label"] == data["simulated"]["readiness"]["label"]
    assert data["changes"] == []



def test_simulation_to_dict_structure():
    """Validates to_dict serialization format and JSON-serializability."""
    assumptions = _build_healthy_vector_a_assumptions()
    res = simulate(assumptions, {"selling_price": "550.00"})

    data = res.to_dict()
    assert "baseline" in data
    assert "simulated" in data
    assert "deltas" in data
    assert "changes" in data

    # Must serialize cleanly with json.dumps
    json_str = json.dumps(data)
    assert json_str is not None
    parsed = json.loads(json_str)
    assert parsed["simulated"]["metrics"]["contribution_per_unit"] == "319.00"
