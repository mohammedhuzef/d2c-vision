import uuid
from typing import Any, Dict, Optional
from sqlalchemy import CheckConstraint, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.base import TimestampedUUIDMixin, UUID_TYPE, JSONB_TYPE


class ProductVersion(Base, TimestampedUUIDMixin):
    __tablename__ = "product_versions"
    __table_args__ = (
        UniqueConstraint("product_id", "version_number", name="uq_product_version_number"),
        CheckConstraint("version_number >= 1", name="ck_product_versions_version_number_positive"),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    assumptions: Mapped[Dict[str, Any]] = mapped_column(JSONB_TYPE, nullable=False)
    change_summary: Mapped[Dict[str, Any]] = mapped_column(JSONB_TYPE, default=dict, nullable=False)
    created_by: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    product = relationship("Product", back_populates="versions")
    validation_runs = relationship("ValidationRun", back_populates="version", cascade="all, delete-orphan")
    validation_results = relationship("ValidationResult", back_populates="version", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="version", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="version", cascade="all, delete-orphan")


from sqlalchemy import event


@event.listens_for(ProductVersion, "before_update")
def _reject_product_version_update(mapper, connection, target):
    raise ValueError("product_versions rows are immutable and cannot be updated")


@event.listens_for(ProductVersion, "before_delete")
def _reject_product_version_delete(mapper, connection, target):
    raise ValueError("product_versions rows are immutable and cannot be deleted")

