"""Unit tests for ProductPackagingStage."""

from decimal import Decimal
import pytest

from backend.app.services.validation.base import StageContext, Status
from backend.app.services.validation.stages.product_packaging import ProductPackagingStage


def test_packaging_stage_missing_inputs_early_exit():
    """Missing material, packaging_cost, or selling_price yields early INSUFFICIENT_EVIDENCE."""
    stage = ProductPackagingStage()
    ctx = StageContext(assumptions={})
    res = stage.run(ctx)

    assert res.status == Status.INSUFFICIENT_EVIDENCE
    assert res.score is None

    missing_fields = {f.field for f in res.findings if f.code == "MISSING_INPUT"}
    assert "packaging.material" in missing_fields
    assert "packaging.packaging_cost" in missing_fields
    assert "pricing.selling_price" in missing_fields


def test_packaging_stage_boundary_exactly_point_one_five():
    """Ratio exactly 0.15 (15.00 / 100.00) -> PASSED (score 100.00). Strict > requires > 0.15 to warn."""
    stage = ProductPackagingStage()
    ctx = StageContext(
        assumptions={
            "packaging": {"material": "Kraft Paper", "packaging_cost": "15.00"},
            "pricing": {"selling_price": "100.00"},
        }
    )
    res = stage.run(ctx)

    assert res.status == Status.PASSED
    assert res.score == Decimal("100.00")
    assert res.metrics["packaging_cost_ratio"] == Decimal("0.1500")


def test_packaging_stage_boundary_point_one_five_zero_one():
    """Ratio 0.1501 (15.01 / 100.00) -> WARNING (PACKAGING_COST_HIGH, score 75.00)."""
    stage = ProductPackagingStage()
    ctx = StageContext(
        assumptions={
            "packaging": {"material": "Kraft Paper", "packaging_cost": "15.01"},
            "pricing": {"selling_price": "100.00"},
        }
    )
    res = stage.run(ctx)

    assert res.status == Status.WARNING
    assert res.score == Decimal("75.00")
    assert res.metrics["packaging_cost_ratio"] == Decimal("0.1501")
    assert any(f.code == "PACKAGING_COST_HIGH" for f in res.findings)


def test_packaging_stage_boundary_exactly_point_two_five():
    """Ratio exactly 0.25 (25.00 / 100.00) -> WARNING (score 75.00). Strict > requires > 0.25 to fail."""
    stage = ProductPackagingStage()
    ctx = StageContext(
        assumptions={
            "packaging": {"material": "Kraft Paper", "packaging_cost": "25.00"},
            "pricing": {"selling_price": "100.00"},
        }
    )
    res = stage.run(ctx)

    assert res.status == Status.WARNING
    assert res.score == Decimal("75.00")
    assert res.metrics["packaging_cost_ratio"] == Decimal("0.2500")
    assert any(f.code == "PACKAGING_COST_HIGH" for f in res.findings)


def test_packaging_stage_boundary_point_two_five_zero_one():
    """Ratio 0.2501 (25.01 / 100.00) -> FAILED (PACKAGING_COST_EXCESSIVE, score capped at 40.00)."""
    stage = ProductPackagingStage()
    ctx = StageContext(
        assumptions={
            "packaging": {"material": "Kraft Paper", "packaging_cost": "25.01"},
            "pricing": {"selling_price": "100.00"},
        }
    )
    res = stage.run(ctx)

    assert res.status == Status.FAILED
    assert res.score == Decimal("40.00")
    assert res.metrics["packaging_cost_ratio"] == Decimal("0.2501")
    assert any(f.code == "PACKAGING_COST_EXCESSIVE" for f in res.findings)


def test_packaging_stage_resolver_mismatch_warning():
    """When packaging.packaging_cost != costs.packaging_cost, resolver warning triggers WARNING status."""
    stage = ProductPackagingStage()
    ctx = StageContext(
        assumptions={
            "packaging": {"material": "Kraft Paper", "packaging_cost": "10.00"},  # 10% ratio (PASSED threshold)
            "costs": {"packaging_cost": "12.00"},  # Mismatch
            "pricing": {"selling_price": "100.00"},
        }
    )
    res = stage.run(ctx)

    assert res.status == Status.WARNING
    assert res.score == Decimal("75.00")
    assert any(f.code == "PACKAGING_COST_MISMATCH" for f in res.findings)

