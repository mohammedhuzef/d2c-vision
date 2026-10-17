from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.errors import NotFoundError
from backend.app.models.product import Product
from backend.app.models.report import Report
from backend.app.schemas.report import ReportResponse, ReportListResponse
from backend.app.services.reports import generate_launch_report

router = APIRouter(prefix="/products/{product_id}/reports", tags=["Reports"])


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def generate_report(
    product_id: UUID,
    db: Session = Depends(get_db),
):
    """Generate structured launch readiness report (JSON + Markdown) for the latest validated version."""
    report = generate_launch_report(product_id, db)
    return ReportResponse(
        id=report.id,
        product_id=report.product_id,
        version_id=report.version_id,
        format=report.format,
        content=report.content,
        markdown=report.markdown,
        generated_at=report.generated_at,
    )


@router.get("", response_model=ReportListResponse)
def list_reports(
    product_id: UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """List reports for a product, newest first."""
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")

    total = db.scalar(
        select(func.count(Report.id)).where(Report.product_id == product_id)
    ) or 0
    items = list(
        db.scalars(
            select(Report)
            .where(Report.product_id == product_id)
            .order_by(Report.generated_at.desc(), Report.created_at.desc())
            .offset(offset)
            .limit(limit)
        ).all()
    )
    return ReportListResponse(
        items=[
            ReportResponse(
                id=r.id,
                product_id=r.product_id,
                version_id=r.version_id,
                format=r.format,
                content=r.content,
                markdown=r.markdown,
                generated_at=r.generated_at,
            )
            for r in items
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/latest", response_model=ReportResponse)
def get_latest_report(
    product_id: UUID,
    db: Session = Depends(get_db),
):
    """Get the latest generated report for a product."""
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")

    report = db.scalar(
        select(Report)
        .where(Report.product_id == product_id)
        .order_by(Report.generated_at.desc(), Report.created_at.desc())
        .limit(1)
    )
    if not report:
        raise NotFoundError(f"No reports found for product '{product_id}'")

    return ReportResponse(
        id=report.id,
        product_id=report.product_id,
        version_id=report.version_id,
        format=report.format,
        content=report.content,
        markdown=report.markdown,
        generated_at=report.generated_at,
    )


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    product_id: UUID,
    report_id: UUID,
    db: Session = Depends(get_db),
):
    """Retrieve an existing report by ID."""
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")

    report = db.scalar(
        select(Report)
        .where(
            Report.id == report_id,
            Report.product_id == product_id,
        )
    )
    if not report:
        raise NotFoundError(f"Report with id '{report_id}' not found for product '{product_id}'")

    return ReportResponse(
        id=report.id,
        product_id=report.product_id,
        version_id=report.version_id,
        format=report.format,
        content=report.content,
        markdown=report.markdown,
        generated_at=report.generated_at,
    )
