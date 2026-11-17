"""Unit tests for CustomerStage."""

from decimal import Decimal
import pytest

from backend.app.services.validation.base import StageContext, Status
from backend.app.services.validation.stages.customer import CustomerStage


def test_customer_stage_missing_inputs_early_exit():
    """Missing required inputs yields early INSUFFICIENT_EVIDENCE with MISSING_INPUT findings."""
    stage = CustomerStage()
    ctx = StageContext(assumptions={"customer": {}})
    res = stage.run(ctx)

    assert res.status == Status.INSUFFICIENT_EVIDENCE
    assert res.score is None

    missing_fields = {f.field for f in res.findings if f.code == "MISSING_INPUT"}
    assert "customer.target_customer" in missing_fields
    assert "customer.problem_statement" in missing_fields
    assert "customer.customer_interviews_count" in missing_fields


def test_customer_stage_boundary_four_interviews():
    """Boundary: 4 interviews (< 5) -> INSUFFICIENT_EVIDENCE (CUSTOMER_INTERVIEWS_INSUFFICIENT)."""
    stage = CustomerStage()
    ctx = StageContext(
        assumptions={
            "customer": {
                "target_customer": "Commuters",
                "problem_statement": "Leaking mugs",
                "customer_interviews_count": 4,
            }
        }
    )
    res = stage.run(ctx)

    assert res.status == Status.INSUFFICIENT_EVIDENCE
    assert res.score is None
    assert any(f.code == "CUSTOMER_INTERVIEWS_INSUFFICIENT" for f in res.findings)


def test_customer_stage_boundary_five_interviews():
    """Boundary: 5 interviews (5..9) -> WARNING (CUSTOMER_INTERVIEWS_LOW)."""
    stage = CustomerStage()
    ctx = StageContext(
        assumptions={
            "customer": {
                "target_customer": "Commuters",
                "problem_statement": "Leaking mugs",
                "customer_interviews_count": 5,
            }
        }
    )
    res = stage.run(ctx)

    assert res.status == Status.WARNING
    assert res.score == Decimal("75.00")
    assert any(f.code == "CUSTOMER_INTERVIEWS_LOW" for f in res.findings)


def test_customer_stage_boundary_nine_interviews():
    """Boundary: 9 interviews (5..9) -> WARNING (CUSTOMER_INTERVIEWS_LOW)."""
    stage = CustomerStage()
    ctx = StageContext(
        assumptions={
            "customer": {
                "target_customer": "Commuters",
                "problem_statement": "Leaking mugs",
                "customer_interviews_count": 9,
            }
        }
    )
    res = stage.run(ctx)

    assert res.status == Status.WARNING
    assert res.score == Decimal("75.00")
    assert any(f.code == "CUSTOMER_INTERVIEWS_LOW" for f in res.findings)


def test_customer_stage_boundary_ten_interviews():
    """Boundary: 10 interviews (>= 10) -> PASSED (score 100.00)."""
    stage = CustomerStage()
    ctx = StageContext(
        assumptions={
            "customer": {
                "target_customer": "Commuters",
                "problem_statement": "Leaking mugs",
                "customer_interviews_count": 10,
            }
        }
    )
    res = stage.run(ctx)

    assert res.status == Status.PASSED
    assert res.score == Decimal("100.00")
    assert not res.findings
    assert res.metrics["customer_interviews_count"] == 10

