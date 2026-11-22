"""Unit tests for Day 5 Evidence Trust and Currency Guardrails.

Verifies:
1. Real products with only mock/sample_seed evidence get INSUFFICIENT_EVIDENCE (COMPETITOR_EVIDENCE_MOCK_ONLY)
2. Demo products with sample_seed evidence remain PASSED / READY
3. Currency mismatch excludes foreign price from price band and emits CURRENCY_MISMATCH finding
4. Completeness check: all emitted codes exist in RECOMMENDATION_RULES
"""

from decimal import Decimal
import pytest

from backend.app.services.validation.base import StageContext, Status, Severity
from backend.app.services.validation.stages.competitor import CompetitorStage, EMITTED_CODES
from backend.app.services.validation.recommendations.rules import RECOMMENDATION_RULES
from backend.app.services.validation.recommendations.generator import generate as generate_recommendations


def test_real_product_with_mock_evidence_fails_competitor_stage():
    """A real founder product with mock/sample_seed evidence must NOT pass."""
    stage = CompetitorStage()

    # Real product without demo marker
    ctx = StageContext(
        assumptions={
            "product": {
                "name": "EcoTumbler Pro",
                "differentiation_vs_competitors": "Triple insulation with ceramic lining",
                "is_demo": False,
            },
            "pricing": {"selling_price": "500.00", "currency": "USD"},
        },
        evidence=(
            {
                "id": "ev-1",
                "competitor_id": "comp-1",
                "source_type": "mock",
                "excerpt": "Mock pricing text",
                "confidence": Decimal("0.50"),
            },
            {
                "id": "ev-2",
                "competitor_id": "comp-2",
                "source_type": "sample_seed",
                "excerpt": "Seed sample text",
                "confidence": Decimal("0.50"),
            },
        ),
        competitor_analyses=(
            {
                "id": "an-1",
                "competitor_id": "comp-1",
                "name": "Competitor Alpha",
                "price_observed": Decimal("480.00"),
                "evidence_ids": ["ev-1"],
            },
            {
                "id": "an-2",
                "competitor_id": "comp-2",
                "name": "Competitor Beta",
                "price_observed": Decimal("520.00"),
                "evidence_ids": ["ev-2"],
            },
        ),
    )

    result = stage.run(ctx)

    assert result.status == Status.INSUFFICIENT_EVIDENCE
    findings = result.findings
    assert any(f.code == "COMPETITOR_EVIDENCE_MOCK_ONLY" for f in findings)
    assert any(f.severity == Severity.CRITICAL for f in findings)


def test_demo_product_with_sample_seed_evidence_passes():
    """A demo product (name starting with SAMPLE) permits sample_seed evidence."""
    stage = CompetitorStage()

    ctx = StageContext(
        assumptions={
            "product": {
                "name": "SAMPLE TerraFlask Tumbler",
                "differentiation_vs_competitors": "Ceramic lining and magnetic lid",
            },
            "pricing": {"selling_price": "500.00", "currency": "USD"},
        },
        evidence=(
            {
                "id": "ev-1",
                "competitor_id": "comp-1",
                "source_type": "sample_seed",
                "excerpt": "Observed retail price 450.00",
                "confidence": Decimal("0.80"),
            },
            {
                "id": "ev-2",
                "competitor_id": "comp-2",
                "source_type": "sample_seed",
                "excerpt": "Observed retail price 550.00",
                "confidence": Decimal("0.80"),
            },
        ),
        competitor_analyses=(
            {
                "id": "an-1",
                "competitor_id": "comp-1",
                "name": "SAMPLE Hydro Pro",
                "price_observed": Decimal("450.00"),
                "evidence_ids": ["ev-1"],
            },
            {
                "id": "an-2",
                "competitor_id": "comp-2",
                "name": "SAMPLE Yeti Tumbler",
                "price_observed": Decimal("550.00"),
                "evidence_ids": ["ev-2"],
            },
        ),
    )

    result = stage.run(ctx)

    assert result.status == Status.PASSED
    assert result.metrics["competitor_price_min"] == Decimal("450.00")
    assert result.metrics["competitor_price_max"] == Decimal("550.00")


def test_currency_mismatch_excludes_foreign_price_from_price_band():
    """Competitor price in EUR must NOT enter USD price band and emits CURRENCY_MISMATCH."""
    stage = CompetitorStage()

    ctx = StageContext(
        assumptions={
            "product": {
                "name": "SAMPLE Smart Flask",
                "differentiation_vs_competitors": "Temperature display lid",
            },
            "pricing": {"selling_price": "100.00", "currency": "USD"},
        },
        evidence=(
            {
                "id": "ev-1",
                "competitor_id": "comp-1",
                "source_type": "sample_seed",
                "excerpt": "USD 90.00 retail price",
                "confidence": Decimal("0.80"),
                "data": {"currency": "USD"},
            },
            {
                "id": "ev-2",
                "competitor_id": "comp-2",
                "source_type": "sample_seed",
                "excerpt": "EUR 95.00 retail price in Europe",
                "confidence": Decimal("0.80"),
                "data": {"currency": "EUR"},
            },
            {
                "id": "ev-3",
                "competitor_id": "comp-3",
                "source_type": "sample_seed",
                "excerpt": "USD 110.00 retail price",
                "confidence": Decimal("0.80"),
                "data": {"currency": "USD"},
            },
        ),
        competitor_analyses=(
            {
                "id": "an-1",
                "competitor_id": "comp-1",
                "name": "US Competitor 1",
                "price_observed": Decimal("90.00"),
                "currency": "USD",
                "evidence_ids": ["ev-1"],
            },
            {
                "id": "an-2",
                "competitor_id": "comp-2",
                "name": "Euro Competitor 2",
                "price_observed": Decimal("95.00"),
                "currency": "EUR",
                "evidence_ids": ["ev-2"],
            },
            {
                "id": "an-3",
                "competitor_id": "comp-3",
                "name": "US Competitor 3",
                "price_observed": Decimal("110.00"),
                "currency": "USD",
                "evidence_ids": ["ev-3"],
            },
        ),
    )

    result = stage.run(ctx)

    # Euro price (95.00) must be excluded from USD price band
    assert result.metrics["competitor_price_min"] == Decimal("90.00")
    assert result.metrics["competitor_price_max"] == Decimal("110.00")
    assert result.metrics["competitor_price_median"] == Decimal("100.00")

    # Warning finding emitted
    mismatch_findings = [f for f in result.findings if f.code == "CURRENCY_MISMATCH"]
    assert len(mismatch_findings) == 1
    assert mismatch_findings[0].severity == Severity.WARNING
    assert "EUR" in mismatch_findings[0].message


def test_recommendation_rules_completeness_includes_day5_codes():
    """All EMITTED_CODES in competitor stage must have recommendation builders."""
    for code in EMITTED_CODES:
        assert code in RECOMMENDATION_RULES, f"Code {code} missing from RECOMMENDATION_RULES registry"
