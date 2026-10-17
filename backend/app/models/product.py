from typing import List, Optional
from sqlalchemy import String, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.core.database import Base
from backend.app.models.base import TimestampedUUIDMixin


class Product(Base, TimestampedUUIDMixin):
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    target_market: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    current_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False)

    versions = relationship("ProductVersion", back_populates="product", cascade="all, delete-orphan", order_by="desc(ProductVersion.version_number)")
    competitors = relationship("Competitor", back_populates="product", cascade="all, delete-orphan")
    evidence = relationship("ResearchEvidence", back_populates="product", cascade="all, delete-orphan")
    analyses = relationship("CompetitorAnalysis", back_populates="product", cascade="all, delete-orphan")
    validation_runs = relationship("ValidationRun", back_populates="product", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="product", cascade="all, delete-orphan")
    impact_events = relationship("ImpactEvent", back_populates="product", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="product", cascade="all, delete-orphan")
    research_runs = relationship("ResearchRun", back_populates="product", cascade="all, delete-orphan")
