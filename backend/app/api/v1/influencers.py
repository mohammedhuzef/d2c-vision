"""FastAPI endpoints for creator directory, matching, pitch generation, and status tracking."""

import logging
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.errors import AppError
from backend.app.models.influencer import Influencer
from backend.app.repositories import influencer_repository
from backend.app.repositories.product_repository import ProductRepository
from backend.app.schemas.influencer import (
    CustomMatchRequest,
    InfluencerCreate,
    InfluencerListResponse,
    InfluencerMatchListResponse,
    InfluencerMatchResult,
    InfluencerResponse,
    InfluencerUpdate,
    MatchScoreBreakdown,
    PitchRequest,
    PitchResponse,
)
from backend.app.services.influencer_matching import (
    calculate_match_analytics,
    rank_and_filter_matches,
)
from backend.app.services.pitch_generator import generate_pitch

logger = logging.getLogger("launchtwin.influencers_api")

router = APIRouter(prefix="/influencers", tags=["Influencers"])


def _inf_to_dict(inf: Influencer) -> Dict[str, Any]:
    return {
        "id": inf.id,
        "name": inf.name,
        "handle": inf.handle,
        "avatar_url": inf.avatar_url,
        "platform": inf.platform,
        "category": inf.category,
        "bio": inf.bio,
        "location": inf.location,
        "follower_count": inf.follower_count,
        "follower_tier": inf.follower_tier,
        "engagement_rate": Decimal(str(inf.engagement_rate)),
        "avg_views": inf.avg_views,
        "avg_likes": inf.avg_likes,
        "niche_tags": inf.niche_tags or [],
        "audience_demographics": inf.audience_demographics or {},
        "estimated_cost_per_post": inf.estimated_cost_per_post,
        "deliverables_summary": inf.deliverables_summary,
        "sample_content_url": inf.sample_content_url,
        "notes": inf.notes,
        "product_id": inf.product_id,
        "status": inf.status,
        "created_at": inf.created_at,
    }


def _inf_to_response(inf: Influencer) -> InfluencerResponse:
    cost_str = f"{inf.estimated_cost_per_post:.2f}" if inf.estimated_cost_per_post is not None else "15000.00"
    return InfluencerResponse(
        id=inf.id,
        name=inf.name,
        handle=inf.handle,
        avatar_url=inf.avatar_url,
        platform=inf.platform,
        category=inf.category,
        bio=inf.bio,
        location=inf.location,
        follower_count=inf.follower_count,
        follower_tier=inf.follower_tier,
        engagement_rate=float(inf.engagement_rate),
        avg_views=inf.avg_views,
        avg_likes=inf.avg_likes,
        niche_tags=inf.niche_tags or [],
        audience_demographics=inf.audience_demographics or {},
        estimated_cost_per_post=cost_str,
        deliverables_summary=inf.deliverables_summary,
        sample_content_url=inf.sample_content_url,
        notes=inf.notes,
        product_id=inf.product_id,
        status=inf.status,
        created_at=inf.created_at,
    )


@router.get("", response_model=InfluencerListResponse, summary="List Influencers")
def list_influencers(
    category: Optional[str] = Query(None, description="Filter by category"),
    platform: Optional[str] = Query(None, description="Filter by platform (instagram, youtube, tiktok)"),
    follower_tier: Optional[str] = Query(None, description="Filter by tier (nano, micro, mid, macro)"),
    max_budget: Optional[float] = Query(None, description="Max cost per post"),
    search: Optional[str] = Query(None, description="Search query by name, handle, or bio"),
    db: Session = Depends(get_db),
) -> InfluencerListResponse:
    """List influencers with optional filters."""
    budget_dec = Decimal(str(max_budget)) if max_budget is not None else None
    items, total = influencer_repository.list_influencers(
        db=db,
        category=category,
        platform=platform,
        follower_tier=follower_tier,
        max_budget=budget_dec,
        search=search,
    )
    return InfluencerListResponse(
        items=[_inf_to_response(inf) for inf in items],
        total=total,
    )


@router.post(
    "",
    response_model=InfluencerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Influencer",
)
def create_influencer(
    payload: InfluencerCreate,
    db: Session = Depends(get_db),
) -> InfluencerResponse:
    """Add a new creator to the directory."""
    influencer = influencer_repository.create_influencer(db, payload)
    return _inf_to_response(influencer)


@router.post(
    "/match-custom",
    response_model=InfluencerMatchListResponse,
    summary="Match Influencers Custom",
)
def match_influencers_custom(
    payload: CustomMatchRequest,
    db: Session = Depends(get_db),
) -> InfluencerMatchListResponse:
    """Match creators against custom on-the-fly product details."""
    candidates = influencer_repository.get_all_influencers(db)
    cand_dicts = [_inf_to_dict(c) for c in candidates]

    product_dict = {
        "product_name": payload.product_name,
        "category": payload.category,
        "description": payload.description,
        "target_market": payload.target_market,
        "selling_price": payload.selling_price,
        "target_cac": payload.target_cac,
    }

    max_budget = Decimal(str(payload.marketing_budget)) if payload.marketing_budget is not None else None
    ranked = rank_and_filter_matches(
        influencers=cand_dicts,
        product=product_dict,
        platform=payload.platform_preference,
        follower_tier=payload.follower_tier,
        max_budget=max_budget,
    )

    id_to_model = {c.id: c for c in candidates}
    match_results: List[InfluencerMatchResult] = []
    for r in ranked:
        inf_model = id_to_model[r["influencer"]["id"]]
        analytics = r["match_analytics"]
        match_results.append(
            InfluencerMatchResult(
                influencer=_inf_to_response(inf_model),
                match_analytics=MatchScoreBreakdown(
                    overall_match_score=analytics["overall_match_score"],
                    category_fit_score=analytics["category_fit_score"],
                    audience_fit_score=analytics["audience_fit_score"],
                    economics_fit_score=analytics["economics_fit_score"],
                    engagement_fit_score=analytics["engagement_fit_score"],
                    roi_verdict=analytics["roi_verdict"],
                    implied_cac=float(analytics["implied_cac"]),
                    target_cac=float(analytics["target_cac"]),
                    cac_difference=float(analytics["cac_difference"]),
                    predicted_reach=analytics["predicted_reach"],
                    predicted_clicks=analytics["predicted_clicks"],
                    predicted_orders=analytics["predicted_orders"],
                    estimated_revenue=float(analytics["estimated_revenue"]),
                    estimated_roas=float(analytics["estimated_roas"]),
                    why_it_matches=analytics["why_it_matches"],
                    suggested_deliverables=analytics["suggested_deliverables"],
                ),
            )
        )

    return InfluencerMatchListResponse(
        product_id=None,
        product_name=payload.product_name,
        product_category=payload.category,
        target_cac=payload.target_cac,
        total_matched=len(match_results),
        matches=match_results,
    )


@router.get(
    "/match/{product_id}",
    response_model=InfluencerMatchListResponse,
    summary="Match Influencers For Product",
)
def match_influencers_for_product(
    product_id: UUID,
    platform: Optional[str] = Query(None, description="Filter by platform"),
    follower_tier: Optional[str] = Query(None, description="Filter by tier"),
    min_match_score: Optional[int] = Query(None, description="Minimum match score"),
    db: Session = Depends(get_db),
) -> InfluencerMatchListResponse:
    """Match creators for a specific saved product."""
    product = ProductRepository.get_product(db, product_id)
    if not product:
        raise AppError(
            code="NOT_FOUND",
            message=f"Product '{product_id}' not found",
            status_code=404,
        )

    latest_version = ProductRepository.get_latest_version(db, product.id)
    assumptions = latest_version.assumptions if latest_version else {}
    pricing = assumptions.get("pricing", {})
    marketing = assumptions.get("marketing", {})
    customer = assumptions.get("customer", {})

    selling_price = pricing.get("selling_price", 1000.0)
    target_cac = marketing.get("expected_cac", 400.0)

    product_dict = {
        "product_name": product.name,
        "category": product.category,
        "description": product.description,
        "target_market": customer.get("target_customer") or product.target_market,
        "selling_price": selling_price,
        "target_cac": target_cac,
    }

    candidates = influencer_repository.get_all_influencers(db)
    cand_dicts = [_inf_to_dict(c) for c in candidates]

    ranked = rank_and_filter_matches(
        influencers=cand_dicts,
        product=product_dict,
        platform=platform,
        follower_tier=follower_tier,
        min_match_score=min_match_score,
    )

    id_to_model = {c.id: c for c in candidates}
    match_results: List[InfluencerMatchResult] = []
    for r in ranked:
        inf_model = id_to_model[r["influencer"]["id"]]
        analytics = r["match_analytics"]
        match_results.append(
            InfluencerMatchResult(
                influencer=_inf_to_response(inf_model),
                match_analytics=MatchScoreBreakdown(
                    overall_match_score=analytics["overall_match_score"],
                    category_fit_score=analytics["category_fit_score"],
                    audience_fit_score=analytics["audience_fit_score"],
                    economics_fit_score=analytics["economics_fit_score"],
                    engagement_fit_score=analytics["engagement_fit_score"],
                    roi_verdict=analytics["roi_verdict"],
                    implied_cac=float(analytics["implied_cac"]),
                    target_cac=float(analytics["target_cac"]),
                    cac_difference=float(analytics["cac_difference"]),
                    predicted_reach=analytics["predicted_reach"],
                    predicted_clicks=analytics["predicted_clicks"],
                    predicted_orders=analytics["predicted_orders"],
                    estimated_revenue=float(analytics["estimated_revenue"]),
                    estimated_roas=float(analytics["estimated_roas"]),
                    why_it_matches=analytics["why_it_matches"],
                    suggested_deliverables=analytics["suggested_deliverables"],
                ),
            )
        )

    return InfluencerMatchListResponse(
        product_id=str(product.id),
        product_name=product.name,
        product_category=product.category,
        target_cac=float(target_cac),
        total_matched=len(match_results),
        matches=match_results,
    )


@router.post(
    "/{influencer_id}/pitch",
    response_model=PitchResponse,
    summary="Generate Pitch",
)
def generate_influencer_pitch(
    influencer_id: UUID,
    payload: PitchRequest,
    db: Session = Depends(get_db),
) -> PitchResponse:
    """Generate tailored DM & Email outreach pitch copy for a creator."""
    influencer = influencer_repository.get_influencer_by_id(db, influencer_id)
    if not influencer:
        raise AppError(
            code="NOT_FOUND",
            message=f"Influencer '{influencer_id}' not found",
            status_code=404,
        )

    # Resolve product details
    product_dict: Dict[str, Any] = {}
    if payload.custom_product:
        product_dict = {
            "product_name": payload.custom_product.product_name,
            "category": payload.custom_product.category,
            "description": payload.custom_product.description,
            "target_market": payload.custom_product.target_market,
            "selling_price": payload.custom_product.selling_price,
            "target_cac": payload.custom_product.target_cac,
        }
    elif payload.product_id:
        prod = ProductRepository.get_product(db, payload.product_id)
        if not prod:
            raise AppError(
                code="NOT_FOUND",
                message=f"Product '{payload.product_id}' not found",
                status_code=404,
            )
        latest_version = ProductRepository.get_latest_version(db, prod.id)
        assumptions = latest_version.assumptions if latest_version else {}
        pricing = assumptions.get("pricing", {})
        marketing = assumptions.get("marketing", {})
        customer = assumptions.get("customer", {})
        product_dict = {
            "product_name": prod.name,
            "category": prod.category,
            "description": prod.description,
            "target_market": customer.get("target_customer") or prod.target_market,
            "selling_price": pricing.get("selling_price", 1000.0),
            "target_cac": marketing.get("expected_cac", 400.0),
        }
    else:
        product_dict = {
            "product_name": "ZenTumbler",
            "category": influencer.category,
            "description": "Premium smart double-wall vacuum tumbler",
            "target_market": "High-income commuters",
            "selling_price": 500.00,
            "target_cac": 120.00,
        }

    inf_dict = _inf_to_dict(influencer)
    pitch_res = generate_pitch(inf_dict, product_dict, payload.outreach_tone)

    return PitchResponse(
        influencer_id=influencer.id,
        influencer_name=influencer.name,
        influencer_handle=influencer.handle,
        dm_template=pitch_res["dm_template"],
        email_template=pitch_res["email_template"],
        suggested_offer=pitch_res["suggested_offer"],
        key_talking_points=pitch_res["key_talking_points"],
        subject_lines=pitch_res["subject_lines"],
    )


@router.patch(
    "/{influencer_id}/status",
    response_model=InfluencerResponse,
    summary="Update Influencer Status",
)
def update_influencer_status(
    influencer_id: UUID,
    payload: InfluencerUpdate,
    db: Session = Depends(get_db),
) -> InfluencerResponse:
    """Update creator outreach pipeline status and notes."""
    influencer = influencer_repository.update_influencer_status(db, influencer_id, payload)
    if not influencer:
        raise AppError(
            code="NOT_FOUND",
            message=f"Influencer '{influencer_id}' not found",
            status_code=404,
        )
    return _inf_to_response(influencer)
