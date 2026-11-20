import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, List, Optional
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.core.errors import ConflictError, NotFoundError
from backend.app.models.evidence import ResearchEvidence
from backend.app.models.product import Product
from backend.app.models.report import Report
from backend.app.models.validation import ValidationRun
from backend.app.models.version import ProductVersion
from backend.app.schemas.report import ReportListResponse, ReportResponse
from backend.app.services.report_builder import build_report_payload


def _to_json_safe(val: Any) -> Any:
    if isinstance(val, Decimal):
        if val % 1 == 0:
            return int(val)
        return float(val)
    if isinstance(val, dict):
        return {k: _to_json_safe(v) for k, v in val.items()}
    if isinstance(val, (list, tuple)):
        return [_to_json_safe(v) for v in val]
    return val


def create_report(db: Session, product_id: uuid.UUID) -> ReportResponse:
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product '{product_id}' not found")

    # 409 if the product has no validation run yet
    latest_run = (
        db.execute(
            select(ValidationRun)
            .where(ValidationRun.product_id == product_id)
            .order_by(ValidationRun.created_at.desc())
        )
        .scalars()
        .first()
    )

    if not latest_run:
        raise ConflictError(
            f"Product '{product_id}' has no validation run yet. Validate before generating a report."
        )

    # Get version associated with run, or latest version
    version = db.get(ProductVersion, latest_run.version_id)
    if not version:
        version = (
            db.execute(
                select(ProductVersion)
                .where(ProductVersion.product_id == product_id)
                .order_by(ProductVersion.version_number.desc())
            )
            .scalars()
            .first()
        )

    version_id = version.id if version else latest_run.version_id
    version_num = version.version_number if version else 1

    # Fetch evidence items for product
    evidence_rows = (
        db.execute(
            select(ResearchEvidence).where(ResearchEvidence.product_id == product_id)
        )
        .scalars()
        .all()
    )

    evidence_items = [
        {
            "id": str(e.id),
            "source_type": e.source_type,
            "source_url": e.source_url,
            "title": e.title,
            "excerpt": e.excerpt,
            "confidence": e.confidence,
        }
        for e in evidence_rows
    ]

    product_data = {
        "id": str(product.id),
        "name": product.name,
        "updated_at": product.created_at.isoformat() if product.created_at else None,
    }

    version_data = {
        "id": str(version_id),
        "version_number": version_num,
    }

    # Find financial metrics from financial stage result
    fin_snapshot = {}
    for res in latest_run.results:
        if res.stage == "financial":
            fin_snapshot = res.metrics or {}
            break

    validation_run_data = {
        "id": str(latest_run.id),
        "verdict": latest_run.verdict,
        "readiness_score": latest_run.readiness_score,
        "readiness": latest_run.readiness,
        "stage_results": [
            {
                "stage": res.stage,
                "status": res.status,
                "score": res.score,
                "findings": res.findings or [],
            }
            for res in latest_run.results
        ],
        "financial_snapshot": fin_snapshot,
        "recommendations": latest_run.recommendations or [],
    }

    content, markdown_text = build_report_payload(
        product_data=product_data,
        version_data=version_data,
        validation_run=validation_run_data,
        evidence_items=evidence_items,
    )

    report_id = uuid.uuid4()
    now_utc = datetime.now(timezone.utc)
    report = Report(
        id=report_id,
        product_id=product_id,
        version_id=version_id,
        format="json_markdown",
        content=_to_json_safe(content),
        markdown=markdown_text,
        generated_at=now_utc,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return ReportResponse(
        id=report.id,
        product_id=report.product_id,
        version_id=report.version_id,
        format=report.format,
        content=report.content,
        markdown=report.markdown,
        generated_at=report.generated_at,
    )


def list_reports(
    db: Session, product_id: uuid.UUID, limit: int = 20, offset: int = 0
) -> ReportListResponse:
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product '{product_id}' not found")

    base_query = select(Report).where(Report.product_id == product_id)
    total = (
        db.execute(select(func.count()).select_from(base_query.subquery())).scalar()
        or 0
    )

    reports = (
        db.execute(
            base_query.order_by(Report.generated_at.desc())
            .offset(offset)
            .limit(limit)
        )
        .scalars()
        .all()
    )

    items = [
        ReportResponse(
            id=r.id,
            product_id=r.product_id,
            version_id=r.version_id,
            format=r.format,
            content=r.content,
            markdown=r.markdown,
            generated_at=r.generated_at,
        )
        for r in reports
    ]

    return ReportListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


def get_latest_report(db: Session, product_id: uuid.UUID) -> ReportResponse:
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product '{product_id}' not found")

    report = (
        db.execute(
            select(Report)
            .where(Report.product_id == product_id)
            .order_by(Report.generated_at.desc())
        )
        .scalars()
        .first()
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


def get_report(
    db: Session, product_id: uuid.UUID, report_id: uuid.UUID
) -> ReportResponse:
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product '{product_id}' not found")

    report = db.execute(
        select(Report).where(
            Report.id == report_id, Report.product_id == product_id
        )
    ).scalars().first()

    if not report:
        raise NotFoundError(
            f"Report '{report_id}' not found for product '{product_id}'"
        )

    return ReportResponse(
        id=report.id,
        product_id=report.product_id,
        version_id=report.version_id,
        format=report.format,
        content=report.content,
        markdown=report.markdown,
        generated_at=report.generated_at,
    )
