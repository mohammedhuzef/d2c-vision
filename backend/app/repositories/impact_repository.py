"""Repository for ImpactEvent database operations."""

from typing import List, Tuple
import uuid

from sqlalchemy.orm import Session

from backend.app.models.impact import ImpactEvent


class ImpactRepository:
    @staticmethod
    def list_impact_events(
        db: Session,
        product_id: uuid.UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[List[ImpactEvent], int]:
        """Lists impact events for a product with pagination, ordered by to_version descending."""
        effective_limit = min(max(1, limit), 100)
        query = (
            db.query(ImpactEvent)
            .filter(ImpactEvent.product_id == product_id)
            .order_by(ImpactEvent.to_version.desc(), ImpactEvent.created_at.desc())
        )
        total = query.count()
        items = query.offset(offset).limit(effective_limit).all()
        return items, total

