"""Unit tests for FinancialStage."""

from decimal import Decimal
import pytest

from backend.app.services.validation.base import Severity, StageContext, Status
from backend.app.services.validation.rules_config import FINANCIAL_BREAK_EVEN_WARN_UNITS
from backend.app.services.validation.stages.financial import FinancialStage


@pytest.fixture
def financial_stage() -> FinancialStage:
    return FinancialStage()


@pytest.fixture
def base_assumptions() -> dict:
    return {
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
        "packaging": {
            "packaging_cost": "3.50",
        },
    }


def test_financial_missing_required_inputs(financial_stage: FinancialStage):
    """Missing selling_price or fixed_costs causes INSUFFICIENT_EVIDENCE."""
    ctx = StageContext(assumptions={})
    result = financial_stage.run(ctx)
    assert result.status == Status.INSUFFICIENT_EVIDENCE
    assert any(f.code == "MISSING_INPUT" for f in result.findings)


def test_financial_passed_vector_a(financial_stage: FinancialStage, base_assumptions: dict):
    """post_products inputs evaluate to PASSED with break-even 1123 (< 2500)."""
    ctx = StageContext(assumptions=base_assumptions)
    result = financial_stage.run(ctx)
    assert result.status == Status.PASSED
    assert result.metrics["break_even_units"] == 1123
    assert result.metrics["contribution_per_unit"] == Decimal("13.36")
    assert result.metrics["contribution_margin"] == Decimal("0.4175")


def test_financial_break_even_boundary(financial_stage: FinancialStage, base_assumptions: dict):
    """break_even_units > 2500 warns; exactly 2500 does NOT warn."""
    # base contribution = 13.36
    # fixed_costs = 2500 * 13.36 = 33400 -> ceiling(33400 / 13.36) = 2500
    base_assumptions["costs"]["fixed_costs_total"] = "33400"
    ctx = StageContext(assumptions=base_assumptions)
    res_2500 = financial_stage.run(ctx)
    assert res_2500.metrics["break_even_units"] == 2500
    assert not any(f.code == "FINANCIAL_HIGH_BREAK_EVEN_VOLUME" for f in res_2500.findings)

    # fixed_costs = 33401 -> ceiling(33401 / 13.36) = 2501 (> 2500) -> WARNING
    base_assumptions["costs"]["fixed_costs_total"] = "33401"
    ctx2 = StageContext(assumptions=base_assumptions)
    res_2501 = financial_stage.run(ctx2)
    assert res_2501.metrics["break_even_units"] == 2501
    assert any(f.code == "FINANCIAL_HIGH_BREAK_EVEN_VOLUME" for f in res_2501.findings)
    assert res_2501.status == Status.WARNING


def test_financial_negative_unit_economics(financial_stage: FinancialStage, base_assumptions: dict):
    """Contribution per unit <= 0 causes FAILED with FINANCIAL_UNIT_ECONOMICS_NEGATIVE."""
    base_assumptions["costs"]["cogs_per_unit"] = "40.00"  # selling_price is 32.00
    ctx = StageContext(assumptions=base_assumptions)
    result = financial_stage.run(ctx)
    assert result.status == Status.FAILED
    assert any(f.code == "FINANCIAL_UNIT_ECONOMICS_NEGATIVE" for f in result.findings)
    assert result.metrics["break_even_units"] is None


def test_financial_margin_below_target(financial_stage: FinancialStage, base_assumptions: dict):
    """Margin below target causes WARNING FINANCIAL_MARGIN_BELOW_TARGET."""
    base_assumptions["pricing"]["target_margin_fraction"] = "0.50"
    ctx = StageContext(assumptions=base_assumptions)
    result = financial_stage.run(ctx)
    assert result.status == Status.WARNING
    assert any(f.code == "FINANCIAL_MARGIN_BELOW_TARGET" for f in result.findings)

