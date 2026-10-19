import uuid
from datetime import datetime, timezone
from typing import Any, Dict
from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.base import TimestampedUUIDMixin, UUID_TYPE, JSONB_TYPE


class Report(Base, TimestampedUUIDMixin):
    __tablename__ = "reports"

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
    format: Mapped[str] = mapped_column(String(50), default="json_markdown", nullable=False)
    content: Mapped[Dict[str, Any]] = mapped_column(JSONB_TYPE, nullable=False)
    markdown: Mapped[str] = mapped_column(Text, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    product = relationship("Product", back_populates="reports")
    version = relationship("ProductVersion", back_populates="reports")
