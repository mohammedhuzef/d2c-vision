"""Repository for ValidationRun, ValidationResult, and Recommendation database operations."""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Sequence, Tuple
import uuid

from sqlalchemy import desc, func
from sqlalchemy.orm import Session, joinedload

from backend.app.core.errors import NotFoundError
from backend.app.models.analysis import CompetitorAnalysis
from backend.app.models.evidence import ResearchEvidence
from backend.app.models.product import Product
from backend.app.models.recommendation import Recommendation
from backend.app.models.validation import ValidationResult, ValidationRun
from backend.app.models.version import ProductVersion
from backend.app.services.validation.base import Finding, Severity, StageResult, Status


def _to_json_safe(val: Any) -> Any:
    """Converts Decimals to float/int for database JSON column serialization."""
    if isinstance(val, Decimal):
        if val % 1 == 0:
            return int(val)
        return float(val)
    if isinstance(val, dict):
        return {k: _to_json_safe(v) for k, v in val.items()}
    if isinstance(val, (list, tuple)):
        return [_to_json_safe(v) for v in val]
    return val


class ValidationRepository:
    @staticmethod
    def load_inputs(
        db: Session,
        product_id: uuid.UUID,
        version_number: Optional[int] = None,
    ) -> Tuple[Product, ProductVersion, Dict[str, Any], List[Dict[str, Any]], List[Dict[str, Any]]]:
        """Loads product, product version assumptions, evidence, and competitor analyses."""
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise NotFoundError(f"Product {product_id} not found")

        v_num = version_number if version_number is not None else product.current_version
        version = (
            db.query(ProductVersion)
            .filter(
                ProductVersion.product_id == product_id,
                ProductVersion.version_number == v_num,
            )
            .first()
        )
        if not version:
            raise NotFoundError(f"Version {v_num} for product {product_id} not found")

        assumptions = version.assumptions or {}

        # Load research evidence as plain dictionaries
        evidence_rows = (
            db.query(ResearchEvidence)
            .filter(ResearchEvidence.product_id == product_id)
            .all()
        )
        evidence_dicts: List[Dict[str, Any]] = [
            {
                "id": str(e.id),
                "product_id": str(e.product_id),
                "competitor_id": str(e.competitor_id) if e.competitor_id else None,
                "content_hash": e.content_hash,
                "source_type": e.source_type,
                "source_url": e.source_url,
                "title": e.title,
                "excerpt": e.excerpt,
                "confidence": e.confidence,
                "data": e.data or {},
            }
            for e in evidence_rows
        ]

        # Load competitor analyses as plain dictionaries
        analysis_rows = (
            db.query(CompetitorAnalysis)
            .filter(CompetitorAnalysis.product_id == product_id)
            .all()
        )
        analysis_dicts: List[Dict[str, Any]] = [
            {
                "id": str(a.id),
                "product_id": str(a.product_id),
                "competitor_id": str(a.competitor_id) if a.competitor_id else None,
                "summary": a.summary,
                "strengths": a.strengths or [],
                "weaknesses": a.weaknesses or [],
                "price_observed": a.price_observed,
                "evidence_ids": [str(eid) for eid in (a.evidence_ids or [])],
                "produced_by": a.produced_by,
            }
            for a in analysis_rows
        ]

        return product, version, assumptions, evidence_dicts, analysis_dicts

    @staticmethod
    def get_previous_results_for_carry_forward(
        db: Session,
        product_id: uuid.UUID,
        run_id: Optional[uuid.UUID] = None,
    ) -> Dict[str, Tuple[StageResult, uuid.UUID]]:
        """Retrieves stage results from an earlier run to carry forward unaffected stages."""
        query = db.query(ValidationRun).filter(ValidationRun.product_id == product_id)
        if run_id:
            query = query.filter(ValidationRun.id == run_id)
        else:
            query = query.order_by(desc(ValidationRun.created_at))

        prev_run = query.first()
        if not prev_run:
            return {}

        results: Dict[str, Tuple[StageResult, uuid.UUID]] = {}
        for r in prev_run.results:
            findings_list = []
            for f in (r.findings or []):
                sev_raw = f.get("severity", "info").upper()
                sev = Severity[sev_raw] if sev_raw in Severity.__members__ else Severity.INFO
                findings_list.append(
                    Finding(
                        code=f.get("code", "UNKNOWN"),
                        severity=sev,
                        message=f.get("message", ""),
                        field=f.get("field"),
                        evidence_ids=tuple(f.get("evidence_ids") or ()),
                    )
                )

            status_raw = r.status.upper()
            status = Status[status_raw] if status_raw in Status.__members__ else Status.NOT_RUN

            stage_res = StageResult(
                stage=r.stage,
                status=status,
                score=Decimal(str(r.score)) if r.score is not None else None,
                metrics=dict(r.metrics or {}),
                findings=tuple(findings_list),
                inputs_used=tuple(r.inputs_used or []),
                upstream_stages_used=tuple(r.upstream or []),
                carried_forward_from=str(r.id),
            )
            results[r.stage] = (stage_res, r.id)

        return results

    @staticmethod
    def save_run(
        db: Session,
        *,
        product: Product,
        version: ProductVersion,
        run_id: uuid.UUID,
        trigger: str,
        triggered_by: Optional[str],
        status: str,
        stages_run: List[str],
        readiness_score: Optional[Decimal],
        readiness: Optional[Dict[str, Any]],
        recommendations: Optional[List[Dict[str, Any]]],
        verdict: str,
        input_fingerprint: str,
        started_at: datetime,
        finished_at: Optional[datetime],
        stage_results: List[StageResult],
        legacy_recommendations: Optional[List[Dict[str, Any]]] = None,
    ) -> ValidationRun:
        """Atomically saves a validation run, its stage results, and legacy recommendations."""
        run = ValidationRun(
            id=run_id,
            product_id=product.id,
            version_id=version.id,
            trigger=trigger,
            triggered_by=triggered_by,
            status=status,
            stages_run=stages_run,
            readiness_score=readiness_score,
            readiness=_to_json_safe(readiness),
            recommendations=_to_json_safe(recommendations),
            verdict=verdict,
            input_fingerprint=input_fingerprint,
            started_at=started_at,
            finished_at=finished_at,
        )
        db.add(run)

        # Insert per-stage results
        for sr in stage_results:
            findings_data = [
                {
                    "code": f.code,
                    "severity": f.severity.value,
                    "message": f.message,
                    "field": f.field,
                    "evidence_ids": list(f.evidence_ids),
                }
                for f in sr.findings
            ]

            carried_from_uuid: Optional[uuid.UUID] = None
            if sr.carried_forward_from:
                try:
                    carried_from_uuid = uuid.UUID(str(sr.carried_forward_from))
                except (ValueError, AttributeError):
                    pass

            db_res = ValidationResult(
                id=uuid.uuid4(),
                run_id=run.id,
                product_id=product.id,
                version_id=version.id,
                stage=sr.stage,
                status=sr.status.value,
                score=sr.score,
                metrics=_to_json_safe(sr.metrics),
                findings=_to_json_safe(findings_data),
                inputs_used=list(sr.inputs_used),
                upstream=list(sr.upstream_stages_used),
                carried_forward_from=carried_from_uuid,
            )
            db.add(db_res)

        # Write rows to legacy recommendations table
        if legacy_recommendations:
            for rec in legacy_recommendations:
                # Map priority: CRITICAL/HIGH -> high, MEDIUM -> medium, LOW -> low
                raw_pri = str(rec.get("priority", "low")).upper()
                if raw_pri in ("CRITICAL", "HIGH"):
                    leg_pri = "high"
                elif raw_pri == "MEDIUM":
                    leg_pri = "medium"
                else:
                    leg_pri = "low"

                rec_evidence_ids = []
                for eid in rec.get("evidence_ids", []):
                    try:
                        rec_evidence_ids.append(uuid.UUID(str(eid)))
                    except (ValueError, AttributeError):
                        pass

                db_rec = Recommendation(
                    id=uuid.uuid4(),
                    product_id=product.id,
                    version_id=version.id,
                    stage=rec.get("stage", "general"),
                    priority=leg_pri,
                    title=rec.get("title", ""),
                    detail=rec.get("detail", ""),
                    evidence_ids=rec_evidence_ids,
                )
                db.add(db_rec)

        # Update product validated_version
        product.validated_version = version.version_number
        db.commit()
        db.refresh(run)
        return run

    @staticmethod
    def get_latest_run(
        db: Session,
        product_id: uuid.UUID,
    ) -> Optional[ValidationRun]:
        """Retrieves the latest completed validation run for a product with results loaded."""
        return (
            db.query(ValidationRun)
            .filter(ValidationRun.product_id == product_id)
            .order_by(desc(ValidationRun.created_at))
            .options(joinedload(ValidationRun.results), joinedload(ValidationRun.version))
            .first()
        )

    @staticmethod
    def get_run(
        db: Session,
        run_id: uuid.UUID,
        product_id: Optional[uuid.UUID] = None,
    ) -> Optional[ValidationRun]:
        """Retrieves a specific validation run by ID with results loaded."""
        query = db.query(ValidationRun).filter(ValidationRun.id == run_id)
        if product_id:
            query = query.filter(ValidationRun.product_id == product_id)
        return query.options(joinedload(ValidationRun.results), joinedload(ValidationRun.version)).first()

    @staticmethod
    def list_runs(
        db: Session,
        product_id: uuid.UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[List[ValidationRun], int]:
        """Returns paginated validation runs for a product."""
        capped_limit = min(max(1, limit), 100)
        query = db.query(ValidationRun).filter(ValidationRun.product_id == product_id)
        total = query.count()
        items = (
            query.order_by(desc(ValidationRun.created_at))
            .options(joinedload(ValidationRun.results), joinedload(ValidationRun.version))
            .offset(offset)
            .limit(capped_limit)
            .all()
        )
        return items, total

    @staticmethod
    def list_legacy_recommendations(
        db: Session,
        product_id: uuid.UUID,
    ) -> List[Recommendation]:
        """Lists recommendations for a product from the legacy recommendations table."""
        return (
            db.query(Recommendation)
            .filter(Recommendation.product_id == product_id)
            .order_by(desc(Recommendation.created_at))
            .all()
        )
