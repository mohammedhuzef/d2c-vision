"""Unit and integration tests for TASK FINAL-1: THREE REAL-LIFE FIXES.

Tests:
1. Fix 1: Currency default to INR, symbol normalization, hand-calculated price bands, USD exclusion, explicit USD.
2. Fix 2: Server-side only demo marker, SAMPLE Soap mock evidence rejected, client is_demo ignored, seeded demo verdicts.
3. Fix 3: Honest labeling of influencer CTR & conversion estimates in text fields and LIMITATIONS.md.
"""

from decimal import Decimal
import uuid
import pytest
from starlette.testclient import TestClient

from backend.app.core.config import settings
from backend.app.models.analysis import CompetitorAnalysis
from backend.app.models.competitor import Competitor
from backend.app.models.evidence import ResearchEvidence
from backend.app.models.influencer import Influencer
from backend.app.models.product import Product
from backend.app.models.version import ProductVersion
from backend.app.services.influencer_matching import calculate_match_analytics
from backend.app.services.validation.base import Severity, StageContext, Status
from backend.app.services.validation.rules_config import (
    DEFAULT_CURRENCY,
    INFLUENCER_CTR_FACTOR,
    INFLUENCER_CONVERSION_RATE,
    normalize_currency,
)
from backend.app.services.validation.stages.competitor import CompetitorStage
from backend.app.usecases.run_validation import run_validation_use_case
from scripts.seed import seed_database


# ==============================================================================
# FIX 1: CURRENCY DEFAULT & NORMALIZATION TESTS
# ==============================================================================

def test_currency_normalization_symbols_and_spellings():
    """Verify that normalize_currency normalizes all supported symbols & spellings and rejects unknowns."""
    # Rupee variations -> INR
    assert normalize_currency("₹") == "INR"
    assert normalize_currency("Rs") == "INR"
    assert normalize_currency("Rs.") == "INR"
    assert normalize_currency("INR") == "INR"
    assert normalize_currency("rupees") == "INR"
    assert normalize_currency("  ₹  ") == "INR"

    # Dollar variations -> USD
    assert normalize_currency("$") == "USD"
    assert normalize_currency("USD") == "USD"
    assert normalize_currency("US$") == "USD"

    # Euro variations -> EUR
    assert normalize_currency("€") == "EUR"
    assert normalize_currency("EUR") == "EUR"

    # Pound variations -> GBP
    assert normalize_currency("£") == "GBP"
    assert normalize_currency("GBP") == "GBP"

    # Unknown symbols stay unknown (None)
    assert normalize_currency("XYZ") is None
    assert normalize_currency("???") is None
    assert normalize_currency("") is None
    assert normalize_currency(None) is None


def test_product_created_without_currency_gets_default_inr(client: TestClient, db_session):
    """When a product is created without pricing.currency, DEFAULT_CURRENCY (INR) is stored."""
    payload = {
        "name": "Ayurvedic Face Serum",
        "description": "Natural brightening serum",
        "category": "Beauty & Personal Care",
        "target_retail_price": "899.00",
        "cogs": "250.00",
    }
    resp = client.post("/api/v1/products", json=payload)
    assert resp.status_code == 201
    prod_id = resp.json()["id"]

    detail_resp = client.get(f"/api/v1/products/{prod_id}")
    assert detail_resp.status_code == 200
    assumptions = detail_resp.json()["assumptions"]
    assert assumptions["pricing"]["currency"] == "INR"
    assert assumptions["pricing"]["currency"] == settings.DEFAULT_CURRENCY


def test_hand_calculated_inr_price_band_and_usd_exclusion():
    """Hand-calculated test:

    Product currency: INR (default)
    Competitor 1 price: 450 INR
    Competitor 2 price: 550 INR
    Competitor 3 price: 15 USD
    Expected result:
    - Band is exactly 450.00 - 550.00 (median 500.00)
    - Competitor 3 is excluded from band with CURRENCY_MISMATCH warning
    """
    stage = CompetitorStage()

    ctx = StageContext(
        assumptions={
            "product": {
                "name": "Herbal Shampoo",
                "differentiation_vs_competitors": "Sulfate-free cold pressed ingredients",
            },
            "pricing": {"selling_price": "499.00"},  # No currency -> defaults to DEFAULT_CURRENCY (INR)
        },
        evidence=(
            {
                "id": "ev-1",
                "competitor_id": "comp-1",
                "source_type": "pricing_page",
                "excerpt": "Retail price ₹450",
                "confidence": Decimal("0.80"),
            },
            {
                "id": "ev-2",
                "competitor_id": "comp-2",
                "source_type": "pricing_page",
                "excerpt": "Retail price Rs. 550",
                "confidence": Decimal("0.80"),
            },
            {
                "id": "ev-3",
                "competitor_id": "comp-3",
                "source_type": "pricing_page",
                "excerpt": "Retail price $15 USD",
                "confidence": Decimal("0.80"),
            },
        ),
        competitor_analyses=(
            {
                "id": "an-1",
                "competitor_id": "comp-1",
                "name": "Kesh King",
                "price_observed": Decimal("450.00"),
                "currency": "₹",
                "evidence_ids": ["ev-1"],
            },
            {
                "id": "an-2",
                "competitor_id": "comp-2",
                "name": "Indulekha",
                "price_observed": Decimal("550.00"),
                "currency": "Rs.",
                "evidence_ids": ["ev-2"],
            },
            {
                "id": "an-3",
                "competitor_id": "comp-3",
                "name": "Global Herbal",
                "price_observed": Decimal("15.00"),
                "currency": "USD",
                "evidence_ids": ["ev-3"],
            },
        ),
    )

    result = stage.run(ctx)

    # Competitor 1 (450) and Competitor 2 (550) are included
    assert result.metrics["competitor_price_min"] == Decimal("450.00")
    assert result.metrics["competitor_price_median"] == Decimal("500.00")
    assert result.metrics["competitor_price_max"] == Decimal("550.00")

    # Competitor 3 (15 USD) is excluded and generates CURRENCY_MISMATCH warning
    currency_mismatches = [f for f in result.findings if f.code == "CURRENCY_MISMATCH"]
    assert len(currency_mismatches) == 1
    assert "Global Herbal" in currency_mismatches[0].message
    assert "USD" in currency_mismatches[0].message
    assert "INR" in currency_mismatches[0].message


def test_explicit_usd_currency_still_works():
    """When a product explicitly specifies USD currency, USD competitor prices form the band."""
    stage = CompetitorStage()

    ctx = StageContext(
        assumptions={
            "product": {
                "name": "Global Tumbler",
                "differentiation_vs_competitors": "Aerospace insulation",
            },
            "pricing": {"selling_price": "35.00", "currency": "USD"},
        },
        evidence=(
            {
                "id": "ev-1",
                "competitor_id": "comp-1",
                "source_type": "pricing_page",
                "excerpt": "$30 USD",
                "confidence": Decimal("0.80"),
            },
            {
                "id": "ev-2",
                "competitor_id": "comp-2",
                "source_type": "pricing_page",
                "excerpt": "$40 USD",
                "confidence": Decimal("0.80"),
            },
            {
                "id": "ev-3",
                "competitor_id": "comp-3",
                "source_type": "pricing_page",
                "excerpt": "₹2500 INR",
                "confidence": Decimal("0.80"),
            },
        ),
        competitor_analyses=(
            {
                "id": "an-1",
                "competitor_id": "comp-1",
                "name": "US Competitor 1",
                "price_observed": Decimal("30.00"),
                "currency": "$",
                "evidence_ids": ["ev-1"],
            },
            {
                "id": "an-2",
                "competitor_id": "comp-2",
                "name": "US Competitor 2",
                "price_observed": Decimal("40.00"),
                "currency": "USD",
                "evidence_ids": ["ev-2"],
            },
            {
                "id": "an-3",
                "competitor_id": "comp-3",
                "name": "Indian Competitor",
                "price_observed": Decimal("2500.00"),
                "currency": "INR",
                "evidence_ids": ["ev-3"],
            },
        ),
    )

    result = stage.run(ctx)

    assert result.metrics["competitor_price_min"] == Decimal("30.00")
    assert result.metrics["competitor_price_max"] == Decimal("40.00")
    assert any(f.code == "CURRENCY_MISMATCH" and "Indian Competitor" in f.message for f in result.findings)


# ==============================================================================
# FIX 2: SERVER-SIDE DEMO MARKER TESTS
# ==============================================================================

def test_real_product_named_sample_soap_fails_with_mock_evidence(db_session):
    """A user cannot bypass evidence verification by naming their product 'SAMPLE Soap'."""
    prod = Product(
        id=uuid.uuid4(),
        name="SAMPLE Soap",
        category="Beauty & Personal Care",
        description="Handcrafted cold-process soap",
        status="draft",  # Real product created through standard flow
    )
    db_session.add(prod)
    version = ProductVersion(
        id=uuid.uuid4(),
        product_id=prod.id,
        version_number=1,
        assumptions={
            "product": {
                "name": "SAMPLE Soap",
                "differentiation_vs_competitors": "Goat milk base",
            },
            "pricing": {"selling_price": "299.00", "currency": "INR"},
        },
    )
    db_session.add(version)

    comp = Competitor(
        id=uuid.uuid4(),
        product_id=prod.id,
        name="Competitor Soap Co",
    )
    db_session.add(comp)

    ev = ResearchEvidence(
        id=uuid.uuid4(),
        product_id=prod.id,
        competitor_id=comp.id,
        title="Competitor Soap Evidence",
        excerpt="Price observed ₹250",
        content_hash="mockhash123",
        source_type="sample_seed",  # Mock / seed evidence
        confidence=Decimal("0.80"),
        data={"currency": "INR", "price": "250.00"},
    )
    db_session.add(ev)

    an = CompetitorAnalysis(
        id=uuid.uuid4(),
        product_id=prod.id,
        competitor_id=comp.id,
        summary="Competitor soap analysis",
        price_observed=Decimal("250.00"),
        evidence_ids=[ev.id],
    )
    db_session.add(an)
    db_session.commit()

    # Execute validation usecase
    run = run_validation_use_case(db=db_session, product_id=prod.id)

    # Competitor stage must NOT pass; mock evidence is rejected because product.status != "demo"
    comp_result = next(r for r in run.results if r.stage == "competitor")
    assert comp_result.status in (Status.INSUFFICIENT_EVIDENCE, Status.INSUFFICIENT_EVIDENCE.value)
    codes = [f.get("code") if isinstance(f, dict) else getattr(f, "code", None) for f in comp_result.findings]
    assert "COMPETITOR_EVIDENCE_MOCK_ONLY" in codes


def test_client_cannot_set_is_demo_via_api(client: TestClient, db_session):
    """Client sending is_demo: true in request body has it stripped/ignored."""
    payload = {
        "name": "SAMPLE Shampoo",
        "description": "Organic shampoo",
        "category": "Personal Care",
        "is_demo": True,  # Attacking payload
        "assumptions": {
            "is_demo": True,
            "product": {"is_demo": True},
            "pricing": {"selling_price": "450.00"},
        },
    }
    resp = client.post("/api/v1/products", json=payload)
    assert resp.status_code == 201
    prod_data = resp.json()
    assert prod_data["status"] == "draft"  # Never "demo"

    # Verify assumptions stored in DB do not contain is_demo
    detail_resp = client.get(f"/api/v1/products/{prod_data['id']}")
    stored_assumptions = detail_resp.json()["assumptions"]
    assert "is_demo" not in stored_assumptions
    if "product" in stored_assumptions:
        assert "is_demo" not in stored_assumptions["product"]


def test_seeded_demo_products_produce_expected_verdicts(db_session):
    """The four seeded demo products (status='demo') produce their expected verdicts."""
    seed_database(allow_prod_like=True)

    expected_verdicts = {
        "SAMPLE TerraFlask Tumbler": "READY",
        "SAMPLE Heavy-Packaging Bottle": "READY_WITH_WARNINGS",
        "SAMPLE Underpriced Bottle": "NOT_READY",
        "SAMPLE Early-Stage Idea": "READY_WITH_WARNINGS",
    }

    products = db_session.query(Product).filter(Product.status == "demo").all()
    assert len(products) == 4

    for p in products:
        run = run_validation_use_case(db=db_session, product_id=p.id)
        assert run.verdict == expected_verdicts[p.name], f"{p.name} expected {expected_verdicts[p.name]} but got {run.verdict}"


# ==============================================================================
# FIX 3: HONEST LABELING OF INFLUENCER ESTIMATES
# ==============================================================================

def test_influencer_matching_analytics_includes_honest_disclosure():
    """calculate_match_analytics explicitly appends honest assumption statement to why_it_matches."""
    creator = {
        "id": uuid.uuid4(),
        "name": "Rohan Fitness",
        "handle": "@rohan.fitness",
        "platform": "instagram",
        "category": "Fitness & Active",
        "follower_count": 50000,
        "follower_tier": "micro",
        "engagement_rate": Decimal("5.0"),
        "avg_views": 25000,
        "avg_likes": 2000,
        "niche_tags": ["fitness", "hydration"],
        "estimated_cost_per_post": Decimal("15000.00"),
        "deliverables_summary": "1x Reel + 2x Stories",
    }
    product = {
        "product_name": "Pro Bottle",
        "category": "Fitness & Active",
        "selling_price": Decimal("1200.00"),
        "target_cac": Decimal("400.00"),
    }

    analytics = calculate_match_analytics(creator, product)
    disclosure_statement = "Figures are illustrative estimates based on assumed 5% click and 2% conversion rates"

    # Must appear in why_it_matches
    assert any(disclosure_statement in reason for reason in analytics["why_it_matches"])


def test_influencer_api_match_response_includes_honest_disclosure(client: TestClient, db_session):
    """The match response endpoint surfaces the disclosure in why_it_matches, notes, and disclaimer."""
    # Seed a creator
    inf = Influencer(
        id=uuid.uuid4(),
        name="Asha Yoga",
        handle=f"@asha.yoga_{uuid.uuid4().hex[:4]}",
        platform="instagram",
        category="Fitness & Wellness",
        follower_count=20000,
        follower_tier="micro",
        engagement_rate=4.2,
        avg_views=10000,
        avg_likes=800,
        niche_tags=["yoga", "wellness"],
        estimated_cost_per_post=Decimal("8000.00"),
        deliverables_summary="1x Reel",
        status="discovered",
        notes="High affinity for wellness",
    )
    db_session.add(inf)
    db_session.commit()

    payload = {
        "product_name": "Yoga Mat Plus",
        "category": "Fitness & Wellness",
        "description": "Eco friendly cork mat",
        "selling_price": 1999.00,
        "target_cac": 500.00,
        "marketing_budget": 20000.00,
    }

    res = client.post("/api/v1/influencers/match-custom", json=payload)
    assert res.status_code == 200
    data = res.json()

    disclosure = "illustrative estimates based on assumed 5% click and 2% conversion rates"
    assert disclosure in data["disclaimer"]
    first_match = data["matches"][0]
    assert any(disclosure in r for r in first_match["match_analytics"]["why_it_matches"])
    assert disclosure in first_match["influencer"]["notes"]


def test_limitations_doc_contains_influencer_disclosure():
    """docs/LIMITATIONS.md contains the exact disclosure statement."""
    with open("docs/LIMITATIONS.md", "r", encoding="utf-8") as f:
        content = f.read()

    statement = "illustrative estimates based on assumed 5% click and 2% conversion rates"
    assert statement in content
