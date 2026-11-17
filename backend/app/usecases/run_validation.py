"""Use case orchestrating end-to-end product validation pipeline execution and persistence."""

from datetime import datetime, timezone
from decimal import Decimal
import hashlib
import json
from typing import Any, Dict, List, Optional, Sequence
import uuid

from sqlalchemy.orm import Session

from backend.app.models.impact import ImpactEvent
from backend.app.models.validation import ValidationRun
from backend.app.repositories.product_repository import _get_product_lock
from backend.app.repositories.validation_repository import ValidationRepository
from backend.app.services.readiness import calculate_readiness
from backend.app.services.validation.dependencies import DOWNSTREAM_MAP
from backend.app.services.validation.pipeline import run_pipeline
from backend.app.services.validation.recommendations.generator import generate as generate_recommendations
from backend.app.services.validation.rules_config import STAGE_ORDER


def run_validation_use_case(
    db: Session,
    product_id: uuid.UUID,
    *,
    trigger: str = "manual",
    triggered_by: Optional[str] = None,
    stages: Optional[Sequence[str]] = None,
    version_number: Optional[int] = None,
    rerun_impact_event_id: Optional[uuid.UUID] = None,
) -> ValidationRun:
    """Executes the validation pipeline, calculates readiness, generates recommendations, and persists all results."""
    lock = _get_product_lock(product_id)
    with lock:
        # 1. Load inputs
        product, version, assumptions, evidence_dicts, analysis_dicts = ValidationRepository.load_inputs(
            db=db,
            product_id=product_id,
            version_number=version_number,
        )

        # 2. Determine stages to execute and load carry-forward previous results if partial run
        if stages is not None:
            to_run = set(stages)
            q = list(to_run)
            while q:
                curr = q.pop(0)
                for ds in DOWNSTREAM_MAP.get(curr, ()):
                    if ds not in to_run:
                        to_run.add(ds)
                        q.append(ds)
            stages_to_execute = [s for s in STAGE_ORDER if s in to_run]
            previous_results = ValidationRepository.get_previous_results_for_carry_forward(
                db=db,
                product_id=product_id,
            )
        else:
            stages_to_execute = list(STAGE_ORDER)
            previous_results = None

        # 3. Compute canonical input fingerprint
        canonical_payload = {
            "assumptions": assumptions,
            "evidence": evidence_dicts,
            "analyses": analysis_dicts,
        }
        canonical_json = json.dumps(canonical_payload, sort_keys=True, separators=(",", ":"), default=str)
        input_fingerprint = hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()

        # 4. Execute pure validation pipeline
        started_at = datetime.now(timezone.utc)
        stage_results_map = run_pipeline(
            assumptions,
            evidence_dicts,
            analysis_dicts,
            stages=stages_to_execute,
            previous=previous_results,
        )

        # 5. Compute aggregate readiness
        readiness_res = calculate_readiness(stage_results_map)

        # 6. Generate prioritized recommendations
        rec_items = generate_recommendations(stage_results_map, assumptions)
        recs_json = [r.to_dict() for r in rec_items]
        legacy_recs = [
            {
                "stage": r.stage,
                "priority": r.priority,
                "title": r.title,
                "detail": r.detail,
                "evidence_ids": list(r.evidence_ids),
            }
            for r in rec_items
        ]

        finished_at = datetime.now(timezone.utc)

        # 7. Prepare readiness snapshot
        readiness_json = {
            "label": readiness_res.label,
            "score": float(readiness_res.overall_score) if readiness_res.overall_score is not None else None,
            "blocking_stages": list(readiness_res.blocking_stages),
            "warning_stages": list(readiness_res.warning_stages),
            "missing_stages": list(readiness_res.missing_stages),
            "breakdown": readiness_res.breakdown,
        }

        # 8. Save ValidationRun and ValidationResult rows atomically
        run_id = uuid.uuid4()
        stage_results_list = [stage_results_map[s] for s in STAGE_ORDER if s in stage_results_map]

        run = ValidationRepository.save_run(
            db=db,
            product=product,
            version=version,
            run_id=run_id,
            trigger=trigger,
            triggered_by=triggered_by,
            status="COMPLETED",
            stages_run=stages_to_execute,
            readiness_score=readiness_res.overall_score,
            readiness=readiness_json,
            recommendations=recs_json,
            verdict=readiness_res.label,
            input_fingerprint=input_fingerprint,
            started_at=started_at,
            finished_at=finished_at,
            stage_results=stage_results_list,
            legacy_recommendations=legacy_recs,
        )

        # 9. Link rerun impact event if provided
        if rerun_impact_event_id:
            impact_evt = db.query(ImpactEvent).filter(ImpactEvent.id == rerun_impact_event_id).first()
            if impact_evt:
                impact_evt.rerun_run_id = run.id
                db.commit()

        return run
