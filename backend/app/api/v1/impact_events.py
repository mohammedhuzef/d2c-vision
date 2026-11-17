"""Impact events endpoints implementing /api/v1/products/{product_id}/impact-events."""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.errors import NotFoundError
from backend.app.repositories.impact_repository import ImpactRepository
from backend.app.repositories.product_repository import ProductRepository
from backend.app.schemas.impact import ImpactEventListResponse, ImpactEventResponse

router = APIRouter(tags=["Impact Events"])


@router.get(
    "/products/{product_id}/impact-events",
    response_model=ImpactEventListResponse,
    summary="List impact events for a product with pagination",
)
def list_impact_events(
    product_id: uuid.UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    product = ProductRepository.get_product(db=db, product_id=product_id)
    if not product:
        raise NotFoundError(f"Product {product_id} not found")

    items, total = ImpactRepository.list_impact_events(
        db=db,
        product_id=product_id,
        limit=limit,
        offset=offset,
    )

    responses = [
        ImpactEventResponse(
            id=str(ev.id),
            product_id=str(ev.product_id),
            from_version=ev.from_version,
            to_version=ev.to_version,
            changed_fields=ev.changed_fields,
            affected_stages=ev.affected_stages,
            before=ev.before,
            after=ev.after,
            rerun_run_id=str(ev.rerun_run_id) if ev.rerun_run_id else None,
            created_at=ev.created_at.isoformat() if ev.created_at else "",
        )
        for ev in items
    ]

    return ImpactEventListResponse(
        items=responses,
        total=total,
        limit=limit,
        offset=offset,
    )

