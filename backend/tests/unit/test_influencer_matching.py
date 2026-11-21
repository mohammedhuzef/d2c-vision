"""Unit tests for pure deterministic influencer matching and pitch generator."""

from decimal import Decimal
from unittest.mock import patch
import uuid

import pytest

from backend.app.services.influencer_matching import (
    calculate_match_analytics,
    rank_and_filter_matches,
)
from backend.app.services.pitch_generator import (
    generate_fallback_pitch,
    generate_pitch,
)


@pytest.fixture
def sample_creator():
    return {
        "id": uuid.uuid4(),
        "name": "Priya Fitness",
        "handle": "@priya.fits",
        "platform": "instagram",
        "category": "Fitness & Active",
        "follower_count": 50000,
        "follower_tier": "micro",
        "engagement_rate": Decimal("5.2"),
        "avg_views": 25000,
        "avg_likes": 2000,
        "niche_tags": ["workout", "tumbler", "hydration", "activewear"],
        "estimated_cost_per_post": Decimal("15000.00"),
        "deliverables_summary": "1x Dedicated Reel + 2x Stories",
    }


@pytest.fixture
def sample_product_dict():
    return {
        "product_name": "ZenTumbler",
        "category": "Fitness & Active",
        "description": "Smart insulated bottle for athletes and gym goers",
        "target_market": "Active lifestyle enthusiasts and gym members",
        "selling_price": Decimal("1299.00"),
        "target_cac": Decimal("400.00"),
    }


def test_calculate_match_analytics_deterministic(sample_creator, sample_product_dict):
    """Analytics calculations are deterministic and adhere to expected formulas."""
    res = calculate_match_analytics(sample_creator, sample_product_dict)

    # Sub-scores must be in 0-100
    assert 0 <= res["overall_match_score"] <= 100
    assert 0 <= res["category_fit_score"] <= 100
    assert 0 <= res["audience_fit_score"] <= 100
    assert 0 <= res["economics_fit_score"] <= 100
    assert 0 <= res["engagement_fit_score"] <= 100

    # Engagement 5.2% should yield high engagement fit
    assert res["engagement_fit_score"] == 85

    # Category matches exactly + niche tags overlap ("tumbler")
    assert res["category_fit_score"] >= 85

    # Verification of projections
    assert res["predicted_reach"] == 25000
    assert res["predicted_clicks"] > 0
    assert res["predicted_orders"] > 0
    assert res["implied_cac"] > Decimal("0")
    assert res["estimated_revenue"] > Decimal("0")
    assert res["estimated_roas"] > Decimal("0")
    assert res["roi_verdict"] in ("EXCELLENT_CAC", "VIABLE", "HIGH_CAC_RISK")
    assert len(res["why_it_matches"]) >= 2
    assert res["suggested_deliverables"] == "1x Dedicated Reel + 2x Stories"


def test_rank_and_filter_matches(sample_creator, sample_product_dict):
    """Filters by platform, tier, budget, and sorts by match score."""
    low_fit_creator = {
        "id": uuid.uuid4(),
        "name": "Gourmet Chef",
        "handle": "@chef.cooking",
        "platform": "youtube",
        "category": "Cooking & Recipes",
        "follower_count": 80000,
        "follower_tier": "mid",
        "engagement_rate": Decimal("1.2"),
        "avg_views": 10000,
        "avg_likes": 300,
        "niche_tags": ["baking", "pastry"],
        "estimated_cost_per_post": Decimal("40000.00"),
        "deliverables_summary": "1x Dedicated Video",
    }

    candidates = [low_fit_creator, sample_creator]

    # Rank without filter
    ranked = rank_and_filter_matches(candidates, sample_product_dict)
    assert len(ranked) == 2
    assert ranked[0]["influencer"]["name"] == "Priya Fitness"
    assert ranked[0]["match_analytics"]["overall_match_score"] > ranked[1]["match_analytics"]["overall_match_score"]

    # Filter by platform
    insta_only = rank_and_filter_matches(candidates, sample_product_dict, platform="instagram")
    assert len(insta_only) == 1
    assert insta_only[0]["influencer"]["platform"] == "instagram"

    # Filter by max budget
    budget_filtered = rank_and_filter_matches(candidates, sample_product_dict, max_budget=Decimal("20000.00"))
    assert len(budget_filtered) == 1
    assert budget_filtered[0]["influencer"]["name"] == "Priya Fitness"


def test_pitch_generator_fallback(sample_creator, sample_product_dict):
    """Fallback generator creates complete template without LLM."""
    pitch = generate_fallback_pitch(sample_creator, sample_product_dict, outreach_tone="direct")
    assert pitch["influencer_name"] == "Priya Fitness"
    assert pitch["influencer_handle"] == "@priya.fits"
    assert "ZenTumbler" in pitch["dm_template"]
    assert "ZenTumbler" in pitch["email_template"]
    assert len(pitch["subject_lines"]) >= 3
    assert len(pitch["key_talking_points"]) >= 3
    assert "15000" in pitch["suggested_offer"] or "15,000" in pitch["suggested_offer"]


def test_pitch_generator_gemini_fallback_on_error(sample_creator, sample_product_dict):
    """When LLM call throws an exception, pitch generator gracefully falls back to deterministic template."""
    with patch("backend.app.core.config.settings.LLM_API_KEY", "dummy_key"):
        with patch("backend.app.services.llm_client.LLMClient.generate_json", side_effect=RuntimeError("API error")):
            pitch = generate_pitch(sample_creator, sample_product_dict)
            assert pitch["influencer_name"] == "Priya Fitness"
            assert "ZenTumbler" in pitch["dm_template"]
            assert len(pitch["subject_lines"]) >= 3
