"""Unit tests for CompetitorStage."""

from decimal import Decimal
import pytest

from backend.app.services.validation.base import StageContext, Status
from backend.app.services.validation.stages.competitor import CompetitorStage


def test_competitor_stage_fewer_than_two_competitors():
    """Boundary: 1 competitor (< 2) -> INSUFFICIENT_EVIDENCE (COMPETITORS_INSUFFICIENT)."""
    stage = CompetitorStage()
    ctx = StageContext(
        assumptions={"product": {"differentiation_vs_competitors": "Unique eco lid"}},
        competitor_analyses=[
            {"id": "comp-1", "competitor_id": "c1", "name": "Comp 1", "price_observed": Decimal("25.00"), "evidence_ids": ["ev-1"]}
        ],
        evidence=[{"id": "ev-1", "competitor_id": "c1"}],
    )
    res = stage.run(ctx)

    assert res.status == Status.INSUFFICIENT_EVIDENCE
    assert res.score is None
    assert any(f.code == "COMPETITORS_INSUFFICIENT" for f in res.findings)


def test_competitor_stage_missing_evidence_on_a_competitor():
    """Competitor with 0 evidence items -> INSUFFICIENT_EVIDENCE (COMPETITOR_EVIDENCE_MISSING)."""
    stage = CompetitorStage()
    ctx = StageContext(
        assumptions={"product": {"differentiation_vs_competitors": "Unique eco lid"}},
        competitor_analyses=[
            {"id": "comp-1", "competitor_id": "c1", "name": "Comp 1", "price_observed": Decimal("25.00"), "evidence_ids": ["ev-1"]},
            {"id": "comp-2", "competitor_id": "c2", "name": "Comp 2", "price_observed": Decimal("30.00"), "evidence_ids": []},
        ],
        evidence=[{"id": "ev-1", "competitor_id": "c1"}],  # c2 has 0 evidence
    )
    res = stage.run(ctx)

    assert res.status == Status.INSUFFICIENT_EVIDENCE
    assert res.score is None
    assert any(f.code == "COMPETITOR_EVIDENCE_MISSING" for f in res.findings)


def test_competitor_stage_undifferentiated_product():
    """Empty product.differentiation_vs_competitors -> WARNING (UNDIFFERENTIATED_PRODUCT)."""
    stage = CompetitorStage()
    ctx = StageContext(
        assumptions={"product": {"differentiation_vs_competitors": "  "}},
        competitor_analyses=[
            {"id": "comp-1", "competitor_id": "c1", "price_observed": Decimal("25.00"), "evidence_ids": ["ev-1"]},
            {"id": "comp-2", "competitor_id": "c2", "price_observed": Decimal("30.00"), "evidence_ids": ["ev-2"]},
        ],
        evidence=[
            {"id": "ev-1", "competitor_id": "c1"},
            {"id": "ev-2", "competitor_id": "c2"},
        ],
    )
    res = stage.run(ctx)

    assert res.status == Status.WARNING
    assert res.score == Decimal("75.00")
    assert any(f.code == "UNDIFFERENTIATED_PRODUCT" for f in res.findings)
    assert any(f.field == "product.differentiation_vs_competitors" for f in res.findings)


def test_competitor_stage_no_prices():
    """No competitor prices observed -> NO_PRICE_DATA warning, price band None."""
    stage = CompetitorStage()
    ctx = StageContext(
        assumptions={"product": {"differentiation_vs_competitors": "Unique bamboo body"}},
        competitor_analyses=[
            {"id": "comp-1", "competitor_id": "c1", "evidence_ids": ["ev-1"]},
            {"id": "comp-2", "competitor_id": "c2", "evidence_ids": ["ev-2"]},
        ],
        evidence=[
            {"id": "ev-1", "competitor_id": "c1"},
            {"id": "ev-2", "competitor_id": "c2"},
        ],
    )
    res = stage.run(ctx)

    assert res.status == Status.WARNING
    assert res.score == Decimal("75.00")
    assert any(f.code == "NO_PRICE_DATA" for f in res.findings)
    assert res.metrics["competitor_price_min"] is None
    assert res.metrics["competitor_price_median"] is None
    assert res.metrics["competitor_price_max"] is None


def test_competitor_stage_even_prices_median_half_up():
    """
    Even number of prices hand-calculated:
    Prices 30.00 and 35.01:
      Sum = 65.01
      Average = 65.01 / 2 = 32.505
      ROUND_HALF_UP to 2 dp = 32.51.
    """
    stage = CompetitorStage()
    ctx = StageContext(
        assumptions={"product": {"differentiation_vs_competitors": "Unique vacuum lock"}},
        competitor_analyses=[
            {"id": "comp-1", "competitor_id": "c1", "price_observed": Decimal("30.00"), "evidence_ids": ["ev-1"]},
            {"id": "comp-2", "competitor_id": "c2", "price_observed": Decimal("35.01"), "evidence_ids": ["ev-2"]},
        ],
        evidence=[
            {"id": "ev-1", "competitor_id": "c1"},
            {"id": "ev-2", "competitor_id": "c2"},
        ],
    )
    res = stage.run(ctx)

    assert res.status == Status.PASSED
    assert res.score == Decimal("100.00")
    assert res.metrics["competitor_price_min"] == Decimal("30.00")
    assert res.metrics["competitor_price_max"] == Decimal("35.01")
    assert res.metrics["competitor_price_median"] == Decimal("32.51")
    assert res.metrics["competitors_count"] == 2


def test_competitor_stage_findings_cite_evidence_ids():
    """Findings must cite evidence_ids."""
    stage = CompetitorStage()
    ctx = StageContext(
        assumptions={"product": {"differentiation_vs_competitors": ""}},
        competitor_analyses=[
            {"id": "comp-1", "competitor_id": "c1", "price_observed": Decimal("30.00"), "evidence_ids": ["ev-101"]},
            {"id": "comp-2", "competitor_id": "c2", "price_observed": Decimal("35.00"), "evidence_ids": ["ev-102"]},
        ],
        evidence=[
            {"id": "ev-101", "competitor_id": "c1"},
            {"id": "ev-102", "competitor_id": "c2"},
        ],
    )
    res = stage.run(ctx)

    assert any(f.code == "UNDIFFERENTIATED_PRODUCT" for f in res.findings)
    finding = next(f for f in res.findings if f.code == "UNDIFFERENTIATED_PRODUCT")
    assert "ev-101" in finding.evidence_ids
    assert "ev-102" in finding.evidence_ids

