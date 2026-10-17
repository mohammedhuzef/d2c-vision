"""Repository functions for validation tables.

This is the ONLY module that directly touches validation_runs and validation_results tables.
"""

from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from backend.app.models.validation import ValidationRun, ValidationResult
from backend.app.models.recommendation import Recommendation
from backend.app.services.validation.base import StageResult, Status
import uuid


def get_latest_run(db: Session, project_id: UUID) -> Optional[ValidationRun]:
    """Fetch the latest validation run for a project/product ordered by creation time."""
    query = (
        select(ValidationRun)
        .where(ValidationRun.product_id == project_id)
        .order_by(desc(ValidationRun.started_at), desc(ValidationRun.created_at))
        .limit(1)
    )
    return db.scalar(query)


def get_run(db: Session, run_id: UUID, project_id: Optional[UUID] = None) -> Optional[ValidationRun]:
    """Fetch a specific validation run by id, optionally scoped to a project/product."""
    query = select(ValidationRun).where(ValidationRun.id == run_id)
    if project_id is not None:
        query = query.where(ValidationRun.product_id == project_id)
    return db.scalar(query)


def list_runs(
    db: Session,
    project_id: UUID,
    limit: int = 20,
    offset: int = 0,
) -> Tuple[List[ValidationRun], int]:
    """List validation runs for a project/product with pagination, newest first."""
    count_query = select(func.count(ValidationRun.id)).where(ValidationRun.product_id == project_id)
    total = db.scalar(count_query) or 0

    items_query = (
        select(ValidationRun)
        .where(ValidationRun.product_id == project_id)
        .order_by(desc(ValidationRun.started_at), desc(ValidationRun.created_at))
        .offset(offset)
        .limit(limit)
    )
    items = list(db.scalars(items_query).all())
    return items, total


def save_run(
    db: Session,
    validation_run: ValidationRun,
    stage_results: List[StageResult],
) -> ValidationRun:
    """
    Persist a validation run, its stage results, and deterministic recommendations
    atomically within the current transaction.
    """
    db.add(validation_run)

    for res in stage_results:
        db_res = ValidationResult(
            id=uuid.uuid4(),
            run_id=validation_run.id,
            product_id=validation_run.product_id,
            version_id=validation_run.version_id,
            stage=res.stage,
            status=res.status.value if isinstance(res.status, Status) else str(res.status),
            score=res.score,
            metrics=res.metrics,
            findings=[f.to_dict() for f in res.findings],
            inputs_used=res.inputs_used,
            upstream=res.upstream_stages_used,
            carried_forward_from=res.carried_forward_from,
        )
        db.add(db_res)

    # Generate actionable recommendations from findings
    for res in stage_results:
        for finding in res.findings:
            if finding.severity in ("warning", "critical"):
                priority = "high" if finding.severity == "critical" else "medium"
                rec = Recommendation(
                    id=uuid.uuid4(),
                    product_id=validation_run.product_id,
                    version_id=validation_run.version_id,
                    stage=res.stage,
                    priority=priority,
                    title=f"Address {finding.code.replace('_', ' ').title()}",
                    detail=finding.message,
                    evidence_ids=finding.evidence_ids,
                )
                db.add(rec)

    db.commit()
    db.refresh(validation_run)
    return validation_run
