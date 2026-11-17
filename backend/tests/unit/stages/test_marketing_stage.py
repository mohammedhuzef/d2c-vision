"""Unit tests for MarketingStage."""

from decimal import Decimal
import pytest

from backend.app.services.validation.base import Severity, StageContext, StageResult, Status
from backend.app.services.validation.rules_config import (
    MARKETING_CAC_RATIO_FAIL,
    MARKETING_CAC_RATIO_WARN,
)
from backend.app.services.validation.stages.marketing import MarketingStage


@pytest.fixture
def marketing_stage() -> MarketingStage:
    return MarketingStage()


@pytest.fixture
def financial_upstream_result() -> StageResult:
    return StageResult(
        stage="financial",
        status=Status.PASSED,
        score=Decimal("100.00"),
        metrics={"contribution_per_unit": Decimal("10.00")},
    )


def test_marketing_missing_inputs(marketing_stage: MarketingStage):
    """Missing channels or non-positive expected_cac returns INSUFFICIENT_EVIDENCE."""
    ctx = StageContext(assumptions={"marketing": {"channels": []}})
    res = marketing_stage.run(ctx)
    assert res.status == Status.INSUFFICIENT_EVIDENCE
    assert any(f.code == "MISSING_INPUT" and f.field == "marketing.channels" for f in res.findings)
    assert any(f.code == "MISSING_INPUT" and f.field == "marketing.expected_cac" for f in res.findings)


def test_marketing_missing_upstream_financial(marketing_stage: MarketingStage):
    """Missing upstream financial stage returns INSUFFICIENT_EVIDENCE with MISSING_UPSTREAM."""
    ctx = StageContext(
        assumptions={"marketing": {"channels": ["instagram", "meta"], "expected_cac": "5.00"}},
        upstream={},
    )
    res = marketing_stage.run(ctx)
    assert res.status == Status.INSUFFICIENT_EVIDENCE
    assert any(f.code == "MISSING_UPSTREAM" for f in res.findings)
    assert "financial" in res.upstream_stages_used


def test_marketing_upstream_negative_contribution(marketing_stage: MarketingStage):
    """Non-positive upstream contribution yields FAILED with NEGATIVE_UNIT_ECONOMICS."""
    fin_upstream = StageResult(
        stage="financial",
        status=Status.FAILED,
        score=Decimal("40.00"),
        metrics={"contribution_per_unit": Decimal("-2.50")},
    )
    ctx = StageContext(
        assumptions={"marketing": {"channels": ["meta"], "expected_cac": "5.00"}},
        upstream={"financial": fin_upstream},
    )
    res = marketing_stage.run(ctx)
    assert res.status == Status.FAILED
    assert any(f.code == "NEGATIVE_UNIT_ECONOMICS" for f in res.findings)
    assert res.metrics["cac_to_contribution_ratio"] is None


def test_marketing_cac_ratio_warn_boundary(marketing_stage: MarketingStage, financial_upstream_result: StageResult):
    """Ratio exactly 0.6000 is PASSED; 0.6001 is WARNING MARKETING_CAC_RATIO_HIGH."""
    # contribution = 10.00 -> CAC = 6.00 gives ratio 0.6000
    ctx_6000 = StageContext(
        assumptions={"marketing": {"channels": ["meta"], "expected_cac": "6.00"}},
        upstream={"financial": financial_upstream_result},
    )
    res_6000 = marketing_stage.run(ctx_6000)
    assert res_6000.metrics["cac_to_contribution_ratio"] == Decimal("0.6000")
    assert res_6000.status == Status.PASSED
    assert not any(f.code == "MARKETING_CAC_RATIO_HIGH" for f in res_6000.findings)

    # CAC = 6.001 -> quantizes to 0.6001 (> 0.6000) -> WARNING
    ctx_6001 = StageContext(
        assumptions={"marketing": {"channels": ["meta"], "expected_cac": "6.001"}},
        upstream={"financial": financial_upstream_result},
    )
    res_6001 = marketing_stage.run(ctx_6001)
    assert res_6001.metrics["cac_to_contribution_ratio"] == Decimal("0.6001")
    assert res_6001.status == Status.WARNING
    assert any(f.code == "MARKETING_CAC_RATIO_HIGH" for f in res_6001.findings)


def test_marketing_cac_ratio_fail_boundary(marketing_stage: MarketingStage, financial_upstream_result: StageResult):
    """Ratio exactly 1.0000 is WARNING; 1.0001 is FAILED MARKETING_CAC_EXCEEDS_CONTRIBUTION."""
    # CAC = 10.00 -> ratio 1.0000 -> WARNING
    ctx_1000 = StageContext(
        assumptions={"marketing": {"channels": ["meta"], "expected_cac": "10.00"}},
        upstream={"financial": financial_upstream_result},
    )
    res_1000 = marketing_stage.run(ctx_1000)
    assert res_1000.metrics["cac_to_contribution_ratio"] == Decimal("1.0000")
    assert res_1000.status == Status.WARNING
    assert not any(f.code == "MARKETING_CAC_EXCEEDS_CONTRIBUTION" for f in res_1000.findings)

    # CAC = 10.001 -> ratio 1.0001 (> 1.0000) -> FAILED
    ctx_1001 = StageContext(
        assumptions={"marketing": {"channels": ["meta"], "expected_cac": "10.001"}},
        upstream={"financial": financial_upstream_result},
    )
    res_1001 = marketing_stage.run(ctx_1001)
    assert res_1001.metrics["cac_to_contribution_ratio"] == Decimal("1.0001")
    assert res_1001.status == Status.FAILED
    assert any(f.code == "MARKETING_CAC_EXCEEDS_CONTRIBUTION" for f in res_1001.findings)

