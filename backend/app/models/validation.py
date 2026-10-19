import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional
from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.base import TimestampedUUIDMixin, UUID_TYPE, JSONB_TYPE, ARRAY_TEXT_TYPE


class ValidationRun(Base, TimestampedUUIDMixin):
    __tablename__ = "validation_runs"

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
    trigger: Mapped[str] = mapped_column(Text, default="initial", nullable=False)
    triggered_by: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(Text, default="COMPLETED", nullable=False)
    stages_run: Mapped[List[str]] = mapped_column(ARRAY_TEXT_TYPE, default=list, nullable=False)
    readiness_score: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    readiness: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB_TYPE, nullable=True)
    recommendations: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSONB_TYPE, nullable=True)
    verdict: Mapped[str] = mapped_column(Text, default="INSUFFICIENT_EVIDENCE", nullable=False)
    input_fingerprint: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    product = relationship("Product", back_populates="validation_runs")
    version = relationship("ProductVersion", back_populates="validation_runs")
    results = relationship("ValidationResult", back_populates="run", cascade="all, delete-orphan")

    @property
    def project_id(self) -> uuid.UUID:
        return self.product_id

    @project_id.setter
    def project_id(self, val: uuid.UUID) -> None:
        self.product_id = val


class ValidationResult(Base, TimestampedUUIDMixin):
    __tablename__ = "validation_results"

    run_id: Mapped[uuid.UUID] = mapped_column(
        UUID_TYPE,
        ForeignKey("validation_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
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
    status: Mapped[str] = mapped_column(Text, nullable=False)
    score: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    metrics: Mapped[Dict[str, Any]] = mapped_column(JSONB_TYPE, default=dict, nullable=False)
    findings: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB_TYPE, default=list, nullable=False)
    inputs_used: Mapped[List[str]] = mapped_column(JSONB_TYPE, default=list, nullable=False)
    upstream: Mapped[List[str]] = mapped_column(JSONB_TYPE, default=list, nullable=False)
    carried_forward_from: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID_TYPE,
        ForeignKey("validation_results.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    run = relationship("ValidationRun", back_populates="results")
    product = relationship("Product")
    version = relationship("ProductVersion", back_populates="validation_results")

    @property
    def project_id(self) -> uuid.UUID:
        return self.product_id

    @project_id.setter
    def project_id(self, val: uuid.UUID) -> None:
        self.product_id = val
