"""Unit tests for PricingStage."""

from decimal import Decimal
import pytest

from backend.app.services.validation.base import Severity, StageContext, StageResult, Status
from backend.app.services.validation.rules_config import (
    PRICING_ABOVE_BAND_WARN,
    PRICING_BELOW_BAND_WARN,
    PRICING_FAIL_MARGIN,
    PRICING_TARGET_MARGIN_DEFAULT,
)
from backend.app.services.validation.stages.pricing import PricingStage

ONE = Decimal("1")


@pytest.fixture
def pricing_stage() -> PricingStage:
    return PricingStage()


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


def test_pricing_missing_required_inputs(pricing_stage: PricingStage):
    """Missing selling_price or cogs causes INSUFFICIENT_EVIDENCE."""
    ctx = StageContext(assumptions={})
    result = pricing_stage.run(ctx)
    assert result.status == Status.INSUFFICIENT_EVIDENCE
    assert result.score is None
    codes = [f.code for f in result.findings]
    assert "MISSING_INPUT" in codes


def test_pricing_no_competitor_band(pricing_stage: PricingStage, base_assumptions: dict):
    """When no competitor band exists in upstream, info finding is added and margin checks still run."""
    ctx = StageContext(assumptions=base_assumptions, upstream={})
    result = pricing_stage.run(ctx)
    assert result.status == Status.PASSED
    assert any(f.code == "NO_COMPETITOR_BAND" for f in result.findings)
    assert result.metrics["competitor_price_min"] is None
    assert result.metrics["competitor_price_max"] is None
    assert result.metrics["realized_margin"] == Decimal("0.4175")


def test_pricing_above_competitor_band(pricing_stage: PricingStage, base_assumptions: dict):
    """Price > band_max * 1.15 produces WARNING PRICE_ABOVE_MARKET_BAND strictly."""
    band_max = Decimal("25.00")
    band_min = Decimal("20.00")
    # Threshold = 25 * 1.15 = 28.75. base selling_price is 32.00 (> 28.75)
    competitor_result = StageResult(
        stage="competitor",
        status=Status.PASSED,
        score=Decimal("100"),
        metrics={"competitor_price_min": band_min, "competitor_price_max": band_max},
    )
    ctx = StageContext(assumptions=base_assumptions, upstream={"competitor": competitor_result})
    result = pricing_stage.run(ctx)
    assert result.status == Status.WARNING
    assert any(f.code == "PRICE_ABOVE_MARKET_BAND" for f in result.findings)
    assert "competitor" in result.upstream_stages_used


def test_pricing_exact_upper_boundary_not_warned(pricing_stage: PricingStage, base_assumptions: dict):
    """Price exactly equal to band_max * 1.15 is NOT warned (strict inequality)."""
    # band_max = 20.00 -> 20.00 * 1.15 = 23.00
    base_assumptions["pricing"]["selling_price"] = "23.00"
    base_assumptions["costs"]["cogs_per_unit"] = "5.00"
    base_assumptions["packaging"]["packaging_cost"] = "1.00"
    base_assumptions["costs"]["shipping_cost_per_unit"] = "1.00"

    competitor_result = StageResult(
        stage="competitor",
        status=Status.PASSED,
        score=Decimal("100"),
        metrics={"competitor_price_min": Decimal("20.00"), "competitor_price_max": Decimal("20.00")},
    )
    ctx = StageContext(assumptions=base_assumptions, upstream={"competitor": competitor_result})
    result = pricing_stage.run(ctx)
    assert not any(f.code == "PRICE_ABOVE_MARKET_BAND" for f in result.findings)

    # 23.01 is strictly greater -> warns
    base_assumptions["pricing"]["selling_price"] = "23.01"
    ctx2 = StageContext(assumptions=base_assumptions, upstream={"competitor": competitor_result})
    result2 = pricing_stage.run(ctx2)
    assert any(f.code == "PRICE_ABOVE_MARKET_BAND" for f in result2.findings)


def test_pricing_below_competitor_band(pricing_stage: PricingStage, base_assumptions: dict):
    """Price < band_min * (1 - 0.20) produces WARNING PRICE_BELOW_MARKET_BAND strictly."""
    # band_min = 50.00 -> 50.00 * 0.80 = 40.00. Price = 32.00 (< 40.00)
    competitor_result = StageResult(
        stage="competitor",
        status=Status.PASSED,
        score=Decimal("100"),
        metrics={"competitor_price_min": Decimal("50.00"), "competitor_price_max": Decimal("60.00")},
    )
    ctx = StageContext(assumptions=base_assumptions, upstream={"competitor": competitor_result})
    result = pricing_stage.run(ctx)
    assert result.status == Status.WARNING
    assert any(f.code == "PRICE_BELOW_MARKET_BAND" for f in result.findings)


def test_pricing_exact_lower_boundary_not_warned(pricing_stage: PricingStage, base_assumptions: dict):
    """Price exactly equal to band_min * 0.80 is NOT warned (strict inequality)."""
    # band_min = 50.00 -> 50 * 0.80 = 40.00
    base_assumptions["pricing"]["selling_price"] = "40.00"
    base_assumptions["pricing"]["target_margin_fraction"] = "0.20"
    competitor_result = StageResult(
        stage="competitor",
        status=Status.PASSED,
        score=Decimal("100"),
        metrics={"competitor_price_min": Decimal("50.00"), "competitor_price_max": Decimal("60.00")},
    )
    ctx = StageContext(assumptions=base_assumptions, upstream={"competitor": competitor_result})
    result = pricing_stage.run(ctx)
    assert not any(f.code == "PRICE_BELOW_MARKET_BAND" for f in result.findings)

    # 39.99 is strictly less -> warns
    base_assumptions["pricing"]["selling_price"] = "39.99"
    ctx2 = StageContext(assumptions=base_assumptions, upstream={"competitor": competitor_result})
    result2 = pricing_stage.run(ctx2)
    assert any(f.code == "PRICE_BELOW_MARKET_BAND" for f in result2.findings)


def test_pricing_margin_unviable_and_below_target(pricing_stage: PricingStage, base_assumptions: dict):
    """realized_margin < 0.15 yields FAILED PRICING_MARGIN_UNVIABLE."""
    # Raise cogs to crush margin below 0.15
    base_assumptions["costs"]["cogs_per_unit"] = "28.00"
    ctx = StageContext(assumptions=base_assumptions)
    result = pricing_stage.run(ctx)
    assert result.status == Status.FAILED
    assert any(f.code == "PRICING_MARGIN_UNVIABLE" for f in result.findings)


def test_pricing_margin_below_target(pricing_stage: PricingStage, base_assumptions: dict):
    """realized_margin < target_margin but >= 0.15 yields WARNING PRICING_MARGIN_BELOW_TARGET."""
    base_assumptions["pricing"]["target_margin_fraction"] = "0.50"
    # base margin is 0.4175, which is < 0.50 but >= 0.15
    ctx = StageContext(assumptions=base_assumptions)
    result = pricing_stage.run(ctx)
    assert result.status == Status.WARNING
    assert any(f.code == "PRICING_MARGIN_BELOW_TARGET" for f in result.findings)

