"""Unit tests for calculate_readiness."""

from decimal import Decimal
from pathlib import Path
import pytest

from backend.app.services.readiness import ReadinessResult, calculate_readiness
from backend.app.services.validation.base import Finding, Severity, StageResult, Status
from backend.app.services.validation.rules_config import (
    READINESS_LABEL_INSUFFICIENT_EVIDENCE,
    READINESS_LABEL_NOT_READY,
    READINESS_LABEL_READY,
    READINESS_LABEL_READY_WITH_WARNINGS,
    STAGE_ORDER,
)


def make_dummy_result(stage: str, status: Status, score: Decimal | None) -> StageResult:
    return StageResult(
        stage=stage,
        status=status,
        score=score,
        metrics={},
        findings=(),
        inputs_used=(),
        upstream_stages_used=(),
    )


def test_precedence_1_critical_stage_failed_overrides_high_score():
    """Rule 1: Pricing FAILED with high scores elsewhere is strictly NOT_READY."""
    results = {
        "customer": make_dummy_result("customer", Status.PASSED, Decimal("100.00")),
        "competitor": make_dummy_result("competitor", Status.PASSED, Decimal("100.00")),
        "product_packaging": make_dummy_result("product_packaging", Status.PASSED, Decimal("100.00")),
        "pricing": make_dummy_result("pricing", Status.FAILED, Decimal("40.00")),  # Critical failed!
        "financial": make_dummy_result("financial", Status.PASSED, Decimal("100.00")),
        "marketing": make_dummy_result("marketing", Status.PASSED, Decimal("100.00")),
    }
    # Weighted average:
    # 100*0.15 + 100*0.15 + 100*0.10 + 40*0.20 + 100*0.25 + 100*0.15
    # = 15 + 15 + 10 + 8 + 25 + 15 = 88.00
    res = calculate_readiness(results)

    assert res.overall_score == Decimal("88.00")
    assert res.label == READINESS_LABEL_NOT_READY
    assert "pricing" in res.blocking_stages


def test_precedence_2_critical_stage_insufficient_evidence():
    """Rule 2: Financial INSUFFICIENT_EVIDENCE or missing yields INSUFFICIENT_EVIDENCE."""
    results = {
        "customer": make_dummy_result("customer", Status.PASSED, Decimal("100.00")),
        "competitor": make_dummy_result("competitor", Status.PASSED, Decimal("100.00")),
        "product_packaging": make_dummy_result("product_packaging", Status.PASSED, Decimal("100.00")),
        "pricing": make_dummy_result("pricing", Status.PASSED, Decimal("100.00")),
        "financial": make_dummy_result("financial", Status.INSUFFICIENT_EVIDENCE, None),  # Critical missing!
        "marketing": make_dummy_result("marketing", Status.PASSED, Decimal("100.00")),
    }
    res = calculate_readiness(results)

    assert res.label == READINESS_LABEL_INSUFFICIENT_EVIDENCE
    assert "financial" in res.missing_stages


def test_precedence_3_non_critical_stage_failed():
    """Rule 3: Non-critical stage FAILED yields NOT_READY."""
    results = {
        "customer": make_dummy_result("customer", Status.PASSED, Decimal("100.00")),
        "competitor": make_dummy_result("competitor", Status.PASSED, Decimal("100.00")),
        "product_packaging": make_dummy_result("product_packaging", Status.FAILED, Decimal("40.00")),  # Non-crit fail!
        "pricing": make_dummy_result("pricing", Status.PASSED, Decimal("100.00")),
        "financial": make_dummy_result("financial", Status.PASSED, Decimal("100.00")),
        "marketing": make_dummy_result("marketing", Status.PASSED, Decimal("100.00")),
    }
    res = calculate_readiness(results)

    assert res.label == READINESS_LABEL_NOT_READY
    assert "product_packaging" in res.blocking_stages


def test_precedence_3_overall_score_below_fifty():
    """Rule 3: Overall score < 50.00 yields NOT_READY even without FAILED status."""
    # Suppose stages have multiple warnings yielding low score
    results = {
        "customer": make_dummy_result("customer", Status.WARNING, Decimal("45.00")),
        "competitor": make_dummy_result("competitor", Status.WARNING, Decimal("45.00")),
        "product_packaging": make_dummy_result("product_packaging", Status.WARNING, Decimal("45.00")),
        "pricing": make_dummy_result("pricing", Status.WARNING, Decimal("45.00")),
        "financial": make_dummy_result("financial", Status.WARNING, Decimal("45.00")),
        "marketing": make_dummy_result("marketing", Status.WARNING, Decimal("45.00")),
    }
    res = calculate_readiness(results)

    assert res.overall_score == Decimal("45.00")
    assert res.label == READINESS_LABEL_NOT_READY


def test_precedence_4_warning_or_sub_seventy_score():
    """Rule 4: Overall score < 70.00 or any WARNING yields READY_WITH_WARNINGS."""
    # Case A: One stage is WARNING with high overall score
    results_warning = {
        "customer": make_dummy_result("customer", Status.WARNING, Decimal("75.00")),
        "competitor": make_dummy_result("competitor", Status.PASSED, Decimal("100.00")),
        "product_packaging": make_dummy_result("product_packaging", Status.PASSED, Decimal("100.00")),
        "pricing": make_dummy_result("pricing", Status.PASSED, Decimal("100.00")),
        "financial": make_dummy_result("financial", Status.PASSED, Decimal("100.00")),
        "marketing": make_dummy_result("marketing", Status.PASSED, Decimal("100.00")),
    }
    res_w = calculate_readiness(results_warning)
    assert res_w.label == READINESS_LABEL_READY_WITH_WARNINGS
    assert "customer" in res_w.warning_stages

    # Case B: All PASSED but overall score is 68.00 (< 70.00)
    results_sub_70 = {
        "customer": make_dummy_result("customer", Status.PASSED, Decimal("68.00")),
        "competitor": make_dummy_result("competitor", Status.PASSED, Decimal("68.00")),
        "product_packaging": make_dummy_result("product_packaging", Status.PASSED, Decimal("68.00")),
        "pricing": make_dummy_result("pricing", Status.PASSED, Decimal("68.00")),
        "financial": make_dummy_result("financial", Status.PASSED, Decimal("68.00")),
        "marketing": make_dummy_result("marketing", Status.PASSED, Decimal("68.00")),
    }
    res_sub = calculate_readiness(results_sub_70)
    assert res_sub.overall_score == Decimal("68.00")
    assert res_sub.label == READINESS_LABEL_READY_WITH_WARNINGS


def test_precedence_5_all_passed_score_seventy_or_above_ready():
    """Rule 5: All PASSED and score >= 70.00 yields READY."""
    # Boundary: exactly 70.00
    results_boundary = {
        "customer": make_dummy_result("customer", Status.PASSED, Decimal("70.00")),
        "competitor": make_dummy_result("competitor", Status.PASSED, Decimal("70.00")),
        "product_packaging": make_dummy_result("product_packaging", Status.PASSED, Decimal("70.00")),
        "pricing": make_dummy_result("pricing", Status.PASSED, Decimal("70.00")),
        "financial": make_dummy_result("financial", Status.PASSED, Decimal("70.00")),
        "marketing": make_dummy_result("marketing", Status.PASSED, Decimal("70.00")),
    }
    res = calculate_readiness(results_boundary)
    assert res.overall_score == Decimal("70.00")
    assert res.label == READINESS_LABEL_READY
    assert not res.blocking_stages
    assert not res.warning_stages
    assert not res.missing_stages


def test_weighted_average_with_renormalized_none_scores():
    """
    Hand-calculated proof of renormalized weighted score:
    Stages:
      customer (wt 0.15): score 100.00
      competitor (wt 0.15): score 75.00
      product_packaging (wt 0.10): score None (INSUFFICIENT_EVIDENCE)
      pricing (wt 0.20): score 100.00
      financial (wt 0.25): score 100.00
      marketing (wt 0.15): score None (INSUFFICIENT_EVIDENCE)

    Active sum of weights = 0.15 + 0.15 + 0.20 + 0.25 = 0.75
    Weighted sum:
      (100.00 * 0.15) = 15.00
      (75.00 * 0.15)  = 11.25
      (100.00 * 0.20) = 20.00
      (100.00 * 0.25) = 25.00
      Total = 15.00 + 11.25 + 20.00 + 25.00 = 71.25

    Overall score:
      71.25 / 0.75 = 95.00
    """
    results = {
        "customer": make_dummy_result("customer", Status.PASSED, Decimal("100.00")),
        "competitor": make_dummy_result("competitor", Status.WARNING, Decimal("75.00")),
        "product_packaging": make_dummy_result("product_packaging", Status.INSUFFICIENT_EVIDENCE, None),
        "pricing": make_dummy_result("pricing", Status.PASSED, Decimal("100.00")),
        "financial": make_dummy_result("financial", Status.PASSED, Decimal("100.00")),
        "marketing": make_dummy_result("marketing", Status.INSUFFICIENT_EVIDENCE, None),
    }
    res = calculate_readiness(results)

    assert res.overall_score == Decimal("95.00")
    # Because competitor is WARNING, label is READY_WITH_WARNINGS
    assert res.label == READINESS_LABEL_READY_WITH_WARNINGS


def test_no_scores_at_all_overall_score_is_none():
    """When all stages are missing or INSUFFICIENT_EVIDENCE, overall_score is None."""
    results = {
        stage: make_dummy_result(stage, Status.INSUFFICIENT_EVIDENCE, None)
        for stage in STAGE_ORDER
    }
    res = calculate_readiness(results)

    assert res.overall_score is None
    assert res.label == READINESS_LABEL_INSUFFICIENT_EVIDENCE


def test_readiness_determinism_across_calls():
    """Ensure identical inputs produce identical outputs across calls."""
    results = {
        "customer": make_dummy_result("customer", Status.PASSED, Decimal("100.00")),
        "competitor": make_dummy_result("competitor", Status.PASSED, Decimal("90.00")),
        "product_packaging": make_dummy_result("product_packaging", Status.PASSED, Decimal("80.00")),
        "pricing": make_dummy_result("pricing", Status.PASSED, Decimal("85.00")),
        "financial": make_dummy_result("financial", Status.PASSED, Decimal("95.00")),
        "marketing": make_dummy_result("marketing", Status.PASSED, Decimal("90.00")),
    }
    res1 = calculate_readiness(results)
    res2 = calculate_readiness(results)

    assert res1.overall_score == res2.overall_score
    assert res1.label == res2.label
    assert res1.breakdown == res2.breakdown

