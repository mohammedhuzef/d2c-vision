import uuid
from typing import Optional
from sqlalchemy import ForeignKey, Index, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.base import TimestampedUUIDMixin, UUID_TYPE


class Competitor(Base, TimestampedUUIDMixin):
    __tablename__ = "competitors"
    __table_args__ = (
        Index("uq_competitor_product_lower_name", "product_id", text("lower(name)"), unique=True),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    website_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    product_name: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    product = relationship("Product", back_populates="competitors")
    evidence = relationship("ResearchEvidence", back_populates="competitor", cascade="all, delete-orphan")
    analyses = relationship("CompetitorAnalysis", back_populates="competitor", cascade="all, delete-orphan")
