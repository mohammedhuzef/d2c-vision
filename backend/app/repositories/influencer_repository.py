"""Repository for Influencer queries and mutations."""

from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import or_, select, func
from sqlalchemy.orm import Session

from backend.app.models.influencer import Influencer
from backend.app.schemas.influencer import InfluencerCreate, InfluencerUpdate


def list_influencers(
    db: Session,
    category: Optional[str] = None,
    platform: Optional[str] = None,
    follower_tier: Optional[str] = None,
    max_budget: Optional[Decimal] = None,
    search: Optional[str] = None,
) -> Tuple[List[Influencer], int]:
    """Lists influencers with optional filters."""
    query = select(Influencer)

    if category:
        query = query.filter(func.lower(Influencer.category) == category.lower().strip())

    if platform:
        query = query.filter(func.lower(Influencer.platform) == platform.lower().strip())

    if follower_tier:
        query = query.filter(func.lower(Influencer.follower_tier) == follower_tier.lower().strip())

    if max_budget is not None:
        query = query.filter(Influencer.estimated_cost_per_post <= max_budget)

    if search:
        search_pattern = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(Influencer.name).like(search_pattern),
                func.lower(Influencer.handle).like(search_pattern),
                func.lower(Influencer.bio).like(search_pattern),
            )
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = db.scalar(count_query) or 0

    # Order by name
    query = query.order_by(Influencer.name.asc())
    items = list(db.scalars(query).all())

    return items, total


def get_influencer_by_id(db: Session, influencer_id: UUID) -> Optional[Influencer]:
    """Retrieves single influencer by primary key."""
    return db.scalar(select(Influencer).filter(Influencer.id == influencer_id))


def create_influencer(db: Session, data: InfluencerCreate) -> Influencer:
    """Inserts a new creator profile."""
    # Ensure cost is stored as Decimal
    cost_val = data.estimated_cost_per_post
    if isinstance(cost_val, (int, float, str)):
        cost_dec = Decimal(str(cost_val))
    else:
        cost_dec = cost_val

    influencer = Influencer(
        name=data.name,
        handle=data.handle,
        avatar_url=data.avatar_url,
        platform=data.platform.lower(),
        category=data.category,
        bio=data.bio,
        location=data.location,
        follower_count=data.follower_count,
        follower_tier=data.follower_tier.lower(),
        engagement_rate=float(data.engagement_rate),
        avg_views=data.avg_views,
        avg_likes=data.avg_likes,
        niche_tags=data.niche_tags,
        audience_demographics=data.audience_demographics,
        estimated_cost_per_post=cost_dec,
        deliverables_summary=data.deliverables_summary,
        sample_content_url=data.sample_content_url,
        notes=data.notes,
        product_id=data.product_id,
        status="discovered",
    )
    db.add(influencer)
    db.commit()
    db.refresh(influencer)
    return influencer


def update_influencer_status(
    db: Session,
    influencer_id: UUID,
    update_data: InfluencerUpdate,
) -> Optional[Influencer]:
    """Updates influencer status, notes, budget, and deliverables."""
    influencer = get_influencer_by_id(db, influencer_id)
    if not influencer:
        return None

    if update_data.status is not None:
        influencer.status = update_data.status
    if update_data.notes is not None:
        influencer.notes = update_data.notes
    if update_data.deliverables_summary is not None:
        influencer.deliverables_summary = update_data.deliverables_summary
    if update_data.estimated_cost_per_post is not None:
        cost_val = update_data.estimated_cost_per_post
        influencer.estimated_cost_per_post = Decimal(str(cost_val))

    db.commit()
    db.refresh(influencer)
    return influencer


def get_all_influencers(db: Session) -> List[Influencer]:
    """Retrieves all influencers for candidate matching."""
    return list(db.scalars(select(Influencer).order_by(Influencer.name.asc())).all())
