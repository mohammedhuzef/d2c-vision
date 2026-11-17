"""Unit tests for the validation pipeline runner."""

from decimal import Decimal
import pytest

from backend.app.services.validation.base import Finding, Severity, StageResult, Status
from backend.app.services.validation.pipeline import STAGE_REGISTRY, run_pipeline
from backend.app.services.validation.rules_config import STAGE_ORDER


@pytest.fixture
def vector_a_assumptions() -> dict:
    return {
        "customer": {
            "target_customer": "Urban dog owners living in high-rise apartments",
            "problem_statement": "Difficulty finding organic, single-ingredient treats delivered regularly",
            "customer_interviews_count": 12,
            "segment_size_estimate": 450000,
            "willingness_to_pay_signal": "high",
        },
        "product": {
            "title": "ZenPup Calm Chews",
            "category": "pet_supplements",
        },
        "packaging": {
            "material": "Recycled kraft paper cylinder with soy ink printing",
            "box_dimensions": "6x4x2 inches",
            "packaging_cost": "3.50",
            "box_type": "rigid_box",
        },
        "pricing": {
            "selling_price": "32.00",
            "target_margin_fraction": "0.40",
        },
        "costs": {
            "cogs_per_unit": "9.50",
            "packaging_cost": "3.50",
            "shipping_cost_per_unit": "4.20",
            "payment_fee_fraction": "0.02",
            "payment_fee_fixed": "0.30",
            "platform_fee_fraction": "0.00",
            "other_variable_cost_per_unit": "0.50",
            "fixed_costs_total": "15000",
        },
        "marketing": {
            "channels": ["meta_ads", "tiktok", "vet_partnerships"],
            "expected_cac": "8.00",
        },
    }


@pytest.fixture
def sample_competitors() -> list:
    return [
        {
            "id": "comp-1",
            "name": "Pawsitive",
            "price": "30.00",
            "verified_evidence_count": 2,
        },
        {
            "id": "comp-2",
            "name": "BarkBoutique",
            "price": "35.00",
            "verified_evidence_count": 1,
        },
    ]


@pytest.fixture
def sample_evidence() -> list:
    return [
        {"id": "ev-1", "competitor_id": "comp-1", "verified": True},
        {"id": "ev-2", "competitor_id": "comp-1", "verified": True},
        {"id": "ev-3", "competitor_id": "comp-2", "verified": True},
    ]


def test_pipeline_full_run_vector_a(vector_a_assumptions, sample_evidence, sample_competitors):
    """Full run executes all 6 stages and returns results in STAGE_ORDER."""
    results = run_pipeline(
        vector_a_assumptions,
        sample_evidence,
        sample_competitors,
    )
    assert list(results.keys()) == list(STAGE_ORDER)

    # All stages should have run (not carried forward)
    for name, res in results.items():
        assert res.stage == name
        assert res.carried_forward_from is None
        assert res.status in (Status.PASSED, Status.WARNING)

    # Check upstream propagation: marketing read financial contribution (13.36)
    mkt = results["marketing"]
    assert mkt.metrics["contribution_per_unit"] == Decimal("13.36")
    # expected_cac = 8.00 / 13.36 = 0.5988 (which is <= 0.6000 -> PASSED)
    assert mkt.metrics["cac_to_contribution_ratio"] == Decimal("0.5988")
    assert mkt.status == Status.PASSED


def test_pipeline_carry_forward(vector_a_assumptions, sample_evidence, sample_competitors):
    """Stages not targeted and not downstream are carried forward with result_id."""
    initial_results = run_pipeline(
        vector_a_assumptions,
        sample_evidence,
        sample_competitors,
    )
    # Mock previous dict: name -> (StageResult, result_id)
    previous = {
        name: (res, f"res-id-{name}")
        for name, res in initial_results.items()
    }

    # Run only marketing stage
    targeted_results = run_pipeline(
        vector_a_assumptions,
        sample_evidence,
        sample_competitors,
        stages=["marketing"],
        previous=previous,
    )

    # customer, competitor, product_packaging, pricing, financial should be carried forward
    assert targeted_results["customer"].carried_forward_from == "res-id-customer"
    assert targeted_results["competitor"].carried_forward_from == "res-id-competitor"
    assert targeted_results["product_packaging"].carried_forward_from == "res-id-product_packaging"
    assert targeted_results["pricing"].carried_forward_from == "res-id-pricing"
    assert targeted_results["financial"].carried_forward_from == "res-id-financial"

    # marketing was explicitly requested, so carried_forward_from is None
    assert targeted_results["marketing"].carried_forward_from is None


def test_pipeline_downstream_forced_reexecution(vector_a_assumptions, sample_evidence, sample_competitors):
    """Downstream stages of an executed stage are forced to re-execute even if not in stages subset."""
    initial_results = run_pipeline(
        vector_a_assumptions,
        sample_evidence,
        sample_competitors,
    )
    previous = {
        name: (res, f"res-id-{name}")
        for name, res in initial_results.items()
    }

    # Target financial only. financial -> marketing is downstream!
    targeted_results = run_pipeline(
        vector_a_assumptions,
        sample_evidence,
        sample_competitors,
        stages=["financial"],
        previous=previous,
    )

    # financial and marketing must NOT be carried forward
    assert targeted_results["financial"].carried_forward_from is None
    assert targeted_results["marketing"].carried_forward_from is None

    # Unrelated stages remain carried forward
    assert targeted_results["customer"].carried_forward_from == "res-id-customer"
    assert targeted_results["competitor"].carried_forward_from == "res-id-competitor"
    assert targeted_results["product_packaging"].carried_forward_from == "res-id-product_packaging"
    assert targeted_results["pricing"].carried_forward_from == "res-id-pricing"


def test_pipeline_missing_previous_forces_execution(vector_a_assumptions, sample_evidence, sample_competitors):
    """If a stage is not in stages subset but missing from previous, it must be executed."""
    # previous only contains customer
    initial_results = run_pipeline(
        vector_a_assumptions,
        sample_evidence,
        sample_competitors,
    )
    previous = {
        "customer": (initial_results["customer"], "id-cust"),
    }

    results = run_pipeline(
        vector_a_assumptions,
        sample_evidence,
        sample_competitors,
        stages=["customer"],
        previous=previous,
    )

    # customer was carried forward because it was in previous and only customer requested?
    # Wait: customer was in stages, so it ran!
    assert results["customer"].carried_forward_from is None
    # competitor, product_packaging, pricing, financial, marketing were NOT in previous, so they had to run
    assert results["competitor"].carried_forward_from is None
    assert results["financial"].carried_forward_from is None


def test_pipeline_crash_isolation(vector_a_assumptions, sample_evidence, sample_competitors, monkeypatch):
    """Exceptions raised in a stage's run() are trapped with NOT_RUN and STAGE_ERROR."""
    class CrashingPricingStage:
        @property
        def name(self) -> str:
            return "pricing"

        def run(self, ctx):
            raise RuntimeError("Database connection died inside stage /etc/passwd trace")

    monkeypatch.setitem(STAGE_REGISTRY, "pricing", CrashingPricingStage)

    results = run_pipeline(
        vector_a_assumptions,
        sample_evidence,
        sample_competitors,
    )

    # pricing crashed safely
    pricing_res = results["pricing"]
    assert pricing_res.status == Status.NOT_RUN
    assert pricing_res.score is None
    assert pricing_res.metrics == {}
    assert len(pricing_res.findings) == 1
    finding = pricing_res.findings[0]
    assert finding.code == "STAGE_ERROR"
    assert finding.severity == Severity.CRITICAL
    assert "An unexpected error occurred" in finding.message
    # No stack trace or path leaked
    assert "passwd" not in finding.message
    assert "RuntimeError" not in finding.message

    # Other stages before and after still ran successfully
    assert results["customer"].status in (Status.PASSED, Status.WARNING)
    assert results["competitor"].status in (Status.PASSED, Status.WARNING)
    assert results["financial"].status in (Status.PASSED, Status.WARNING)
    assert results["marketing"].status in (Status.PASSED, Status.WARNING)


def test_pipeline_determinism(vector_a_assumptions, sample_evidence, sample_competitors):
    """Running pipeline multiple times with identical inputs yields identical outputs."""
    run1 = run_pipeline(vector_a_assumptions, sample_evidence, sample_competitors)
    run2 = run_pipeline(vector_a_assumptions, sample_evidence, sample_competitors)

    for stg in STAGE_ORDER:
        assert run1[stg].status == run2[stg].status
        assert run1[stg].score == run2[stg].score
        assert run1[stg].metrics == run2[stg].metrics
        assert run1[stg].findings == run2[stg].findings


def test_vector_a_all_passed():
    """True Vector A (price 500, competitors 450/550, 10 interviews, CAC 60) results in all PASSED, overall score 100.00, label READY."""
    from backend.app.services.readiness import calculate_readiness

    assumptions = {
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
    competitors = [
        {"id": "comp-1", "competitor_id": "comp-1", "name": "Apex", "price_observed": "450.00", "evidence_ids": ["ev-1"]},
        {"id": "comp-2", "competitor_id": "comp-2", "name": "Vessel", "price_observed": "550.00", "evidence_ids": ["ev-2"]},
    ]
    evidence = [
        {"id": "ev-1", "competitor_id": "comp-1", "verified": True},
        {"id": "ev-2", "competitor_id": "comp-2", "verified": True},
    ]

    results = run_pipeline(assumptions, evidence, competitors)
    for stg in STAGE_ORDER:
        assert results[stg].status == Status.PASSED
        assert results[stg].score == Decimal("100.00")

    readiness = calculate_readiness(results)
    assert readiness.label == "READY"
    assert readiness.overall_score == Decimal("100.00")
