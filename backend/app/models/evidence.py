import hashlib
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, Optional
from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.base import TimestampedUUIDMixin, UUID_TYPE, JSONB_TYPE


def compute_evidence_content_hash(source_url: Optional[str], excerpt: str) -> str:
    """Computes sha256(coalesce(source_url,'') || '|' || excerpt)."""
    source_part = source_url if source_url is not None else ""
    norm = f"{source_part}|{excerpt}"
    return hashlib.sha256(norm.encode("utf-8")).hexdigest()


class ResearchEvidence(Base, TimestampedUUIDMixin):
    __tablename__ = "research_evidence"
    __table_args__ = (
        UniqueConstraint("product_id", "content_hash", name="uq_research_evidence_product_content_hash"),
        CheckConstraint("confidence >= 0 AND confidence <= 1", name="ck_research_evidence_confidence"),
        CheckConstraint(
            "source_type IN ('website', 'review', 'pricing_page', 'social', 'manual', 'other')",
            name="ck_research_evidence_source_type",
        ),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    competitor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID_TYPE,
        ForeignKey("competitors.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    content_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False, default="website")
    source_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    excerpt: Mapped[str] = mapped_column(Text, nullable=False)
    retrieved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    confidence: Mapped[Optional[Decimal]] = mapped_column(Numeric(3, 2), nullable=True)
    data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB_TYPE, default=dict, nullable=True)

    product = relationship("Product", back_populates="evidence")
    competitor = relationship("Competitor", back_populates="evidence")
