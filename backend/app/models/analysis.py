import uuid
from decimal import Decimal
from typing import Any, List, Optional
from sqlalchemy import ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.base import TimestampedUUIDMixin, UUID_TYPE, JSONB_TYPE, ARRAY_UUID_TYPE


class CompetitorAnalysis(Base, TimestampedUUIDMixin):
    __tablename__ = "competitor_analyses"

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
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    strengths: Mapped[List[str]] = mapped_column(JSONB_TYPE, default=list, nullable=False)
    weaknesses: Mapped[List[str]] = mapped_column(JSONB_TYPE, default=list, nullable=False)
    price_observed: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    evidence_ids: Mapped[List[uuid.UUID]] = mapped_column(ARRAY_UUID_TYPE, default=list, nullable=False)
    produced_by: Mapped[str] = mapped_column(Text, default="mock", nullable=False)

    product = relationship("Product", back_populates="analyses")
    competitor = relationship("Competitor", back_populates="analyses")
