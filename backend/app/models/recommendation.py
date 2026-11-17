import uuid
from typing import List
from sqlalchemy import CheckConstraint, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.base import TimestampedUUIDMixin, UUID_TYPE, ARRAY_UUID_TYPE


class Recommendation(Base, TimestampedUUIDMixin):
    __tablename__ = "recommendations"
    __table_args__ = (
        CheckConstraint("priority IN ('high', 'medium', 'low')", name="ck_recommendations_priority"),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version_id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE,
        ForeignKey("product_versions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    stage: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[str] = mapped_column(Text, nullable=False)  # high | medium | low
    title: Mapped[str] = mapped_column(Text, nullable=False)
    detail: Mapped[str] = mapped_column(Text, nullable=False)
    evidence_ids: Mapped[List[uuid.UUID]] = mapped_column(ARRAY_UUID_TYPE, default=list, nullable=False)

    product = relationship("Product", back_populates="recommendations")
    version = relationship("ProductVersion", back_populates="recommendations")

