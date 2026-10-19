"""Validation Orchestrator service.

Loads project assumptions and research context, executes validation stages in STAGE_ORDER,
manages partial re-runs with downstream dependency resolution and carry-forward,
isolates unexpected stage crashes, computes readiness and input fingerprints,
and persists runs immutably via the validation repository.
"""

from collections import defaultdict
from datetime import datetime, timezone
from decimal import Decimal
import hashlib
import json
import logging
import threading
from typing import Dict, List, Optional, Set, Union
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.product import Product
from backend.app.models.version import ProductVersion
from backend.app.models.competitor import Competitor
from backend.app.models.evidence import ResearchEvidence
from backend.app.models.analysis import CompetitorAnalysis
from backend.app.models.validation import ValidationRun, ValidationResult
from backend.app.schemas.assumptions import Assumptions
from backend.app.services.validation.base import Finding, StageContext, StageResult, Status, STAGE_ORDER
from backend.app.services.validation.stages import ALL_STAGES, STAGE_MAP, ORDERED_STAGE_NAMES
from backend.app.services.validation import rules_config
from backend.app.services.validation.repository import get_latest_run, save_run
from backend.app.services.readiness import calculate_readiness, compute_readiness, ReadinessResult
from backend.app.services.validation.recommendations import generate_recommendations
from backend.app.services.validation.pipeline import execute_stages, run_pipeline

logger = logging.getLogger(__name__)

# Process-level concurrency lock per project for thread-safety across SQLite and Postgres
_project_locks: Dict[uuid.UUID, threading.Lock] = defaultdict(threading.Lock)
_project_locks_mutex = threading.Lock()


def _get_project_lock(project_id: uuid.UUID) -> threading.Lock:
    with _project_locks_mutex:
        return _project_locks[project_id]


def _compute_input_fingerprint(
    assumptions: Assumptions,
    competitors: List[Competitor],
    evidence: List[ResearchEvidence],
    analyses: List[CompetitorAnalysis],
) -> str:
    """Computes a deterministic SHA-256 fingerprint from the plain input context."""
    hasher = hashlib.sha256()

    # 1. Assumptions payload
    hasher.update(assumptions.model_dump_json(by_alias=True).encode("utf-8"))

    # 2. Competitors
    comp_data = sorted(
        [{"id": str(c.id), "name": c.name} for c in competitors],
        key=lambda x: x["id"],
    )
    hasher.update(json.dumps(comp_data, sort_keys=True).encode("utf-8"))

    # 3. Evidence
    ev_data = sorted(
        [
            {
                "id": str(e.id),
                "competitor_id": str(e.competitor_id) if e.competitor_id else None,
                "data": e.data,
            }
            for e in evidence
        ],
        key=lambda x: x["id"],
    )
    hasher.update(json.dumps(ev_data, sort_keys=True).encode("utf-8"))

    # 4. Competitor analyses
    an_data = sorted(
        [
            {
                "id": str(a.id),
                "competitor_id": str(a.competitor_id),
                "price": str(a.price_observed) if a.price_observed is not None else None,
            }
            for a in analyses
        ],
        key=lambda x: x["id"],
    )
    hasher.update(json.dumps(an_data, sort_keys=True).encode("utf-8"))

    return hasher.hexdigest()


def resolve_stages_to_run(requested_stages: Optional[List[str]]) -> Set[str]:
    """
    Expands requested stages to include all downstream-dependent stages.
    - pricing depends on competitor (if competitor is re-run, pricing must be re-run)
    - marketing depends on financial (if financial is re-run, marketing must be re-run)
    """
    if requested_stages is None:
        return set(ORDERED_STAGE_NAMES)

    stages_to_execute = set(requested_stages)
    changed = True
    while changed:
        changed = False
        for stage in list(stages_to_execute):
            downstream = rules_config.DOWNSTREAM_DEPENDENCIES.get(stage, [])
            for dep in downstream:
                if dep not in stages_to_execute:
                    stages_to_execute.add(dep)
                    changed = True

    return stages_to_execute


class ValidationOrchestrator:
    def __init__(self, db: Session):
        self.db = db

    def run_validation(
        self,
        project_id: Optional[uuid.UUID] = None,
        *,
        product_id: Optional[uuid.UUID] = None,
        stages: Optional[List[str]] = None,
        stages_to_run: Optional[List[str]] = None,
        version_number: Optional[int] = None,
        trigger: str = "initial",
    ) -> ValidationRun:
        """
        Runs validation stages sequentially, passing upstream outputs.
        - project_id / product_id: UUID of project/product
        - stages / stages_to_run: Optional subset of stages to re-run.
          Downstream dependents are automatically resolved and executed.
        - Idempotent and deterministic: produces an immutable new ValidationRun record.
        """
        target_id = project_id or product_id
        if target_id is None:
            raise ValueError("project_id or product_id is required")

        lock = _get_project_lock(target_id)
        with lock:
            return self._execute_run(
                target_id=target_id,
                stages=stages if stages is not None else stages_to_run,
                version_number=version_number,
                trigger=trigger,
            )

    def _execute_run(
        self,
        target_id: uuid.UUID,
        stages: Optional[List[str]],
        version_number: Optional[int],
        trigger: str,
    ) -> ValidationRun:
        # Concurrency guard: SELECT ... FOR UPDATE on PostgreSQL
        product = self.db.scalar(
            select(Product).where(Product.id == target_id).with_for_update()
        )
        if not product:
            raise ValueError(f"Project/Product {target_id} not found")

        v_num = version_number if version_number is not None else product.current_version
        version = self.db.scalar(
            select(ProductVersion).where(
                ProductVersion.product_id == target_id,
                ProductVersion.version_number == v_num,
            )
        )
        if not version:
            raise ValueError(f"Version {v_num} for project/product {target_id} not found")

        # Load context artifacts
        assumptions = Assumptions.model_validate(version.assumptions)
        competitors = list(
            self.db.scalars(
                select(Competitor).where(Competitor.product_id == target_id).order_by(Competitor.created_at.asc())
            ).all()
        )
        evidence = list(
            self.db.scalars(
                select(ResearchEvidence).where(ResearchEvidence.product_id == target_id)
            ).all()
        )
        analyses = list(
            self.db.scalars(
                select(CompetitorAnalysis).where(CompetitorAnalysis.product_id == target_id)
            ).all()
        )

        # Compute deterministic input fingerprint
        fingerprint = _compute_input_fingerprint(assumptions, competitors, evidence, analyses)

        # Resolve stages to execute (including forced downstream re-runs)
        stages_to_execute = resolve_stages_to_run(stages)

        # Load previous results for carry forward if doing partial execution
        previous_results_map: Dict[str, ValidationResult] = {}
        if set(stages_to_execute) != set(ORDERED_STAGE_NAMES):
            last_run = get_latest_run(self.db, target_id)
            if last_run and last_run.results:
                for res in last_run.results:
                    previous_results_map[res.stage] = res

        # Build pure context
        ctx = StageContext(
            assumptions=assumptions,
            competitors=competitors,
            evidence=evidence,
            competitor_analyses=analyses,
            upstream={},
        )

        final_stage_results: List[StageResult] = []
        now_utc = datetime.now(timezone.utc)
        run_id = uuid.uuid4()

        if set(stages_to_execute) == set(ORDERED_STAGE_NAMES):
            final_stage_results, readiness_res, recs = run_pipeline(ctx)
            legacy_score, legacy_verdict = compute_readiness(final_stage_results)
        else:
            for stage_name in ORDERED_STAGE_NAMES:
                if stage_name in stages_to_execute:
                    res = execute_stages(ctx, [stage_name])[0]
                    final_stage_results.append(res)
                else:
                    # Carry forward unaffected result from prior run
                    prev_res = previous_results_map.get(stage_name)
                    if prev_res:
                        cf_result = StageResult(
                            stage=stage_name,
                            status=Status(prev_res.status),
                            score=Decimal(str(prev_res.score)) if prev_res.score is not None else None,
                            metrics=prev_res.metrics or {},
                            findings=[
                                Finding(
                                    code=f.get("code", ""),
                                    severity=f.get("severity", "info"),
                                    message=f.get("message", ""),
                                    evidence_ids=[uuid.UUID(eid) for eid in f.get("evidence_ids", []) if eid],
                                    field=f.get("field"),
                                )
                                for f in (prev_res.findings or [])
                            ],
                            inputs_used=prev_res.inputs_used or [],
                            upstream_stages_used=prev_res.upstream or [],
                            carried_forward_from=prev_res.id,
                        )
                        ctx.upstream[stage_name] = cf_result
                        final_stage_results.append(cf_result)
                    else:
                        res = execute_stages(ctx, [stage_name])[0]
                        final_stage_results.append(res)

            readiness_res = calculate_readiness(final_stage_results)
            legacy_score, legacy_verdict = compute_readiness(final_stage_results)
            recs = generate_recommendations(
                stage_results=final_stage_results,
                assumptions=assumptions,
                readiness=readiness_res,
            )

        recs_dict_list = [r.to_dict() for r in recs]

        executed_stages_list = [s for s in ORDERED_STAGE_NAMES if s in stages_to_execute]

        # Construct immutable ValidationRun record
        validation_run = ValidationRun(
            id=run_id,
            product_id=target_id,
            version_id=version.id,
            trigger=trigger,
            triggered_by=trigger,
            status="COMPLETED",
            stages_run=executed_stages_list,
            readiness_score=readiness_res.overall_score if readiness_res.overall_score is not None else None,
            readiness=readiness_res.to_dict(),
            recommendations=recs_dict_list,
            verdict=legacy_verdict,
            input_fingerprint=fingerprint,
            started_at=now_utc,
            finished_at=datetime.now(timezone.utc),
        )

        # Delegate persistence exclusively to the repository layer
        saved = save_run(self.db, validation_run, final_stage_results)
        return saved
