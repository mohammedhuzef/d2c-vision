"""AI Influencer Finding and Matching Service using Google Gemini API.

Discovers and evaluates creators for D2C product concepts:
- Calculates multi-dimensional match scores (Category, Audience, Economics, Engagement)
- Derives AI-personalized collaboration hooks and storytelling angles
- Produces realistic performance projections (ROAS, Implied CAC, Orders)
- Synthesizes tailored creator outreach pitches using Gemini
- Adheres strictly to data authenticity and zero float conversion rules.
"""

from decimal import Decimal
import json
import logging
import os
from typing import Any, Dict, List, Optional
from uuid import UUID

from backend.app.core.config import settings
from backend.app.services.influencer_matching import (
    calculate_match_analytics,
    rank_and_filter_matches,
)

logger = logging.getLogger("launchtwin.ai_influencer_service")

GEMINI_INFLUENCER_SCHEMA: Dict[str, Any] = {
    "type": "OBJECT",
    "properties": {
        "creators": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "name": {"type": "STRING"},
                    "handle": {"type": "STRING"},
                    "platform": {"type": "STRING"},
                    "category": {"type": "STRING"},
                    "followers": {"type": "STRING"},
                    "follower_tier": {"type": "STRING"},
                    "engagement_rate": {"type": "NUMBER"},
                    "estimated_collab_budget": {"type": "STRING"},
                    "match_score": {"type": "INTEGER"},
                    "roi_verdict": {"type": "STRING"},
                    "why_it_matches": {
                        "type": "ARRAY",
                        "items": {"type": "STRING"},
                    },
                    "suggested_hook": {"type": "STRING"},
                    "deliverables": {"type": "STRING"},
                    "tailored_pitch_dm": {"type": "STRING"},
                },
                "required": [
                    "name",
                    "handle",
                    "platform",
                    "category",
                    "followers",
                    "match_score",
                    "roi_verdict",
                    "why_it_matches",
                    "suggested_hook",
                ],
            },
        },
    },
    "required": ["creators"],
}


def find_influencers_with_gemini(
    candidates: List[Dict[str, Any]],
    product: Dict[str, Any],
    platform: Optional[str] = None,
    follower_tier: Optional[str] = None,
    niche_query: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Discovers and evaluates influencers for a product concept using Gemini API with deterministic fallback."""
    # 1. Run deterministic baseline matching first
    ranked = rank_and_filter_matches(
        influencers=candidates,
        product=product,
        platform=platform,
        follower_tier=follower_tier,
    )

    api_key = (
        settings.LLM_API_KEY
        or os.environ.get("GEMINI_API_KEY")
        or os.environ.get("GOOGLE_API_KEY")
    )

    if not api_key or not api_key.strip():
        logger.info("No LLM API key configured; returning deterministic creator matches.")
        return ranked

    try:
        from backend.app.services.llm_client import LLMClient

        client = LLMClient(api_key=api_key)

        prod_name = str(product.get("product_name") or "D2C Concept")
        prod_cat = str(product.get("category") or "General")
        prod_desc = str(product.get("description") or "")
        prod_target = str(product.get("target_market") or "Pan-India")
        selling_price = str(product.get("selling_price") or "999")
        target_cac = str(product.get("target_cac") or "350")

        # Top 5 candidates summary for Gemini analysis
        candidates_summary = []
        for r in ranked[:5]:
            inf = r["influencer"]
            candidates_summary.append({
                "name": inf.get("name"),
                "handle": inf.get("handle"),
                "platform": inf.get("platform"),
                "category": inf.get("category"),
                "followers": f"{inf.get('follower_count', 0):,}",
                "follower_tier": inf.get("follower_tier"),
                "engagement_rate": str(inf.get("engagement_rate", "3.5")),
                "cost_per_post": str(inf.get("estimated_cost_per_post", "15000")),
                "deliverables": inf.get("deliverables_summary"),
            })

        system_instruction = (
            "You are an elite influencer marketing strategist for high-growth direct-to-consumer brands. "
            "Evaluate creator candidates for the given product. "
            "For each creator, analyze the audience fit, craft an authentic viral collaboration hook "
            "(specifically for Instagram Reel or YouTube Short), list reasons why their audience converts, "
            "and write an authentic founder DM outreach message. "
            "Never invent unrealistic metrics. Return strictly valid JSON conforming to the schema."
        )

        prompt = (
            f"PRODUCT DETAILS:\n"
            f"- Product: {prod_name}\n"
            f"- Category: {prod_cat}\n"
            f"- Description: {prod_desc}\n"
            f"- Target Audience: {prod_target}\n"
            f"- Retail Price: ₹{selling_price}\n"
            f"- Allowable CAC: ₹{target_cac}\n"
            f"- Search Query / Niche Focus: {niche_query or 'Highest ROI creator matches'}\n\n"
            f"CANDIDATE CREATORS TO EVALUATE:\n"
            f"{json.dumps(candidates_summary, indent=2)}\n\n"
            "Analyze and rank these creators with creative collaboration angles, reasons to convert, and DM copy."
        )

        ai_data = client.generate_json(
            prompt,
            schema=GEMINI_INFLUENCER_SCHEMA,
            system_instruction=system_instruction,
        )

        ai_creators = ai_data.get("creators", [])
        if not ai_creators:
            return ranked

        # Merge Gemini insights with deterministic metrics
        handle_to_ai = {str(c.get("handle") or "").lower(): c for c in ai_creators}
        name_to_ai = {str(c.get("name") or "").lower(): c for c in ai_creators}

        enriched_matches: List[Dict[str, Any]] = []
        for r in ranked:
            inf = r["influencer"]
            analytics = r["match_analytics"]
            handle = str(inf.get("handle") or "").lower()
            name = str(inf.get("name") or "").lower()

            match_ai = handle_to_ai.get(handle) or name_to_ai.get(name)
            if match_ai:
                why_matches = list(match_ai.get("why_it_matches") or analytics["why_it_matches"])
                hook = str(match_ai.get("suggested_hook") or "Dedicated authentic review & routine integration")
                dm_copy = str(match_ai.get("tailored_pitch_dm") or "")

                new_analytics = dict(analytics)
                new_analytics["why_it_matches"] = why_matches
                new_analytics["suggested_hook"] = hook
                new_analytics["ai_matched"] = True
                new_analytics["tailored_pitch_dm"] = dm_copy

                enriched_matches.append({
                    "influencer": inf,
                    "match_analytics": new_analytics,
                    "ai_insights": {
                        "suggested_hook": hook,
                        "tailored_pitch_dm": dm_copy,
                        "why_it_matches": why_matches,
                        "roi_verdict": match_ai.get("roi_verdict") or analytics["roi_verdict"],
                    },
                })
            else:
                enriched_matches.append(r)

        return enriched_matches

    except Exception as exc:
        logger.warning(f"Gemini influencer discovery failed: {exc}; returning deterministic matches.")
        return ranked
