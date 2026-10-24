import uuid
from typing import Any, Dict, List, Optional
from decimal import Decimal
from sqlalchemy import (
    ForeignKey,
    Index,
    String,
    Text,
    Integer,
    Float,
    Numeric,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.base import TimestampedUUIDMixin, UUID_TYPE, JSONB_TYPE, ARRAY_TEXT_TYPE


class Influencer(Base, TimestampedUUIDMixin):
    __tablename__ = "influencers"
    __table_args__ = (
        Index("uq_influencer_platform_handle", "platform", text("lower(handle)"), unique=True),
        Index("ix_influencer_category", "category"),
        Index("ix_influencer_tier", "follower_tier"),
    )

    product_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID_TYPE,
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    handle: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    platform: Mapped[str] = mapped_column(String(50), default="instagram", nullable=False)  # instagram, youtube, tiktok
    category: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. Drinkware & Lifestyle, Fitness, Tech
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), default="Global", nullable=True)

    follower_count: Mapped[int] = mapped_column(Integer, nullable=False, default=10000)
    follower_tier: Mapped[str] = mapped_column(String(50), default="micro", nullable=False)  # nano, micro, mid, macro
    engagement_rate: Mapped[float] = mapped_column(Float, default=3.5, nullable=False)  # percentage e.g. 4.2
    avg_views: Mapped[int] = mapped_column(Integer, default=15000, nullable=False)
    avg_likes: Mapped[int] = mapped_column(Integer, default=1200, nullable=False)

    niche_tags: Mapped[List[str]] = mapped_column(ARRAY_TEXT_TYPE, default=list, nullable=False)
    audience_demographics: Mapped[Dict[str, Any]] = mapped_column(JSONB_TYPE, default=dict, nullable=False)

    estimated_cost_per_post: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("15000.00"), nullable=False)
    deliverables_summary: Mapped[str] = mapped_column(String(255), default="1x Dedicated Reel + 2x Stories", nullable=False)
    sample_content_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(String(50), default="discovered", nullable=False)  # discovered, shortlisted, contacted, negotiating, signed, declined
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    product = relationship("Product", back_populates="influencers")
