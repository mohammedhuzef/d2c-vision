"""Unit tests for recommendation rules mapping, priority assignment, and generator."""

from decimal import Decimal
import pytest

from backend.app.services.validation.base import Finding, Severity, StageResult, Status
from backend.app.services.validation.recommendations.generator import generate
from backend.app.services.validation.recommendations.models import ActionType, RecommendationItem
from backend.app.services.validation.recommendations.rules import RECOMMENDATION_RULES
from backend.app.services.validation.rules_config import (
    RECOMMENDATION_PRIORITIES,
    STAGE_ORDER,
)
from backend.app.services.validation.stages.competitor import EMITTED_CODES as COMP_CODES
from backend.app.services.validation.stages.customer import EMITTED_CODES as CUST_CODES
from backend.app.services.validation.stages.financial import EMITTED_CODES as FIN_CODES
from backend.app.services.validation.stages.marketing import EMITTED_CODES as MKT_CODES
from backend.app.services.validation.stages.pricing import EMITTED_CODES as PRICE_CODES
from backend.app.services.validation.stages.product_packaging import EMITTED_CODES as PKG_CODES


def test_completeness_every_emitted_code_has_rule():
    """All finding codes emitted across all six stages must have a mapped rule."""
    all_stage_codes = CUST_CODES | COMP_CODES | PKG_CODES | PRICE_CODES | FIN_CODES | MKT_CODES | {"STAGE_ERROR"}
    missing = all_stage_codes - set(RECOMMENDATION_RULES.keys())
    assert not missing, f"Finding codes missing recommendation rules: {missing}"


def test_vector_b_packaging_warning_recommends_75():
    """Vector B with packaging 90 and price 500 yields ratio 0.18 and recommends ceiling 75.00."""
    assumptions = {
        "pricing": {"selling_price": "500.00"},
        "packaging": {"packaging_cost": "90.00"},
        "costs": {"packaging_cost": "90.00"},
    }
    pkg_result = StageResult(
        stage="product_packaging",
        status=Status.WARNING,
        score=Decimal("75.00"),
        metrics={
            "packaging_cost": Decimal("90.00"),
            "packaging_cost_ratio": Decimal("0.1800"),
        },
        findings=(
            Finding(
                code="PACKAGING_COST_HIGH",
                severity=Severity.WARNING,
                message="Packaging cost ratio 0.1800 exceeds warning threshold.",
                field="packaging.packaging_cost",
            ),
        ),
    )

    recs = generate({"product_packaging": pkg_result}, assumptions)
    assert len(recs) == 1
    rec = recs[0]
    assert rec.action_type == ActionType.REDUCE_PACKAGING_COST.value
    assert rec.target_field == "packaging.packaging_cost"
    assert rec.suggested_value == "75.00"
    assert rec.impact.get("packaging_cost_ceiling") == "75.00"


def test_passed_stages_produce_nothing():
    """Stages with status PASSED produce no recommendations."""
    passed_result = StageResult(
        stage="pricing",
        status=Status.PASSED,
        score=Decimal("100.00"),
        metrics={"selling_price": Decimal("100.00")},
    )
    recs = generate({"pricing": passed_result}, {})
    assert recs == []


def test_missing_input_produces_provide_input_with_no_invented_number():
    """MISSING_INPUT findings produce PROVIDE_INPUT action with None suggested_value."""
    stage_result = StageResult(
        stage="customer",
        status=Status.INSUFFICIENT_EVIDENCE,
        score=None,
        findings=(
            Finding(
                code="MISSING_INPUT",
                severity=Severity.CRITICAL,
                message="Target customer is missing.",
                field="customer.target_customer",
            ),
        ),
    )
    recs = generate({"customer": stage_result}, {})
    assert len(recs) == 1
    rec = recs[0]
    assert rec.action_type == ActionType.PROVIDE_INPUT.value
    assert rec.target_field == "customer.target_customer"
    assert rec.suggested_value is None


def test_margin_remediation_dual_recommendations():
    """PRICING_MARGIN_BELOW_TARGET emits both price increase and cost reduction linked with group_id."""
    assumptions = {
        "pricing": {"selling_price": "100.00", "target_margin_fraction": "0.40"},
        "costs": {
            "cogs_per_unit": "70.00",
            "packaging_cost": "5.00",
            "shipping_cost_per_unit": "5.00",
            "payment_fee_fraction": "0.02",
            "payment_fee_fixed": "0.00",
            "platform_fee_fraction": "0.00",
            "other_variable_cost_per_unit": "0.00",
            "fixed_costs_total": "10000.00",
        },
        "packaging": {"packaging_cost": "5.00"},
    }
    stage_result = StageResult(
        stage="pricing",
        status=Status.WARNING,
        score=Decimal("75.00"),
        findings=(
            Finding(
                code="PRICING_MARGIN_BELOW_TARGET",
                severity=Severity.WARNING,
                message="Margin below target.",
                field="pricing.selling_price",
            ),
        ),
    )
    recs = generate({"pricing": stage_result}, assumptions)
    assert len(recs) == 2

    action_types = {r.action_type for r in recs}
    assert action_types == {ActionType.ADJUST_PRICE.value, ActionType.REDUCE_COST.value}

    # Verify shared group_id in impact
    group_ids = [r.impact.get("group_id") for r in recs]
    assert len(set(group_ids)) == 1
    assert group_ids[0] is not None


def test_every_action_type_reachable():
    """Verify all 8 ActionType values can be generated across diverse stage findings."""
    assumptions = {
        "pricing": {"selling_price": "100.00", "target_margin_fraction": "0.40"},
        "costs": {
            "cogs_per_unit": "70.00",
            "packaging_cost": "25.00",
            "shipping_cost_per_unit": "5.00",
            "payment_fee_fraction": "0.02",
            "payment_fee_fixed": "0.00",
            "platform_fee_fraction": "0.00",
            "other_variable_cost_per_unit": "0.00",
            "fixed_costs_total": "10000.00",
        },
        "packaging": {"packaging_cost": "25.00"},
        "marketing": {"expected_cac": "50.00"},
    }

    results = {
        "customer": StageResult(
            stage="customer",
            status=Status.WARNING,
            score=Decimal("75.00"),
            findings=(
                Finding(code="MISSING_INPUT", severity=Severity.CRITICAL, message="Missing input", field="customer.target_customer"),
                Finding(code="CUSTOMER_INTERVIEWS_LOW", severity=Severity.WARNING, message="Low interviews"),
            ),
        ),
        "competitor": StageResult(
            stage="competitor",
            status=Status.WARNING,
            score=Decimal("75.00"),
            findings=(
                Finding(code="UNDIFFERENTIATED_PRODUCT", severity=Severity.WARNING, message="Undifferentiated"),
            ),
        ),
        "product_packaging": StageResult(
            stage="product_packaging",
            status=Status.WARNING,
            score=Decimal("75.00"),
            metrics={"packaging_cost": Decimal("25.00"), "packaging_cost_ratio": Decimal("0.2500")},
            findings=(
                Finding(code="PACKAGING_COST_HIGH", severity=Severity.WARNING, message="High packaging cost"),
                Finding(code="PACKAGING_COST_MISMATCH", severity=Severity.WARNING, message="Packaging mismatch"),
            ),
        ),
        "pricing": StageResult(
            stage="pricing",
            status=Status.WARNING,
            score=Decimal("75.00"),
            findings=(
                Finding(code="PRICING_MARGIN_BELOW_TARGET", severity=Severity.WARNING, message="Margin low"),
            ),
        ),
        "marketing": StageResult(
            stage="marketing",
            status=Status.WARNING,
            score=Decimal("75.00"),
            metrics={"contribution_per_unit": Decimal("10.00"), "expected_cac": Decimal("50.00"), "cac_to_contribution_ratio": Decimal("5.0000")},
            findings=(
                Finding(code="MARKETING_CAC_RATIO_HIGH", severity=Severity.WARNING, message="High CAC"),
            ),
        ),
    }

    recs = generate(results, assumptions)
    generated_actions = {r.action_type for r in recs}
    for expected_action in ActionType:
        assert expected_action.value in generated_actions, f"ActionType {expected_action} not reachable"


def test_recommendation_to_dict_matches_contract():
    """to_dict produces exactly the fields defined in RecommendationItemResponse schema."""
    rec = RecommendationItem(
        code="PACKAGING_COST_HIGH",
        stage="product_packaging",
        priority="MEDIUM",
        title="Reduce packaging unit cost",
        detail="Packaging cost consumes high margin",
        action_type=ActionType.REDUCE_PACKAGING_COST.value,
        target_field="packaging.packaging_cost",
        current_value="25.00",
        suggested_value="15.00",
        finding_codes=("PACKAGING_COST_HIGH",),
        evidence_ids=("ev-1",),
        impact={"metric": "packaging_cost_ceiling"},
    )
    d = rec.to_dict()
    expected_keys = {
        "id", "code", "stage", "priority", "title", "detail", "action_type",
        "target_field", "current_value", "suggested_value", "finding_codes",
        "evidence_ids", "impact",
    }
    assert set(d.keys()) == expected_keys
    assert d["priority"] in RECOMMENDATION_PRIORITIES
    assert d["evidence_ids"] == ["ev-1"]
    assert d["finding_codes"] == ["PACKAGING_COST_HIGH"]


def test_generator_deterministic_ordering():
    """Generator output ordering is deterministic and ordered by priority, STAGE_ORDER, code."""
    assumptions = {
        "pricing": {"selling_price": "100.00", "target_margin_fraction": "0.40"},
        "costs": {"cogs_per_unit": "70.00", "packaging_cost": "25.00"},
        "packaging": {"packaging_cost": "25.00"},
    }
    results = {
        "pricing": StageResult(
            stage="pricing",
            status=Status.FAILED,
            score=Decimal("40.00"),
            findings=(
                Finding(code="PRICING_MARGIN_UNVIABLE", severity=Severity.CRITICAL, message="Unviable"),
            ),
        ),
        "customer": StageResult(
            stage="customer",
            status=Status.WARNING,
            score=Decimal("75.00"),
            findings=(
                Finding(code="CUSTOMER_INTERVIEWS_LOW", severity=Severity.WARNING, message="Low"),
            ),
        ),
    }

    recs1 = generate(results, assumptions)
    recs2 = generate(results, assumptions)

    assert [r.id for r in recs1] == [r.id for r in recs2]
    # Critical stage FAILED produces CRITICAL priority (comes first)
    assert recs1[0].priority == "CRITICAL"
    assert recs1[-1].priority == "MEDIUM"

