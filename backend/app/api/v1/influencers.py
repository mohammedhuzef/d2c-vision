import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.models.influencer import Influencer
from backend.app.models.product import Product
from backend.app.models.version import ProductVersion
from backend.app.schemas.influencer import (
    CustomMatchRequest,
    InfluencerCreate,
    InfluencerListResponse,
    InfluencerMatchListResponse,
    InfluencerMatchResult,
    InfluencerResponse,
    InfluencerUpdate,
    PitchRequest,
    PitchResponse,
)
from backend.app.services.influencer_service import (
    calculate_match_analytics,
    generate_outreach_pitch,
    seed_influencers_if_empty,
)

router = APIRouter(prefix="/influencers", tags=["Influencers"])


@router.get("", response_model=InfluencerListResponse)
def list_influencers(
    category: Optional[str] = Query(None, description="Filter by category"),
    platform: Optional[str] = Query(None, description="Filter by platform (instagram, youtube, tiktok)"),
    follower_tier: Optional[str] = Query(None, description="Filter by tier (nano, micro, mid, macro)"),
    max_budget: Optional[float] = Query(None, description="Max cost per post"),
    search: Optional[str] = Query(None, description="Search query by name, handle, or bio"),
    db: Session = Depends(get_db),
):
    """List influencers with optional filters."""
    seed_influencers_if_empty(db)

    query = select(Influencer)

    if category and category != "all":
        query = query.where(Influencer.category.ilike(f"%{category}%"))
    if platform and platform != "all":
        query = query.where(Influencer.platform == platform.lower())
    if follower_tier and follower_tier != "all":
        query = query.where(Influencer.follower_tier == follower_tier.lower())
    if max_budget is not None and max_budget > 0:
        query = query.where(Influencer.estimated_cost_per_post <= max_budget)
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            or_(
                Influencer.name.ilike(search_filter),
                Influencer.handle.ilike(search_filter),
                Influencer.bio.ilike(search_filter),
                Influencer.category.ilike(search_filter),
            )
        )

    results = db.scalars(query.order_by(Influencer.follower_count.desc())).all()
    return InfluencerListResponse(items=results, total=len(results))


@router.get("/match/{product_id}", response_model=InfluencerMatchListResponse)
def match_influencers_for_product(
    product_id: uuid.UUID,
    platform: Optional[str] = Query(None, description="Filter by platform"),
    follower_tier: Optional[str] = Query(None, description="Filter by tier"),
    min_match_score: Optional[int] = Query(None, description="Minimum match score"),
    db: Session = Depends(get_db),
):
    """
    Match creators against an existing D2C product profile and unit economics.
    Calculates deterministic match scores, CAC feasibility, and expected RoAS.
    """
    seed_influencers_if_empty(db)

    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Fetch latest version assumptions for economics
    latest_version = db.scalar(
        select(ProductVersion)
        .where(ProductVersion.product_id == product_id)
        .order_by(ProductVersion.version_number.desc())
        .limit(1)
    )

    assumptions = latest_version.assumptions if latest_version else {}
    unit_econ = assumptions.get("unit_economics", {})
    marketing = assumptions.get("marketing", {})

    selling_price = float(unit_econ.get("selling_price", 1299.0))
    target_cac = float(marketing.get("target_cac", 400.0))
    monthly_budget = float(marketing.get("budget", 50000.0))

    # Query all active influencers
    query = select(Influencer)
    if platform and platform != "all":
        query = query.where(Influencer.platform == platform.lower())
    if follower_tier and follower_tier != "all":
        query = query.where(Influencer.follower_tier == follower_tier.lower())

    influencers = db.scalars(query).all()

    matches: List[InfluencerMatchResult] = []
    for inf in influencers:
        analytics = calculate_match_analytics(
            influencer=inf,
            product_name=product.name,
            category=product.category or "D2C Product",
            description=product.description,
            target_market=product.target_market,
            selling_price=selling_price,
            target_cac=target_cac,
            marketing_budget=monthly_budget,
        )

        if min_match_score and analytics.overall_match_score < min_match_score:
            continue

        matches.append(
            InfluencerMatchResult(
                influencer=InfluencerResponse.model_validate(inf),
                match_analytics=analytics,
            )
        )

    # Sort descending by overall match score
    matches.sort(key=lambda m: m.match_analytics.overall_match_score, reverse=True)

    return InfluencerMatchListResponse(
        product_id=str(product.id),
        product_name=product.name,
        product_category=product.category or "D2C Product",
        target_cac=target_cac,
        total_matched=len(matches),
        matches=matches,
    )


@router.post("/match-custom", response_model=InfluencerMatchListResponse)
def match_influencers_custom(
    payload: CustomMatchRequest,
    db: Session = Depends(get_db),
):
    """
    Match creators against custom on-the-fly product details.
    Allows founders to explore influencers for hypothetical products or ideas.
    """
    seed_influencers_if_empty(db)

    query = select(Influencer)
    if payload.platform_preference and payload.platform_preference != "all":
        query = query.where(Influencer.platform == payload.platform_preference.lower())
    if payload.follower_tier and payload.follower_tier != "all":
        query = query.where(Influencer.follower_tier == payload.follower_tier.lower())

    influencers = db.scalars(query).all()

    matches: List[InfluencerMatchResult] = []
    for inf in influencers:
        analytics = calculate_match_analytics(
            influencer=inf,
            product_name=payload.product_name,
            category=payload.category,
            description=payload.description,
            target_market=payload.target_market,
            selling_price=payload.selling_price,
            target_cac=payload.target_cac,
            marketing_budget=payload.marketing_budget,
        )

        matches.append(
            InfluencerMatchResult(
                influencer=InfluencerResponse.model_validate(inf),
                match_analytics=analytics,
            )
        )

    matches.sort(key=lambda m: m.match_analytics.overall_match_score, reverse=True)

    return InfluencerMatchListResponse(
        product_id=None,
        product_name=payload.product_name,
        product_category=payload.category,
        target_cac=payload.target_cac,
        total_matched=len(matches),
        matches=matches,
    )


@router.post("", response_model=InfluencerResponse, status_code=status.HTTP_201_CREATED)
def create_influencer(
    payload: InfluencerCreate,
    db: Session = Depends(get_db),
):
    """Add a new creator to the directory."""
    existing = db.scalar(
        select(Influencer).where(
            Influencer.platform == payload.platform.lower(),
            Influencer.handle.ilike(payload.handle.strip()),
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail="An influencer with this handle and platform already exists")

    influencer = Influencer(
        product_id=payload.product_id,
        name=payload.name.strip(),
        handle=payload.handle.strip(),
        avatar_url=payload.avatar_url,
        platform=payload.platform.lower(),
        category=payload.category.strip(),
        bio=payload.bio,
        location=payload.location or "Global",
        follower_count=payload.follower_count,
        follower_tier=payload.follower_tier.lower(),
        engagement_rate=payload.engagement_rate,
        avg_views=payload.avg_views,
        avg_likes=payload.avg_likes,
        niche_tags=payload.niche_tags,
        audience_demographics=payload.audience_demographics,
        estimated_cost_per_post=payload.estimated_cost_per_post,
        deliverables_summary=payload.deliverables_summary,
        sample_content_url=payload.sample_content_url,
        status=payload.status or "discovered",
        notes=payload.notes,
    )
    db.add(influencer)
    db.commit()
    db.refresh(influencer)
    return influencer


@router.patch("/{influencer_id}/status", response_model=InfluencerResponse)
def update_influencer_status(
    influencer_id: uuid.UUID,
    payload: InfluencerUpdate,
    db: Session = Depends(get_db),
):
    """Update creator outreach pipeline status and notes."""
    influencer = db.get(Influencer, influencer_id)
    if not influencer:
        raise HTTPException(status_code=404, detail="Influencer not found")

    if payload.status is not None:
        influencer.status = payload.status
    if payload.notes is not None:
        influencer.notes = payload.notes
    if payload.estimated_cost_per_post is not None:
        influencer.estimated_cost_per_post = payload.estimated_cost_per_post
    if payload.deliverables_summary is not None:
        influencer.deliverables_summary = payload.deliverables_summary

    db.commit()
    db.refresh(influencer)
    return influencer


@router.post("/{influencer_id}/pitch", response_model=PitchResponse)
def generate_pitch(
    influencer_id: uuid.UUID,
    payload: PitchRequest,
    db: Session = Depends(get_db),
):
    """
    Generate tailored DM & Email outreach pitch copy for a creator.
    """
    influencer = db.get(Influencer, influencer_id)
    if not influencer:
        raise HTTPException(status_code=404, detail="Influencer not found")

    if payload.product_id:
        product = db.get(Product, payload.product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        latest_version = db.scalar(
            select(ProductVersion)
            .where(ProductVersion.product_id == product.id)
            .order_by(ProductVersion.version_number.desc())
            .limit(1)
        )
        assumptions = latest_version.assumptions if latest_version else {}
        unit_econ = assumptions.get("unit_economics", {})

        return generate_outreach_pitch(
            influencer=influencer,
            product_name=product.name,
            category=product.category or "D2C Product",
            description=product.description,
            selling_price=float(unit_econ.get("selling_price", 1299.0)),
            target_market=product.target_market,
            tone=payload.outreach_tone or "enthusiastic_founder",
        )

    if payload.custom_product:
        cp = payload.custom_product
        return generate_outreach_pitch(
            influencer=influencer,
            product_name=cp.product_name,
            category=cp.category,
            description=cp.description,
            selling_price=cp.selling_price,
            target_market=cp.target_market,
            tone=payload.outreach_tone or "enthusiastic_founder",
        )

    # Fallback with default info
    return generate_outreach_pitch(
        influencer=influencer,
        product_name="Our Flagship D2C Product",
        category=influencer.category,
        description="Premium daily essentials built with ethical craftsmanship.",
        selling_price=1299.0,
        target_market=influencer.category,
        tone=payload.outreach_tone or "enthusiastic_founder",
    )
