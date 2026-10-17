from decimal import Decimal
import json
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.errors import NotFoundError, ValidationError
from backend.app.models.product import Product
from backend.app.models.version import ProductVersion
from backend.app.models.validation import ValidationRun, ValidationResult
from backend.app.models.recommendation import Recommendation
from backend.app.models.competitor import Competitor
from backend.app.models.evidence import ResearchEvidence
from backend.app.models.analysis import CompetitorAnalysis
from backend.app.schemas.assumptions import Assumptions
from backend.app.schemas.simulation import SimulationRequest, SimulationResponse
from backend.app.services.validation.simulation import simulate, SimulationValidationError
from backend.app.schemas.validation import (
    FindingResponse,
    StageResultResponse,
    ValidationRunResponse,
    RevalidateRequest,
    ReadinessResponse,
    StageResultDetailResponse,
    ValidationRunCreateRequest,
    ValidationRunDetailResponse,
    ValidationRunListResponse,
)
from backend.app.schemas.recommendation import (
    RecommendationResponse,
    RecommendationListResponse,
    RecommendationItemResponse,
    RunRecommendationListResponse,
)
from backend.app.services.validation.base import STAGE_ORDER
from backend.app.services.validation import rules_config
from backend.app.services.validation.orchestrator import ValidationOrchestrator
from backend.app.services.validation.repository import get_latest_run, get_run, list_runs

router = APIRouter(prefix="/products/{product_id}", tags=["Validation"])
projects_router = APIRouter(prefix="/projects/{project_id}/validation", tags=["Validation Runs"])


# ---------------------------------------------------------------------------
# Formatting Helpers
# ---------------------------------------------------------------------------

def _format_validation_run_response(run: ValidationRun) -> ValidationRunResponse:
    order_map = {name: i for i, name in enumerate(STAGE_ORDER, start=1)}
    sorted_results = sorted(run.results, key=lambda r: order_map.get(r.stage, 99))

    stage_results = []
    for r in sorted_results:
        findings_resp = [
            FindingResponse(
                code=f.get("code", ""),
                severity=f.get("severity", "info"),
                message=f.get("message", ""),
                evidence_ids=[UUID(eid) for eid in f.get("evidence_ids", []) if eid],
                field=f.get("field"),
            )
            for f in (r.findings or [])
        ]
        stage_results.append(
            StageResultResponse(
                stage=r.stage,
                status=r.status,  # type: ignore
                score=json.loads(f"{r.score:.2f}") if r.score is not None else None,
                metrics=r.metrics or {},
                findings=findings_resp,
                inputs_used=r.inputs_used or [],
                upstream_stages_used=r.upstream or [],
                carried_forward_from=r.carried_forward_from,
            )
        )

    version_num = run.version.version_number if run.version else 1

    return ValidationRunResponse(
        run_id=run.id,
        product_id=run.product_id,
        version_id=run.version_id,
        version_number=version_num,
        trigger=run.trigger,
        stages_run=run.stages_run,
        readiness_score=json.loads(f"{run.readiness_score:.2f}") if run.readiness_score is not None else None,
        verdict=run.verdict,  # type: ignore
        results=stage_results,
        started_at=run.started_at,
        finished_at=run.finished_at,
    )


def _format_run_detail_response(run: ValidationRun) -> ValidationRunDetailResponse:
    order_map = {name: i for i, name in enumerate(STAGE_ORDER, start=1)}
    sorted_results = sorted(run.results, key=lambda r: order_map.get(r.stage, 99))

    stage_results = []
    for r in sorted_results:
        findings_resp = [
            FindingResponse(
                code=f.get("code", ""),
                severity=f.get("severity", "info"),
                message=f.get("message", ""),
                evidence_ids=[UUID(eid) for eid in f.get("evidence_ids", []) if eid],
                field=f.get("field"),
            )
            for f in (r.findings or [])
        ]
        score_dec = Decimal(str(r.score)) if r.score is not None else None
        stage_results.append(
            StageResultDetailResponse(
                stage=r.stage,
                status=r.status,  # type: ignore
                score=score_dec,
                metrics=r.metrics or {},
                findings=findings_resp,
                inputs_used=r.inputs_used or [],
                upstream_stages_used=r.upstream or [],
                carried_forward_from=r.carried_forward_from,
            )
        )

    readiness_obj = None
    if run.readiness:
        overall_sc = (
            Decimal(str(run.readiness.get("overall_score")))
            if run.readiness.get("overall_score") is not None
            else None
        )
        readiness_obj = ReadinessResponse(
            overall_score=overall_sc,
            label=run.readiness.get("label", "INSUFFICIENT_EVIDENCE"),
            blocking_stages=run.readiness.get("blocking_stages", []),
            warning_stages=run.readiness.get("warning_stages", []),
            missing_stages=run.readiness.get("missing_stages", []),
            breakdown=run.readiness.get("breakdown", {}),
        )

    version_num = run.version.version_number if run.version else 1

    rec_summary = {p: 0 for p in rules_config.RECOMMENDATION_PRIORITIES}
    if run.recommendations:
        for r in run.recommendations:
            p = r.get("priority", "LOW")
            if p in rec_summary:
                rec_summary[p] += 1
            else:
                rec_summary[p] = 1

    return ValidationRunDetailResponse(
        id=run.id,
        project_id=run.product_id,
        version_id=run.version_id,
        version_number=version_num,
        created_at=run.created_at,
        triggered_by=run.triggered_by or run.trigger,
        status=run.status,
        input_fingerprint=run.input_fingerprint,
        readiness=readiness_obj,
        stages_run=run.stages_run,
        results=stage_results,
        recommendations=rec_summary,
        started_at=run.started_at,
        finished_at=run.finished_at,
    )


def _format_readiness_response(run: ValidationRun) -> ReadinessResponse:
    if not run.readiness:
        raise NotFoundError(f"No readiness data available for validation run '{run.id}'")

    overall_sc = (
        Decimal(str(run.readiness.get("overall_score")))
        if run.readiness.get("overall_score") is not None
        else None
    )
    return ReadinessResponse(
        overall_score=overall_sc,
        label=run.readiness.get("label", "INSUFFICIENT_EVIDENCE"),
        blocking_stages=run.readiness.get("blocking_stages", []),
        warning_stages=run.readiness.get("warning_stages", []),
        missing_stages=run.readiness.get("missing_stages", []),
        breakdown=run.readiness.get("breakdown", {}),
    )


# ---------------------------------------------------------------------------
# Core Handler Implementations
# ---------------------------------------------------------------------------

def _handle_create_run(
    target_id: UUID,
    payload: Optional[ValidationRunCreateRequest],
    db: Session,
) -> ValidationRunDetailResponse:
    product = db.get(Product, target_id)
    if not product:
        raise NotFoundError(f"Project with id '{target_id}' not found")

    if payload and payload.stages:
        for s in payload.stages:
            if s not in STAGE_ORDER:
                raise ValidationError(
                    f"Unknown stage '{s}'. Valid stages are: {', '.join(STAGE_ORDER)}"
                )

    stages_to_run = payload.stages if payload and payload.stages else None
    orchestrator = ValidationOrchestrator(db)
    validation_run = orchestrator.run_validation(
        project_id=target_id,
        stages=stages_to_run,
        trigger="manual",
    )
    return _format_run_detail_response(validation_run)


def _handle_get_latest_run(target_id: UUID, db: Session) -> ValidationRunDetailResponse:
    product = db.get(Product, target_id)
    if not product:
        raise NotFoundError(f"Project with id '{target_id}' not found")

    run = get_latest_run(db, target_id)
    if not run:
        raise NotFoundError(f"No validation run found for project '{target_id}'")
    return _format_run_detail_response(run)


def _handle_get_run_by_id(target_id: UUID, run_id: UUID, db: Session) -> ValidationRunDetailResponse:
    product = db.get(Product, target_id)
    if not product:
        raise NotFoundError(f"Project with id '{target_id}' not found")

    run = get_run(db, run_id, project_id=target_id)
    if not run:
        raise NotFoundError(f"Validation run '{run_id}' for project '{target_id}' not found")
    return _format_run_detail_response(run)


def _handle_list_runs(
    target_id: UUID,
    limit: int,
    offset: int,
    db: Session,
) -> ValidationRunListResponse:
    product = db.get(Product, target_id)
    if not product:
        raise NotFoundError(f"Project with id '{target_id}' not found")

    items, total = list_runs(db, target_id, limit=limit, offset=offset)
    return ValidationRunListResponse(
        items=[_format_run_detail_response(r) for r in items],
        total=total,
        limit=limit,
        offset=offset,
    )


def _handle_get_readiness(target_id: UUID, db: Session) -> ReadinessResponse:
    product = db.get(Product, target_id)
    if not product:
        raise NotFoundError(f"Project with id '{target_id}' not found")

    run = get_latest_run(db, target_id)
    if not run or not run.readiness:
        raise NotFoundError(f"No validation run found for project '{target_id}'")
    return _format_readiness_response(run)


def _handle_get_recommendations(
    target_id: UUID,
    run_id: Optional[UUID],
    priority: Optional[str],
    stage: Optional[str],
    db: Session,
) -> RunRecommendationListResponse:
    product = db.get(Product, target_id)
    if not product:
        raise NotFoundError(f"Project with id '{target_id}' not found")

    if run_id is not None:
        run = get_run(db, run_id, target_id)
        if not run:
            raise NotFoundError(f"Validation run '{run_id}' not found for project '{target_id}'")
    else:
        run = get_latest_run(db, target_id)
        if not run:
            raise NotFoundError(f"No validation run found for project '{target_id}'")

    priority_filter = None
    if priority is not None:
        p_clean = priority.strip().upper()
        if p_clean not in rules_config.RECOMMENDATION_PRIORITIES:
            raise ValidationError(
                f"Invalid priority filter '{priority}'. Must be one of: {rules_config.RECOMMENDATION_PRIORITIES}"
            )
        priority_filter = p_clean

    stage_filter = None
    if stage is not None:
        s_clean = stage.strip().lower()
        if s_clean not in STAGE_ORDER:
            raise ValidationError(
                f"Invalid stage filter '{stage}'. Must be one of: {STAGE_ORDER}"
            )
        stage_filter = s_clean

    raw_recs = run.recommendations or []

    counts_by_priority = {p: 0 for p in rules_config.RECOMMENDATION_PRIORITIES}
    for r in raw_recs:
        p = r.get("priority", "LOW")
        if p in counts_by_priority:
            counts_by_priority[p] += 1

    filtered = []
    for r in raw_recs:
        if priority_filter and r.get("priority") != priority_filter:
            continue
        if stage_filter and r.get("stage") != stage_filter:
            continue
        filtered.append(
            RecommendationItemResponse(
                id=UUID(r["id"]) if isinstance(r["id"], str) else r["id"],
                code=r.get("code", ""),
                stage=r.get("stage", ""),
                priority=r.get("priority", "LOW"),
                title=r.get("title", ""),
                detail=r.get("detail", ""),
                action_type=r.get("action_type", "REVIEW_ASSUMPTION"),
                target_field=r.get("target_field"),
                current_value=r.get("current_value"),
                suggested_value=r.get("suggested_value"),
                finding_codes=r.get("finding_codes", []),
                evidence_ids=[UUID(eid) for eid in r.get("evidence_ids", []) if eid],
                impact=r.get("impact", {}),
            )
        )

    return RunRecommendationListResponse(
        run_id=run.id,
        project_id=run.product_id,
        items=filtered,
        total=len(filtered),
        counts_by_priority=counts_by_priority,
    )


# ---------------------------------------------------------------------------
# Routes for /projects/{project_id}/validation
# ---------------------------------------------------------------------------

@projects_router.post("/runs", response_model=ValidationRunDetailResponse, status_code=status.HTTP_201_CREATED)
def create_project_validation_run(
    project_id: UUID,
    payload: Optional[ValidationRunCreateRequest] = None,
    db: Session = Depends(get_db),
):
    """Trigger a validation run for a project. Returns 201 with run, stage results and readiness."""
    return _handle_create_run(project_id, payload, db)


@projects_router.get("/runs/latest", response_model=ValidationRunDetailResponse)
def get_latest_project_validation_run(
    project_id: UUID,
    db: Session = Depends(get_db),
):
    """Get the latest validation run for a project."""
    return _handle_get_latest_run(project_id, db)


@projects_router.get("/runs/{run_id}", response_model=ValidationRunDetailResponse)
def get_project_validation_run_by_id(
    project_id: UUID,
    run_id: UUID,
    db: Session = Depends(get_db),
):
    """Get a specific validation run for a project by run_id."""
    return _handle_get_run_by_id(project_id, run_id, db)


@projects_router.get("/runs", response_model=ValidationRunListResponse)
def list_project_validation_runs(
    project_id: UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """List validation runs for a project (paginated, newest first)."""
    return _handle_list_runs(project_id, limit, offset, db)


@projects_router.get("/readiness", response_model=ReadinessResponse)
def get_project_readiness(
    project_id: UUID,
    db: Session = Depends(get_db),
):
    """Get the latest readiness evaluation for a project. 404 if no run exists yet."""
    return _handle_get_readiness(project_id, db)


@projects_router.get("/runs/latest/recommendations", response_model=RunRecommendationListResponse)
def get_latest_project_recommendations(
    project_id: UUID,
    priority: Optional[str] = Query(default=None, description="Filter by priority (CRITICAL, HIGH, MEDIUM, LOW)"),
    stage: Optional[str] = Query(default=None, description="Filter by stage name"),
    db: Session = Depends(get_db),
):
    """Get recommendations from the latest validation run for a project."""
    return _handle_get_recommendations(project_id, None, priority, stage, db)


@projects_router.get("/runs/{run_id}/recommendations", response_model=RunRecommendationListResponse)
def get_project_run_recommendations(
    project_id: UUID,
    run_id: UUID,
    priority: Optional[str] = Query(default=None, description="Filter by priority (CRITICAL, HIGH, MEDIUM, LOW)"),
    stage: Optional[str] = Query(default=None, description="Filter by stage name"),
    db: Session = Depends(get_db),
):
    """Get recommendations for a specific validation run by run_id."""
    return _handle_get_recommendations(project_id, run_id, priority, stage, db)


def _handle_simulate(
    target_id: UUID,
    payload: SimulationRequest,
    db: Session,
) -> SimulationResponse:
    product = db.get(Product, target_id)
    if not product:
        raise NotFoundError(f"Project with id '{target_id}' not found")

    version = db.scalar(
        select(ProductVersion).where(
            ProductVersion.product_id == target_id,
            ProductVersion.version_number == product.current_version,
        )
    )
    if not version:
        raise NotFoundError(f"Current version for project '{target_id}' not found")

    assumptions = Assumptions.model_validate(version.assumptions)
    competitors = list(
        db.scalars(
            select(Competitor).where(Competitor.product_id == target_id).order_by(Competitor.created_at.asc())
        ).all()
    )
    evidence = list(
        db.scalars(
            select(ResearchEvidence).where(ResearchEvidence.product_id == target_id)
        ).all()
    )
    analyses = list(
        db.scalars(
            select(CompetitorAnalysis).where(CompetitorAnalysis.product_id == target_id)
        ).all()
    )

    try:
        overrides_dict = payload.overrides if payload and payload.overrides else {}
        sim_result = simulate(
            assumptions=assumptions,
            overrides=overrides_dict,
            evidence=evidence,
            competitors=competitors,
            competitor_analyses=analyses,
        )
    except SimulationValidationError as exc:
        raise ValidationError(str(exc))

    return SimulationResponse.model_validate(sim_result.to_dict())


@projects_router.post("/simulate", response_model=SimulationResponse)
def simulate_project_validation(
    project_id: UUID,
    payload: SimulationRequest,
    db: Session = Depends(get_db),
):
    """Simulate hypothetical assumption overrides without persisting runs or modifying state."""
    return _handle_simulate(project_id, payload, db)


# ---------------------------------------------------------------------------
# Routes for /products/{product_id}/validation (aliases to /projects/...)
# ---------------------------------------------------------------------------

@router.post("/validation/runs", response_model=ValidationRunDetailResponse, status_code=status.HTTP_201_CREATED)
def create_product_validation_run(
    product_id: UUID,
    payload: Optional[ValidationRunCreateRequest] = None,
    db: Session = Depends(get_db),
):
    """Trigger a validation run for a product."""
    return _handle_create_run(product_id, payload, db)


@router.get("/validation/runs/latest", response_model=ValidationRunDetailResponse)
def get_latest_product_validation_run(
    product_id: UUID,
    db: Session = Depends(get_db),
):
    """Get the latest validation run for a product."""
    return _handle_get_latest_run(product_id, db)


@router.get("/validation/runs/{run_id}", response_model=ValidationRunDetailResponse)
def get_product_validation_run_by_id(
    product_id: UUID,
    run_id: UUID,
    db: Session = Depends(get_db),
):
    """Get a specific validation run for a product."""
    return _handle_get_run_by_id(product_id, run_id, db)


@router.get("/validation/runs", response_model=ValidationRunListResponse)
def list_product_validation_runs(
    product_id: UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """List validation runs for a product (paginated, newest first)."""
    return _handle_list_runs(product_id, limit, offset, db)


@router.get("/validation/readiness", response_model=ReadinessResponse)
def get_product_readiness(
    product_id: UUID,
    db: Session = Depends(get_db),
):
    """Get the latest readiness for a product."""
    return _handle_get_readiness(product_id, db)


@router.get("/validation/runs/latest/recommendations", response_model=RunRecommendationListResponse)
def get_latest_product_recommendations(
    product_id: UUID,
    priority: Optional[str] = Query(default=None, description="Filter by priority (CRITICAL, HIGH, MEDIUM, LOW)"),
    stage: Optional[str] = Query(default=None, description="Filter by stage name"),
    db: Session = Depends(get_db),
):
    """Get recommendations from the latest validation run for a product."""
    return _handle_get_recommendations(product_id, None, priority, stage, db)


@router.get("/validation/runs/{run_id}/recommendations", response_model=RunRecommendationListResponse)
def get_product_run_recommendations(
    product_id: UUID,
    run_id: UUID,
    priority: Optional[str] = Query(default=None, description="Filter by priority (CRITICAL, HIGH, MEDIUM, LOW)"),
    stage: Optional[str] = Query(default=None, description="Filter by stage name"),
    db: Session = Depends(get_db),
):
    """Get recommendations for a specific validation run by run_id for a product."""
    return _handle_get_recommendations(product_id, run_id, priority, stage, db)


# ---------------------------------------------------------------------------
# Legacy Routes (Preserved for backwards compatibility with existing suites)
# ---------------------------------------------------------------------------

@router.post("/validate", response_model=ValidationRunResponse, status_code=status.HTTP_200_OK)
def run_validation(
    product_id: UUID,
    db: Session = Depends(get_db),
):
    """Run all 6 sequential validation stages on the latest product version."""
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")

    orchestrator = ValidationOrchestrator(db)
    validation_run = orchestrator.run_validation(product_id, trigger="initial")
    return _format_validation_run_response(validation_run)


@router.get("/validation", response_model=ValidationRunResponse)
def get_validation_results(
    product_id: UUID,
    version: Optional[int] = Query(default=None, description="Optional version number to fetch historical validation"),
    db: Session = Depends(get_db),
):
    """Get latest or specified version validation run results."""
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")

    query = select(ValidationRun).where(ValidationRun.product_id == product_id)
    if version is not None:
        target_version = db.scalar(
            select(ProductVersion).where(
                ProductVersion.product_id == product_id,
                ProductVersion.version_number == version,
            )
        )
        if not target_version:
            raise NotFoundError(f"Version {version} for product '{product_id}' not found")
        query = query.where(ValidationRun.version_id == target_version.id)

    query = query.order_by(desc(ValidationRun.started_at)).limit(1)
    run = db.scalar(query)
    if not run:
        raise NotFoundError(f"No validation run found for product '{product_id}'")

    return _format_validation_run_response(run)


@router.post("/revalidate", response_model=ValidationRunResponse)
def revalidate_stages(
    product_id: UUID,
    payload: Optional[RevalidateRequest] = None,
    db: Session = Depends(get_db),
):
    """Re-run only affected stages or explicitly requested stages."""
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")

    stages_to_run = payload.stages if payload and payload.stages else None
    orchestrator = ValidationOrchestrator(db)
    validation_run = orchestrator.run_validation(
        product_id=product_id,
        stages_to_run=stages_to_run,
        trigger="revalidation",
    )
    return _format_validation_run_response(validation_run)


@router.get("/recommendations", response_model=RecommendationListResponse)
def get_recommendations(
    product_id: UUID,
    db: Session = Depends(get_db),
):
    """Get prioritized actionable recommendations derived from validation findings."""
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")

    priority_order = {"high": 1, "medium": 2, "low": 3}
    recs = list(
        db.scalars(
            select(Recommendation)
            .where(Recommendation.product_id == product_id)
            .order_by(desc(Recommendation.created_at))
        ).all()
    )
    if not recs:
        latest_run = get_latest_run(db, product_id)
        if latest_run and latest_run.recommendations:
            import uuid as _uuid
            run_items = []
            for r in latest_run.recommendations:
                rec_id = UUID(r["id"]) if isinstance(r.get("id"), str) else (r.get("id") or _uuid.uuid4())
                ev_ids = [UUID(eid) if isinstance(eid, str) else eid for eid in r.get("evidence_ids", []) if eid]
                prio = r.get("priority", "low").lower()
                run_items.append(
                    RecommendationResponse(
                        id=rec_id,
                        product_id=latest_run.product_id,
                        version_id=latest_run.version_id,
                        stage=r.get("stage", "general"),
                        priority=prio,
                        title=r.get("title", ""),
                        detail=r.get("detail", ""),
                        evidence_ids=ev_ids,
                        created_at=latest_run.created_at,
                    )
                )
            sorted_recs = sorted(run_items, key=lambda r: priority_order.get(r.priority.lower(), 99))
            return RecommendationListResponse(items=sorted_recs)

    sorted_recs = sorted(recs, key=lambda r: priority_order.get(r.priority, 99))

    return RecommendationListResponse(
        items=[
            RecommendationResponse(
                id=r.id,
                product_id=r.product_id,
                version_id=r.version_id,
                stage=r.stage,
                priority=r.priority,  # type: ignore
                title=r.title,
                detail=r.detail,
                evidence_ids=r.evidence_ids or [],
                created_at=r.created_at,
            )
            for r in sorted_recs
        ]
    )


@router.post("/validation/simulate", response_model=SimulationResponse)
def simulate_product_validation(
    product_id: UUID,
    payload: SimulationRequest,
    db: Session = Depends(get_db),
):
    """Simulate hypothetical assumption overrides for a product."""
    return _handle_simulate(product_id, payload, db)


@router.post("/simulate", response_model=SimulationResponse)
def simulate_product_validation_direct(
    product_id: UUID,
    payload: SimulationRequest,
    db: Session = Depends(get_db),
):
    """Simulate hypothetical assumption overrides for a product directly."""
    return _handle_simulate(product_id, payload, db)


