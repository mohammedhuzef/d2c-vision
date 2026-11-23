"""Project database model for storing validated D2C product concepts."""

from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base
from backend.app.models.base import JSONB_TYPE


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    target_market: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    selling_price: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    mfg_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    moq: Mapped[int] = mapped_column(Integer, nullable=False, default=500)
    marketing_budget: Mapped[float] = mapped_column(Float, nullable=False, default=50000.0)
    margin: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ingredients: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    target_audience: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        default="/images/cat-beverages.jpg",
    )
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="In Progress",
        index=True,
    )
    viability_score: Mapped[int] = mapped_column(Integer, nullable=False, default=50)
    viability_grade: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    report: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB_TYPE, nullable=True)
    user_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="default_user",
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
