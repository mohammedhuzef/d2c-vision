import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.repositories import competitor_repository
from backend.app.schemas.competitor import (
    CompetitorCreate,
    CompetitorListResponse,
    CompetitorPriceSummary,
)
from backend.app.schemas.evidence import EvidenceListResponse

router = APIRouter(tags=["Competitors & Evidence"])


@router.post(
    "/products/{product_id}/competitors",
    response_model=CompetitorListResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add competitors for a product",
)
def add_competitors(
    product_id: uuid.UUID,
    payload: CompetitorCreate,
    db: Session = Depends(get_db),
) -> CompetitorListResponse:
    items = competitor_repository.create_competitors(db, product_id, payload.competitors)
    return CompetitorListResponse(items=items)


@router.get(
    "/products/{product_id}/competitors",
    response_model=CompetitorListResponse,
    status_code=status.HTTP_200_OK,
    summary="List competitors for a product",
)
def list_competitors(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> CompetitorListResponse:
    items = competitor_repository.list_competitors(db, product_id)
    return CompetitorListResponse(items=items)


@router.get(
    "/products/{product_id}/competitors/summary",
    response_model=CompetitorPriceSummary,
    status_code=status.HTTP_200_OK,
    summary="Get competitor price summary statistics",
)
def get_competitor_summary(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> CompetitorPriceSummary:
    return competitor_repository.get_competitor_price_summary(db, product_id)


@router.get(
    "/products/{product_id}/evidence",
    response_model=EvidenceListResponse,
    status_code=status.HTTP_200_OK,
    summary="List research evidence items for a product",
)
def list_evidence(
    product_id: uuid.UUID,
    competitor_id: Optional[uuid.UUID] = Query(None, description="Filter by competitor ID"),
    source_type: Optional[str] = Query(None, description="Filter by evidence source type"),
    limit: int = Query(20, ge=1, le=100, description="Items limit"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db),
) -> EvidenceListResponse:
    return competitor_repository.list_evidence(
        db=db,
        product_id=product_id,
        competitor_id=competitor_id,
        source_type=source_type,
        limit=limit,
        offset=offset,
    )
