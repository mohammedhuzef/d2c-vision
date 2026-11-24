"""Validation execution, runs, readiness, recommendations, and simulation endpoints."""

from decimal import Decimal
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.errors import NotFoundError, ValidationError
from backend.app.models.validation import ValidationRun
from backend.app.repositories.product_repository import ProductRepository
from backend.app.repositories.validation_repository import ValidationRepository
from backend.app.schemas.validation import (
    FindingResponse,
    LegacyRecommendationResponse,
    ProductValidationRequest,
    ProductValidationResponse,
    ReadinessResponse,
    RecommendationItemResponse,
    RecommendationListResponse,
    RevalidateRequest,
    RunRecommendationListResponse,
    SimulationRequest,
    SimulationResponse,
    StageResultResponse,
    ValidationRunCreateRequest,
    ValidationRunDetailResponse,
    ValidationRunListResponse,
    ValidationRunResponse,
)
from backend.app.services.ai_validation_service import validate_product_with_gemini
from backend.app.services.simulation import simulate
from backend.app.services.validation.rules_config import STAGE_ORDER
from backend.app.usecases.run_validation import run_validation_use_case

router = APIRouter(tags=["Validation"])

VALID_PRIORITIES = frozenset({"CRITICAL", "HIGH", "MEDIUM", "LOW"})
VALID_STAGES = frozenset(STAGE_ORDER)


def format_stage_result_response(r: Any) -> StageResultResponse:
    findings_data = getattr(r, "findings", []) or []
    findings_resp: List[FindingResponse] = []
    for f in findings_data:
        if hasattr(f, "code"):
            findings_resp.append(
                FindingResponse(
                    code=f.code,
                    severity=f.severity.value if hasattr(f.severity, "value") else str(f.severity),
                    message=f.message,
                    field=f.field,
                    evidence_ids=[str(e) for e in (f.evidence_ids or [])],
                )
            )
        elif isinstance(f, dict):
            findings_resp.append(
                FindingResponse(
                    code=f.get("code", "UNKNOWN"),
                    severity=f.get("severity", "info"),
                    message=f.get("message", ""),
                    field=f.get("field"),
                    evidence_ids=[str(e) for e in f.get("evidence_ids", [])],
                )
            )

    return StageResultResponse(
        stage=r.stage,
        status=r.status.value if hasattr(r.status, "value") else str(r.status),
        score=float(r.score) if r.score is not None else None,
        metrics=dict(r.metrics or {}),
        findings=findings_resp,
        inputs_used=list(r.inputs_used or []),
        upstream_stages_used=list(getattr(r, "upstream", getattr(r, "upstream_stages_used", [])) or []),
        carried_forward_from=str(r.carried_forward_from) if r.carried_forward_from else None,
    )


def format_run_response(run: ValidationRun) -> ValidationRunResponse:
    v_num = run.version.version_number if run.version else 1
    return ValidationRunResponse(
        run_id=str(run.id),
        product_id=str(run.product_id),
        version_id=str(run.version_id),
        version_number=v_num,
        trigger=run.trigger,
        stages_run=list(run.stages_run or []),
        readiness_score=float(run.readiness_score) if run.readiness_score is not None else None,
        verdict=run.verdict,
        started_at=run.started_at.isoformat() if run.started_at else "",
        finished_at=run.finished_at.isoformat() if run.finished_at else None,
        results=[format_stage_result_response(r) for r in run.results],
    )


def format_run_detail_response(run: ValidationRun) -> ValidationRunDetailResponse:
    v_num = run.version.version_number if run.version else 1
    results_list = [format_stage_result_response(r) for r in run.results]
    stage_results_dict = {r.stage: r.model_dump() for r in results_list}

    fin_snap: Optional[Dict[str, Any]] = None
    for r in run.results:
        if r.stage == "financial" and r.metrics:
            fin_snap = dict(r.metrics)
            break

    return ValidationRunDetailResponse(
        id=str(run.id),
        project_id=str(run.product_id),
        version_id=str(run.version_id),
        version_number=v_num,
        created_at=run.created_at.isoformat() if run.created_at else "",
        status=run.status,
        stages_run=list(run.stages_run or []),
        results=results_list,
        stage_results=stage_results_dict,
        financial_snapshot=fin_snap,
        readiness=run.readiness,
        recommendations=run.recommendations or [],
        input_fingerprint=run.input_fingerprint,
        started_at=run.started_at.isoformat() if run.started_at else "",
        finished_at=run.finished_at.isoformat() if run.finished_at else None,
        triggered_by=run.triggered_by,
    )


# ==========================================
# 1. Validation Execution & Runs
# ==========================================

@router.post(
    "/products/{product_id}/validate",
    response_model=ValidationRunResponse,
    status_code=200,
    summary="Run all 6 validation stages on latest product version",
)
def validate_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    product = ProductRepository.get_product(db, product_id)
    if not product:
        raise NotFoundError(f"Product {product_id} not found")

    run = run_validation_use_case(db, product_id, trigger="initial")
    return format_run_response(run)


@router.post(
    "/products/{product_id}/validation/runs",
    response_model=ValidationRunDetailResponse,
    status_code=201,
    summary="Trigger validation run with optional stages",
)
def create_validation_run(
    product_id: uuid.UUID,
    payload: Optional[ValidationRunCreateRequest] = None,
    db: Session = Depends(get_db),
):
    product = ProductRepository.get_product(db, product_id)
    if not product:
        raise NotFoundError(f"Product {product_id} not found")

    stages = payload.stages if payload else None
    trigger = payload.trigger if payload and payload.trigger else "manual"
    run = run_validation_use_case(db, product_id, trigger=trigger, stages=stages)
    return format_run_detail_response(run)


@router.get(
    "/products/{product_id}/validation",
    response_model=ValidationRunResponse,
    summary="Get validation results for product or specific version",
)
def get_validation_run_by_version(
    product_id: uuid.UUID,
    version: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
):
    product = ProductRepository.get_product(db, product_id)
    if not product:
        raise NotFoundError(f"Product {product_id} not found")

    if version is not None:
        target_version = (
            db.query(ValidationRun)
            .join(ValidationRun.version)
            .filter(
                ValidationRun.product_id == product_id,
                ValidationRun.version.has(version_number=version),
            )
            .order_by(ValidationRun.created_at.desc())
            .first()
        )
        if not target_version:
            raise NotFoundError(f"No validation run found for product {product_id} version {version}")
        return format_run_response(target_version)

    latest_run = ValidationRepository.get_latest_run(db, product_id)
    if not latest_run:
        raise NotFoundError(f"No validation run found for product {product_id}")
    return format_run_response(latest_run)


@router.get(
    "/products/{product_id}/validation/runs",
    response_model=ValidationRunListResponse,
    summary="List validation runs for product (paginated)",
)
def list_validation_runs(
    product_id: uuid.UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    product = ProductRepository.get_product(db, product_id)
    if not product:
        raise NotFoundError(f"Product {product_id} not found")

    runs, total = ValidationRepository.list_runs(db, product_id, limit=limit, offset=offset)
    items = [format_run_detail_response(r) for r in runs]
    return ValidationRunListResponse(
        items=items,
        total=total,
        limit=min(limit, 100),
        offset=offset,
    )


@router.get(
    "/products/{product_id}/validation/runs/latest",
    response_model=ValidationRunDetailResponse,
    summary="Get latest validation run details",
)
def get_latest_validation_run(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    product = ProductRepository.get_product(db, product_id)
    if not product:
        raise NotFoundError(f"Product {product_id} not found")

    latest_run = ValidationRepository.get_latest_run(db, product_id)
    if not latest_run:
        raise NotFoundError(f"No validation run found for product {product_id}")
    return format_run_detail_response(latest_run)


@router.get(
    "/products/{product_id}/validation/runs/{run_id}",
    response_model=ValidationRunDetailResponse,
    summary="Get validation run by run ID",
)
def get_validation_run_by_id(
    product_id: uuid.UUID,
    run_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    product = ProductRepository.get_product(db, product_id)
    if not product:
        raise NotFoundError(f"Product {product_id} not found")

    run = ValidationRepository.get_run(db, run_id, product_id=product_id)
    if not run:
        raise NotFoundError(f"Validation run {run_id} not found")
    return format_run_detail_response(run)


# ==========================================
# 2. Readiness Endpoint
# ==========================================

@router.get(
    "/products/{product_id}/validation/readiness",
    response_model=ReadinessResponse,
    summary="Get product launch readiness verdict and score breakdown",
)
def get_validation_readiness(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    product = ProductRepository.get_product(db, product_id)
    if not product:
        raise NotFoundError(f"Product {product_id} not found")

    latest_run = ValidationRepository.get_latest_run(db, product_id)
    if not latest_run or not latest_run.readiness:
        raise NotFoundError(f"No validation run found for product {product_id}")

    r = latest_run.readiness
    return ReadinessResponse(
        label=r.get("label", latest_run.verdict),
        overall_score=r.get("score"),
        breakdown=r.get("breakdown"),
        blocking_stages=r.get("blocking_stages"),
        warning_stages=r.get("warning_stages"),
        missing_stages=r.get("missing_stages"),
    )


# ==========================================
# 3. Recommendations Endpoints
# ==========================================

def _filter_run_recommendations(
    run: ValidationRun,
    priority: Optional[str] = None,
    stage: Optional[str] = None,
) -> RunRecommendationListResponse:
    if priority is not None:
        p_upper = priority.upper()
        if p_upper not in VALID_PRIORITIES:
            raise ValidationError(f"Invalid priority filter '{priority}'. Must be one of {sorted(VALID_PRIORITIES)}")
        priority = p_upper

    if stage is not None and stage not in VALID_STAGES:
        raise ValidationError(f"Invalid stage filter '{stage}'. Must be one of {sorted(VALID_STAGES)}")

    all_recs = run.recommendations or []
    filtered = []
    counts_by_priority = {p: 0 for p in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]}

    for item in all_recs:
        item_pri = str(item.get("priority", "")).upper()
        if item_pri in counts_by_priority:
            counts_by_priority[item_pri] += 1

        if priority and item_pri != priority:
            continue
        if stage and item.get("stage") != stage:
            continue

        filtered.append(
            RecommendationItemResponse(
                id=item.get("id", str(uuid.uuid4())),
                code=item.get("code", "UNKNOWN"),
                stage=item.get("stage", ""),
                priority=item_pri,
                title=item.get("title", ""),
                detail=item.get("detail", ""),
                action_type=item.get("action_type", "REVIEW_ASSUMPTION"),
                target_field=item.get("target_field"),
                current_value=item.get("current_value"),
                suggested_value=item.get("suggested_value"),
                finding_codes=item.get("finding_codes", []),
                evidence_ids=item.get("evidence_ids", []),
                impact=item.get("impact", {}),
            )
        )

    return RunRecommendationListResponse(
        run_id=str(run.id),
        project_id=str(run.product_id),
        items=filtered,
        total=len(filtered),
        counts_by_priority=counts_by_priority,
    )


@router.get(
    "/products/{product_id}/validation/runs/latest/recommendations",
    response_model=RunRecommendationListResponse,
    summary="Get recommendations from latest validation run",
)
def get_latest_run_recommendations(
    product_id: uuid.UUID,
    priority: Optional[str] = Query(default=None),
    stage: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    product = ProductRepository.get_product(db, product_id)
    if not product:
        raise NotFoundError(f"Product {product_id} not found")

    latest_run = ValidationRepository.get_latest_run(db, product_id)
    if not latest_run:
        raise NotFoundError(f"No validation run found for product {product_id}")

    return _filter_run_recommendations(latest_run, priority=priority, stage=stage)


@router.get(
    "/products/{product_id}/validation/runs/{run_id}/recommendations",
    response_model=RunRecommendationListResponse,
    summary="Get recommendations for specific validation run",
)
def get_run_recommendations(
    product_id: uuid.UUID,
    run_id: uuid.UUID,
    priority: Optional[str] = Query(default=None),
    stage: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    product = ProductRepository.get_product(db, product_id)
    if not product:
        raise NotFoundError(f"Product {product_id} not found")

    run = ValidationRepository.get_run(db, run_id, product_id=product_id)
    if not run:
        raise NotFoundError(f"Validation run {run_id} not found")

    return _filter_run_recommendations(run, priority=priority, stage=stage)


@router.get(
    "/products/{product_id}/recommendations",
    response_model=RecommendationListResponse,
    summary="List product recommendations (legacy table shape)",
)
def get_legacy_recommendations(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    product = ProductRepository.get_product(db, product_id)
    if not product:
        raise NotFoundError(f"Product {product_id} not found")

    rows = ValidationRepository.list_legacy_recommendations(db, product_id)
    items = [
        LegacyRecommendationResponse(
            id=str(row.id),
            product_id=str(row.product_id),
            version_id=str(row.version_id),
            stage=row.stage,
            priority=row.priority,
            title=row.title,
            detail=row.detail,
            evidence_ids=[str(e) for e in (row.evidence_ids or [])],
            created_at=row.created_at.isoformat() if row.created_at else "",
        )
        for row in rows
    ]
    return RecommendationListResponse(items=items)


# ==========================================
# 4. Revalidate Endpoints
# ==========================================

@router.post(
    "/products/{product_id}/revalidate",
    response_model=ValidationRunResponse,
    summary="Revalidate product assumptions with carry-forward",
)
@router.post(
    "/products/{product_id}/validation/revalidate",
    response_model=ValidationRunResponse,
    include_in_schema=True,
)
def revalidate_product(
    product_id: uuid.UUID,
    payload: Optional[RevalidateRequest] = None,
    db: Session = Depends(get_db),
):
    product = ProductRepository.get_product(db, product_id)
    if not product:
        raise NotFoundError(f"Product {product_id} not found")

    stages = payload.stages if payload else None
    run = run_validation_use_case(db, product_id, trigger="revalidate", stages=stages)
    return format_run_response(run)


# ==========================================
# 5. Simulation Endpoints (Stateless)
# ==========================================

@router.post(
    "/products/{product_id}/simulate",
    response_model=SimulationResponse,
    summary="Simulate what-if changes against product assumptions (stateless)",
)
@router.post(
    "/products/{product_id}/validation/simulate",
    response_model=SimulationResponse,
    include_in_schema=True,
)
def simulate_validation(
    product_id: uuid.UUID,
    payload: SimulationRequest,
    db: Session = Depends(get_db),
):
    product, version, assumptions, evidence_dicts, analysis_dicts = ValidationRepository.load_inputs(
        db=db,
        product_id=product_id,
    )

    overrides = payload.overrides or payload.modifications or {}
    try:
        sim_result = simulate(
            assumptions=assumptions,
            overrides=overrides,
            evidence=evidence_dicts,
            competitor_analyses=analysis_dicts,
        )
    except ValueError as e:
        raise ValidationError(str(e))

    sim_readiness = sim_result.get("simulated", {}).get("readiness", {})
    sim_label = sim_readiness.get("label")
    sim_score = None
    if sim_readiness.get("score") is not None:
        sim_score = str(sim_readiness.get("score"))

    return SimulationResponse(
        baseline=sim_result["baseline"],
        simulated=sim_result["simulated"],
        deltas=sim_result.get("deltas"),
        changes=sim_result.get("changes"),
        simulated_label=sim_label,
        simulated_score=sim_score,
    )


# ==========================================
# 6. /projects/{project_id}/... Aliases
# ==========================================

@router.get(
    "/projects/{project_id}/validation/readiness",
    response_model=ReadinessResponse,
    summary="Get project launch readiness verdict and score breakdown (alias)",
)
def get_project_validation_readiness(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    return get_validation_readiness(product_id=project_id, db=db)


@router.get(
    "/projects/{project_id}/validation/runs",
    response_model=ValidationRunListResponse,
    summary="List validation runs for project (alias)",
)
def list_project_validation_runs(
    project_id: uuid.UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return list_validation_runs(product_id=project_id, limit=limit, offset=offset, db=db)


@router.post(
    "/projects/{project_id}/validation/runs",
    response_model=ValidationRunDetailResponse,
    status_code=201,
    summary="Trigger validation run for project (alias)",
)
def create_project_validation_run(
    project_id: uuid.UUID,
    payload: Optional[ValidationRunCreateRequest] = None,
    db: Session = Depends(get_db),
):
    return create_validation_run(product_id=project_id, payload=payload, db=db)


@router.get(
    "/projects/{project_id}/validation/runs/latest",
    response_model=ValidationRunDetailResponse,
    summary="Get latest validation run details for project (alias)",
)
def get_latest_project_validation_run(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    return get_latest_validation_run(product_id=project_id, db=db)


@router.get(
    "/projects/{project_id}/validation/runs/latest/recommendations",
    response_model=RunRecommendationListResponse,
    summary="Get recommendations from latest validation run for project (alias)",
)
def get_latest_project_run_recommendations(
    project_id: uuid.UUID,
    priority: Optional[str] = Query(default=None),
    stage: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    return get_latest_run_recommendations(product_id=project_id, priority=priority, stage=stage, db=db)


@router.get(
    "/projects/{project_id}/validation/runs/{run_id}",
    response_model=ValidationRunDetailResponse,
    summary="Get validation run by run ID for project (alias)",
)
def get_project_validation_run_by_id(
    project_id: uuid.UUID,
    run_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    return get_validation_run_by_id(product_id=project_id, run_id=run_id, db=db)


@router.get(
    "/projects/{project_id}/validation/runs/{run_id}/recommendations",
    response_model=RunRecommendationListResponse,
    summary="Get recommendations for specific validation run for project (alias)",
)
def get_project_run_recommendations(
    project_id: uuid.UUID,
    run_id: uuid.UUID,
    priority: Optional[str] = Query(default=None),
    stage: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    return get_run_recommendations(product_id=project_id, run_id=run_id, priority=priority, stage=stage, db=db)


@router.post(
    "/projects/{project_id}/validation/simulate",
    response_model=SimulationResponse,
    summary="Simulate what-if changes against project assumptions (alias)",
)
def simulate_project_validation(
    project_id: uuid.UUID,
    payload: SimulationRequest,
    db: Session = Depends(get_db),
):
    return simulate_validation(product_id=project_id, payload=payload, db=db)


@router.post(
    "/validation/ai-feasibility",
    response_model=ProductValidationResponse,
    status_code=200,
    summary="Validate product concept specifications using Google Gemini API",
)
def ai_validate_product_feasibility(
    payload: ProductValidationRequest,
) -> ProductValidationResponse:
    """Synthesizes structured 8-dimension feasibility intelligence with Google Gemini API."""
    report = validate_product_with_gemini(payload.model_dump())
    return ProductValidationResponse(**report)


@router.post(
    "/products/ai-validate",
    response_model=ProductValidationResponse,
    status_code=200,
    summary="Validate product concept specifications using Google Gemini API (alias)",
)
def ai_validate_product_alias(
    payload: ProductValidationRequest,
) -> ProductValidationResponse:
    """Alias for /validation/ai-feasibility."""
    report = validate_product_with_gemini(payload.model_dump())
    return ProductValidationResponse(**report)


