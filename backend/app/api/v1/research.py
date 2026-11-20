import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.repositories import research_repository
from backend.app.schemas.research import (
    ResearchIngestRequest,
    ResearchIngestResponse,
    ResearchRunListResponse,
    ResearchStartResponse,
    ResearchStatusResponse,
)

router = APIRouter(tags=["Research & Ingest"])


# Internal Research Ingest Endpoints (Dual aliases matching contract)
@router.post(
    "/internal/research-results",
    response_model=ResearchIngestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest research results directly (internal)",
)
def ingest_research_results(
    payload: ResearchIngestRequest,
    db: Session = Depends(get_db),
) -> ResearchIngestResponse:
    return research_repository.ingest_research_data(db, payload)


@router.post(
    "/internal/research/results",
    response_model=ResearchIngestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest research results alias (internal)",
)
def ingest_research_results_alias(
    payload: ResearchIngestRequest,
    db: Session = Depends(get_db),
) -> ResearchIngestResponse:
    return research_repository.ingest_research_data(db, payload)


# Product Research Endpoints
@router.post(
    "/products/{product_id}/research",
    response_model=ResearchStartResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Start an automated research run for a product",
)
def start_research(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> ResearchStartResponse:
    return research_repository.start_research_run(db, product_id, provider_name="mock")


@router.get(
    "/products/{product_id}/research",
    response_model=ResearchRunListResponse,
    status_code=status.HTTP_200_OK,
    summary="List research runs for a product",
)
def list_research_runs(
    product_id: uuid.UUID,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> ResearchRunListResponse:
    return research_repository.list_research_runs(db, product_id, limit=limit, offset=offset)


@router.get(
    "/products/{product_id}/research/{research_id}",
    response_model=ResearchStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get status and outcomes of a specific research run",
)
def get_research_status(
    product_id: uuid.UUID,
    research_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> ResearchStatusResponse:
    return research_repository.get_research_run(db, product_id, research_id)
