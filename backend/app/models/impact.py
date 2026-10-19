import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.base import TimestampedUUIDMixin, UUID_TYPE, JSONB_TYPE, ARRAY_TEXT_TYPE


class ImpactEvent(Base, TimestampedUUIDMixin):
    __tablename__ = "impact_events"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_version: Mapped[int] = mapped_column(Integer, nullable=False)
    to_version: Mapped[int] = mapped_column(Integer, nullable=False)
    changed_fields: Mapped[List[str]] = mapped_column(ARRAY_TEXT_TYPE, default=list, nullable=False)
    affected_stages: Mapped[List[str]] = mapped_column(ARRAY_TEXT_TYPE, default=list, nullable=False)
    rerun_run_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID_TYPE,
        ForeignKey("validation_runs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    before: Mapped[Dict[str, Any]] = mapped_column(JSONB_TYPE, default=dict, nullable=False)
    after: Mapped[Dict[str, Any]] = mapped_column(JSONB_TYPE, default=dict, nullable=False)

    product = relationship("Product", back_populates="impact_events")
