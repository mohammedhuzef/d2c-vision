import uuid
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.repositories import report_repository
from backend.app.schemas.report import ReportListResponse, ReportResponse

router = APIRouter(tags=["Launch Reports"])


@router.post(
    "/products/{product_id}/reports",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a launch report for a product",
)
def create_launch_report(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> ReportResponse:
    return report_repository.create_report(db, product_id)


@router.get(
    "/products/{product_id}/reports",
    response_model=ReportListResponse,
    status_code=status.HTTP_200_OK,
    summary="List launch reports for a product",
)
def list_launch_reports(
    product_id: uuid.UUID,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> ReportListResponse:
    return report_repository.list_reports(db, product_id, limit=limit, offset=offset)


@router.get(
    "/products/{product_id}/reports/latest",
    response_model=ReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Get latest launch report for a product",
)
def get_latest_launch_report(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> ReportResponse:
    return report_repository.get_latest_report(db, product_id)


@router.get(
    "/products/{product_id}/reports/{report_id}",
    response_model=ReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Get specific launch report by ID",
)
def get_launch_report(
    product_id: uuid.UUID,
    report_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> ReportResponse:
    return report_repository.get_report(db, product_id, report_id)
