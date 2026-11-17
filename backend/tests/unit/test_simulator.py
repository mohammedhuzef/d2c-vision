"""Unit tests for the validation what-if simulation engine."""

from decimal import Decimal
import pytest

from backend.app.services.simulation import simulate


@pytest.fixture
def vector_a_base_assumptions() -> dict:
    return {
        "customer": {
            "target_customer": "Millennials and Gen Z commuters",
            "problem_statement": "Single-use cups create waste",
            "customer_interviews_count": 10,
        },
        "product": {
            "title": "EcoTumbler",
            "differentiation_vs_competitors": "Proprietary double-walled vacuum insulation",
        },
        "packaging": {
            "material": "Recycled kraft paper",
            "packaging_cost": "30.00",
        },
        "pricing": {
            "selling_price": "500.00",
            "target_margin_fraction": "0.40",
        },
        "costs": {
            "cogs_per_unit": "150.00",
            "packaging_cost": "30.00",
            "shipping_cost_per_unit": "40.00",
            "payment_fee_fraction": "0.02",
            "payment_fee_fixed": "0.00",
            "platform_fee_fraction": "0.00",
            "other_variable_cost_per_unit": "0.00",
            "fixed_costs_total": "50000.00",
        },
        "marketing": {
            "channels": ["meta_ads", "tiktok"],
            "expected_cac": "60.00",
        },
    }


@pytest.fixture
def sample_competitors() -> list:
    return [
        {"id": "comp-1", "competitor_id": "comp-1", "name": "Apex", "price_observed": "450.00", "evidence_ids": ["ev-1"]},
        {"id": "comp-2", "competitor_id": "comp-2", "name": "Vessel", "price_observed": "550.00", "evidence_ids": ["ev-2"]},
    ]


@pytest.fixture
def sample_evidence() -> list:
    return [
        {"id": "ev-1", "competitor_id": "comp-1", "verified": True},
        {"id": "ev-2", "competitor_id": "comp-2", "verified": True},
    ]


def test_simulate_empty_overrides_identical(vector_a_base_assumptions, sample_evidence, sample_competitors):
    """Empty overrides produce identical baseline and simulated profiles, empty changes and deltas."""
    res = simulate(vector_a_base_assumptions, {}, sample_evidence, sample_competitors)
    assert res["baseline"] == res["simulated"]
    assert res["changes"] == []
    assert res["deltas"] == {}


def test_simulate_vector_a_and_vector_b_financial_metrics(vector_a_base_assumptions, sample_evidence, sample_competitors):
    """Vector A and Vector B overrides match exact hand-calculated financial metrics."""
    # Vector A: 500 price, 150 cogs, 30 packaging -> 230.00 / 270.00 / 0.5400 / 186
    res_a = simulate(vector_a_base_assumptions, {}, sample_evidence, sample_competitors)
    metrics_a = res_a["baseline"]["metrics"]
    assert metrics_a["contribution_per_unit"] == "270.00"
    assert metrics_a["margin_fraction"] == "0.5400"
    assert metrics_a["break_even_units"] == "186"

    # Vector B: packaging override to 60 -> 260.00 / 240.00 / 0.4800 / 209
    res_b = simulate(
        vector_a_base_assumptions,
        {"packaging_cost": "60.00"},
        sample_evidence,
        sample_competitors,
    )
    metrics_b = res_b["simulated"]["metrics"]
    assert metrics_b["contribution_per_unit"] == "240.00"
    assert metrics_b["margin_fraction"] == "0.4800"
    assert metrics_b["break_even_units"] == "209"

    # Delta checks
    assert res_b["deltas"]["contribution_per_unit"] == "-30.00"
    assert res_b["deltas"]["margin_fraction"] == "-0.0600"
    assert res_b["deltas"]["break_even_units"] == "+23"


def test_simulate_price_adjustment_fixes_pricing_warning(vector_a_base_assumptions, sample_evidence, sample_competitors):
    """Raising price from below-band to within-band moves pricing stage from WARNING to PASSED."""
    # Start with below-band price: 300 (< 450 * 0.80 = 360)
    low_price_assumptions = copy_assumptions = dict(vector_a_base_assumptions)
    low_price_assumptions["pricing"] = {"selling_price": "300.00", "target_margin_fraction": "0.40"}

    # Simulate raising price to 500.00
    res = simulate(
        low_price_assumptions,
        {"selling_price": "500.00"},
        sample_evidence,
        sample_competitors,
    )
    assert res["baseline"]["stages"]["pricing"]["status"] == "WARNING"
    assert res["simulated"]["stages"]["pricing"]["status"] == "PASSED"


def test_simulate_price_change_cascades_to_marketing(vector_a_base_assumptions, sample_evidence, sample_competitors):
    """Price increase increases unit contribution and reduces CAC ratio in downstream marketing stage."""
    # Selling price 500 has contribution 270, expected CAC 60 -> ratio 60/270 = 0.2222
    # Increase selling price to 600 -> variable cost = 150 + 30 + 40 + 600*0.02 (12) = 232 -> contribution = 368
    # CAC ratio = 60 / 368 = 0.1630
    res = simulate(
        vector_a_base_assumptions,
        {"selling_price": "600.00"},
        sample_evidence,
        sample_competitors,
    )
    base_cac_ratio = res["baseline"]["metrics"]["cac_to_contribution_ratio"]
    sim_cac_ratio = res["simulated"]["metrics"]["cac_to_contribution_ratio"]

    assert Decimal(sim_cac_ratio) < Decimal(base_cac_ratio)
    assert res["deltas"]["cac_to_contribution_ratio"] is not None
    assert Decimal(res["deltas"]["cac_to_contribution_ratio"]) < Decimal("0")


def test_simulate_bad_overrides_rejected(vector_a_base_assumptions, sample_evidence, sample_competitors):
    """Simulate strictly rejects unknown field paths, negative values, and non-numeric inputs."""
    # Unknown path
    with pytest.raises(ValueError, match="Unknown override field path"):
        simulate(vector_a_base_assumptions, {"non_existent_field": "100"}, sample_evidence, sample_competitors)

    # Negative amount
    with pytest.raises(ValueError, match="cannot be negative"):
        simulate(vector_a_base_assumptions, {"selling_price": "-50.00"}, sample_evidence, sample_competitors)

    # Non-numeric value
    with pytest.raises(ValueError, match="Invalid non-numeric override"):
        simulate(vector_a_base_assumptions, {"cogs_per_unit": "invalid_number"}, sample_evidence, sample_competitors)


def test_simulate_determinism(vector_a_base_assumptions, sample_evidence, sample_competitors):
    """Calling simulate multiple times with identical inputs yields identical results."""
    overrides = {"selling_price": "520.00", "packaging_cost": "25.00"}
    res1 = simulate(vector_a_base_assumptions, overrides, sample_evidence, sample_competitors)
    res2 = simulate(vector_a_base_assumptions, overrides, sample_evidence, sample_competitors)

    assert res1 == res2

