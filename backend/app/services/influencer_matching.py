"""Deterministic influencer matching and analytics engine for LaunchTwin AI.

Pure Python implementation adhering strictly to FROZEN RULES:
- Zero external dependencies on database or network packages
- Zero decimal-to-float conversions in services
- Deterministic sub-scores: Category Fit, Audience Fit, Engagement Fit, Economics Fit
- Deterministic ROAS and conversion projections
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Optional

from backend.app.services.validation.rules_config import (
    INFLUENCER_WEIGHT_CATEGORY,
    INFLUENCER_WEIGHT_ECONOMICS,
    INFLUENCER_WEIGHT_ENGAGEMENT,
    INFLUENCER_WEIGHT_AUDIENCE,
    INFLUENCER_CTR_FACTOR,
    INFLUENCER_CONVERSION_RATE,
    INFLUENCER_VIABLE_CAC_MULTIPLIER,
    INFLUENCER_HIGH_CAC_MULTIPLIER,
    INFLUENCER_CATEGORY_FIT_EXACT,
    INFLUENCER_CATEGORY_FIT_PARTIAL,
    INFLUENCER_CATEGORY_FIT_OVERLAP,
    INFLUENCER_CATEGORY_FIT_DEFAULT,
    INFLUENCER_ENGAGEMENT_EXCELLENT,
    INFLUENCER_ENGAGEMENT_HIGH,
    INFLUENCER_ENGAGEMENT_MEDIUM,
    INFLUENCER_ENGAGEMENT_LOW,
    INFLUENCER_FIT_SCORE_MAX,
    INFLUENCER_FIT_SCORE_HIGH,
    INFLUENCER_FIT_SCORE_MEDIUM,
    INFLUENCER_FIT_SCORE_FAIR,
    INFLUENCER_FIT_SCORE_LOW,
    INFLUENCER_AUDIENCE_FIT_BASE,
    INFLUENCER_ECONOMICS_EXCELLENT,
    INFLUENCER_ECONOMICS_VIABLE,
    INFLUENCER_ECONOMICS_HIGH_RISK,
    INFLUENCER_ECONOMICS_POOR,
)

_ZERO = Decimal("0")
_HUNDRED = Decimal("100")
_CENT = Decimal("0.01")
_TAG_BONUS = 10
_MAX_TAG_BONUS = 20
_AUDIENCE_TAG_BONUS = 10
_AUDIENCE_MID_BONUS = 15
_AUDIENCE_NANO_BONUS = 10
_AUDIENCE_OTHER_BONUS = 5


def _to_decimal(val: Any, default: str = "0.00") -> Decimal:
    """Safely converts value to Decimal."""
    if val is None:
        return Decimal(default)
    if isinstance(val, Decimal):
        return val
    return Decimal(str(val).strip())


def calculate_match_analytics(
    influencer: Dict[str, Any],
    product: Dict[str, Any],
) -> Dict[str, Any]:
    """Calculates deterministic match scores, implied CAC, and ROAS predictions.

    Args:
        influencer: Dict containing influencer fields
        product: Dict containing product fields

    Returns:
        Dict conforming to MatchScoreBreakdown contract structure.
    """
    prod_name = str(product.get("product_name") or "").lower()
    prod_cat = str(product.get("category") or "").lower()
    prod_desc = str(product.get("description") or "").lower()
    prod_target = str(product.get("target_market") or "").lower()

    creator_cat = str(influencer.get("category") or "").lower()
    creator_tags = [str(t).lower() for t in influencer.get("niche_tags") or []]
    creator_tier = str(influencer.get("follower_tier") or "micro").lower()

    # 1. Category Fit Score
    category_fit = INFLUENCER_CATEGORY_FIT_DEFAULT
    if prod_cat and creator_cat:
        if prod_cat == creator_cat:
            category_fit = INFLUENCER_CATEGORY_FIT_EXACT
        elif prod_cat in creator_cat or creator_cat in prod_cat:
            category_fit = INFLUENCER_CATEGORY_FIT_PARTIAL
        else:
            cat_words = set(prod_cat.replace("&", " ").replace("/", " ").split())
            inf_words = set(creator_cat.replace("&", " ").replace("/", " ").split())
            if cat_words & inf_words:
                category_fit = INFLUENCER_CATEGORY_FIT_OVERLAP

    # Niche tags overlap bonus
    tag_matches = 0
    full_context = f"{prod_name} {prod_cat} {prod_desc} {prod_target}"
    for tag in creator_tags:
        if tag in full_context:
            tag_matches += 1

    category_fit += min(tag_matches * _TAG_BONUS, _MAX_TAG_BONUS)
    if category_fit > INFLUENCER_FIT_SCORE_MAX:
        category_fit = INFLUENCER_FIT_SCORE_MAX

    # 2. Engagement Fit Score
    eng_dec = _to_decimal(influencer.get("engagement_rate"), default="3.5")
    if eng_dec >= INFLUENCER_ENGAGEMENT_EXCELLENT:
        engagement_fit = INFLUENCER_FIT_SCORE_MAX
    elif eng_dec >= INFLUENCER_ENGAGEMENT_HIGH:
        engagement_fit = INFLUENCER_FIT_SCORE_HIGH
    elif eng_dec >= INFLUENCER_ENGAGEMENT_MEDIUM:
        engagement_fit = INFLUENCER_FIT_SCORE_MEDIUM
    elif eng_dec >= INFLUENCER_ENGAGEMENT_LOW:
        engagement_fit = INFLUENCER_FIT_SCORE_FAIR
    else:
        engagement_fit = INFLUENCER_FIT_SCORE_LOW

    # 3. Audience Fit Score
    audience_fit = INFLUENCER_AUDIENCE_FIT_BASE
    if prod_target:
        for tag in creator_tags:
            if tag in prod_target:
                audience_fit += _AUDIENCE_TAG_BONUS
                break
    if creator_tier in ("micro", "mid"):
        audience_fit += _AUDIENCE_MID_BONUS
    elif creator_tier == "nano":
        audience_fit += _AUDIENCE_NANO_BONUS
    else:
        audience_fit += _AUDIENCE_OTHER_BONUS

    if audience_fit > INFLUENCER_FIT_SCORE_MAX:
        audience_fit = INFLUENCER_FIT_SCORE_MAX

    # 4. Economics Fit Score & Performance Predictions
    cost_dec = _to_decimal(influencer.get("estimated_cost_per_post"), default="15000.00")
    selling_price_dec = _to_decimal(product.get("selling_price"), default="1000.00")
    target_cac_dec = _to_decimal(product.get("target_cac"), default="400.00")
    if target_cac_dec <= _ZERO:
        target_cac_dec = Decimal("400.00")

    views_raw = influencer.get("avg_views") or 15000
    predicted_reach = max(int(views_raw), 100)

    # Predicted engagements = Reach * (Engagement Rate / 100)
    engagements_dec = Decimal(predicted_reach) * (eng_dec / _HUNDRED)
    # Predicted clicks = Engagements * CTR factor
    predicted_clicks = max(int(engagements_dec * INFLUENCER_CTR_FACTOR), 1)
    # Predicted orders = Clicks * Conversion rate
    predicted_orders = max(int(Decimal(predicted_clicks) * INFLUENCER_CONVERSION_RATE), 1)

    # Implied CAC = Cost / Orders
    implied_cac = (cost_dec / Decimal(predicted_orders)).quantize(_CENT, rounding=ROUND_HALF_UP)
    cac_difference = (target_cac_dec - implied_cac).quantize(_CENT, rounding=ROUND_HALF_UP)

    # Estimated revenue and ROAS
    estimated_revenue = (Decimal(predicted_orders) * selling_price_dec).quantize(_CENT, rounding=ROUND_HALF_UP)
    if cost_dec > _ZERO:
        estimated_roas = (estimated_revenue / cost_dec).quantize(_CENT, rounding=ROUND_HALF_UP)
    else:
        estimated_roas = _ZERO

    # Economics fit and ROI verdict
    viable_cap = target_cac_dec * INFLUENCER_VIABLE_CAC_MULTIPLIER
    high_cap = target_cac_dec * INFLUENCER_HIGH_CAC_MULTIPLIER

    if implied_cac <= target_cac_dec:
        economics_fit = INFLUENCER_ECONOMICS_EXCELLENT
        roi_verdict = "EXCELLENT_CAC"
    elif implied_cac <= viable_cap:
        economics_fit = INFLUENCER_ECONOMICS_VIABLE
        roi_verdict = "VIABLE"
    elif implied_cac <= high_cap:
        economics_fit = INFLUENCER_ECONOMICS_HIGH_RISK
        roi_verdict = "HIGH_CAC_RISK"
    else:
        economics_fit = INFLUENCER_ECONOMICS_POOR
        roi_verdict = "HIGH_CAC_RISK"

    # Overall Match Score (weighted average)
    overall_raw = (
        Decimal(category_fit) * INFLUENCER_WEIGHT_CATEGORY
        + Decimal(economics_fit) * INFLUENCER_WEIGHT_ECONOMICS
        + Decimal(engagement_fit) * INFLUENCER_WEIGHT_ENGAGEMENT
        + Decimal(audience_fit) * INFLUENCER_WEIGHT_AUDIENCE
    )
    overall_match_score = int(overall_raw.quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    if overall_match_score > INFLUENCER_FIT_SCORE_MAX:
        overall_match_score = INFLUENCER_FIT_SCORE_MAX
    elif overall_match_score < 0:
        overall_match_score = 0

    # Why It Matches Bullet Points
    why_it_matches: List[str] = [
        f"Category alignment with {influencer.get('category')} audience ({category_fit}% fit)",
        f"Engagement rate of {eng_dec}% demonstrates active community intimacy",
    ]
    if roi_verdict == "EXCELLENT_CAC":
        why_it_matches.append(f"Implied CAC of ₹{implied_cac} beats target CAC of ₹{target_cac_dec}")
    elif roi_verdict == "VIABLE":
        why_it_matches.append(f"Implied CAC of ₹{implied_cac} within viable threshold of target ₹{target_cac_dec}")
    else:
        why_it_matches.append(f"Projected ROAS of {estimated_roas}x with ₹{estimated_revenue} estimated gross revenue")

    if tag_matches > 0:
        why_it_matches.append("Strong niche tag overlap across relevant creator topics")

    suggested_deliverables = str(
        influencer.get("deliverables_summary") or "1x Dedicated Reel + 2x Stories"
    )

    return {
        "overall_match_score": overall_match_score,
        "category_fit_score": category_fit,
        "audience_fit_score": audience_fit,
        "economics_fit_score": economics_fit,
        "engagement_fit_score": engagement_fit,
        "roi_verdict": roi_verdict,
        "implied_cac": implied_cac,
        "target_cac": target_cac_dec,
        "cac_difference": cac_difference,
        "predicted_reach": predicted_reach,
        "predicted_clicks": predicted_clicks,
        "predicted_orders": predicted_orders,
        "estimated_revenue": estimated_revenue,
        "estimated_roas": estimated_roas,
        "why_it_matches": why_it_matches,
        "suggested_deliverables": suggested_deliverables,
    }


def rank_and_filter_matches(
    influencers: List[Dict[str, Any]],
    product: Dict[str, Any],
    platform: Optional[str] = None,
    follower_tier: Optional[str] = None,
    min_match_score: Optional[int] = None,
    max_budget: Optional[Decimal] = None,
) -> List[Dict[str, Any]]:
    """Filters candidate influencers and ranks them strictly by overall_match_score descending."""
    results: List[Dict[str, Any]] = []

    for inf in influencers:
        if platform:
            if str(inf.get("platform", "")).lower() != platform.lower():
                continue

        if follower_tier:
            if str(inf.get("follower_tier", "")).lower() != follower_tier.lower():
                continue

        cost = _to_decimal(inf.get("estimated_cost_per_post"), default="0.00")
        if max_budget is not None and cost > max_budget:
            continue

        analytics = calculate_match_analytics(inf, product)

        if min_match_score is not None and analytics["overall_match_score"] < min_match_score:
            continue

        results.append({
            "influencer": inf,
            "match_analytics": analytics,
        })

    results.sort(
        key=lambda r: (
            r["match_analytics"]["overall_match_score"],
            r["match_analytics"]["economics_fit_score"],
            r["match_analytics"]["category_fit_score"],
        ),
        reverse=True,
    )

    return results
