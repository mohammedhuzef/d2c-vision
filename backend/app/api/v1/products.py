import uuid
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.errors import NotFoundError
from backend.app.models.product import Product
from backend.app.models.version import ProductVersion
from backend.app.models.validation import ValidationRun
from backend.app.schemas.assumptions import Assumptions
from backend.app.schemas.product import (
    ProductCreate,
    ProductResponse,
    ProductDetailResponse,
    ProductListResponse,
)
from backend.app.schemas.impact import (
    AssumptionsPatchRequest,
    AssumptionsPatchResponse,
)

router = APIRouter(prefix="/products", tags=["Products"])


from decimal import Decimal
from backend.app.core.errors import NotFoundError, ValidationError
from backend.app.services.versioning import create_initial_version, get_latest_version


def _validate_assumptions_non_negative(assumptions: Optional[Assumptions]) -> None:
    if not assumptions:
        return
    details = []
    p = assumptions.pricing
    if p and p.selling_price is not None and p.selling_price < Decimal("0.00"):
        details.append({"field": "assumptions.pricing.selling_price", "issue": "Price cannot be negative"})

    pkg = assumptions.packaging
    if pkg and pkg.packaging_cost is not None and pkg.packaging_cost < Decimal("0.00"):
        details.append({"field": "assumptions.packaging.packaging_cost", "issue": "Packaging cost cannot be negative"})

    c = assumptions.costs
    if c:
        if c.cogs_per_unit is not None and c.cogs_per_unit < Decimal("0.00"):
            details.append({"field": "assumptions.costs.cogs_per_unit", "issue": "COGS cannot be negative"})
        if c.shipping_cost_per_unit is not None and c.shipping_cost_per_unit < Decimal("0.00"):
            details.append({"field": "assumptions.costs.shipping_cost_per_unit", "issue": "Shipping cost cannot be negative"})
        if c.packaging_cost is not None and c.packaging_cost < Decimal("0.00"):
            details.append({"field": "assumptions.costs.packaging_cost", "issue": "Packaging cost cannot be negative"})
        if c.fixed_costs_total is not None and c.fixed_costs_total < Decimal("0.00"):
            details.append({"field": "assumptions.costs.fixed_costs_total", "issue": "Fixed costs cannot be negative"})

    m = assumptions.marketing
    if m:
        if m.monthly_budget is not None and m.monthly_budget < Decimal("0.00"):
            details.append({"field": "assumptions.marketing.monthly_budget", "issue": "Monthly budget cannot be negative"})
        if m.expected_cac is not None and m.expected_cac < Decimal("0.00"):
            details.append({"field": "assumptions.marketing.expected_cac", "issue": "Expected CAC cannot be negative"})

    if details:
        raise ValidationError(message="Assumptions validation failed", details=details)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
):
    """Create a new product with initial immutable version 1."""
    _validate_assumptions_non_negative(payload.assumptions)
    product_id = uuid.uuid4()

    new_product = Product(
        id=product_id,
        name=payload.name,
        description=payload.description,
        category=payload.category,
        target_market=payload.target_market,
        current_version=1,
        status="draft",
    )
    db.add(new_product)

    create_initial_version(
        product=new_product,
        assumptions=payload.assumptions or Assumptions(),
        db=db,
    )

    db.commit()
    db.refresh(new_product)
    return _enrich_product_models([new_product], db)[0]


from collections import defaultdict
from backend.app.core.config import settings
from backend.app.models.competitor import Competitor
from backend.app.models.evidence import ResearchEvidence
from backend.app.models.research_run import ResearchRun
from backend.app.models.impact import ImpactEvent
from backend.app.schemas.impact import ImpactEventListResponse, ImpactEventResponse
from backend.app.schemas.evidence import EvidenceListResponse, EvidenceResponse
from backend.app.schemas.product import LatestReadiness
from backend.app.services.validation.base import STAGE_ORDER
from backend.app.services.validation import rules_config
from sqlalchemy.orm import selectinload, joinedload


def _enrich_product_models(products: list, db: Session) -> list:
    if not products:
        return []

    product_ids = [p.id for p in products]

    runs = list(
        db.scalars(
            select(ValidationRun)
            .options(selectinload(ValidationRun.results), joinedload(ValidationRun.version))
            .where(ValidationRun.product_id.in_(product_ids))
            .order_by(ValidationRun.started_at.desc())
        ).all()
    )
    latest_runs = {}
    for r in runs:
        if r.product_id not in latest_runs:
            latest_runs[r.product_id] = r

    comp_rows = db.execute(
        select(
            Competitor.id,
            Competitor.product_id,
            func.count(ResearchEvidence.id).label("ev_count")
        )
        .outerjoin(ResearchEvidence, ResearchEvidence.competitor_id == Competitor.id)
        .where(Competitor.product_id.in_(product_ids))
        .group_by(Competitor.id, Competitor.product_id)
    ).all()

    competitors_by_prod = defaultdict(list)
    for row in comp_rows:
        competitors_by_prod[row.product_id].append(row.ev_count)

    research_runs = list(
        db.scalars(
            select(ResearchRun)
            .where(ResearchRun.product_id.in_(product_ids))
            .order_by(ResearchRun.started_at.desc())
        ).all()
    )
    latest_research = {}
    for rr in research_runs:
        if rr.product_id not in latest_research:
            latest_research[rr.product_id] = rr

    responses = []
    for p in products:
        run = latest_runs.get(p.id)
        stage_statuses = {stage: "NOT_RUN" for stage in STAGE_ORDER}
        validated_version = None
        latest_readiness = None

        if run:
            validated_version = run.version.version_number if run.version else 1
            if run.results:
                for res in run.results:
                    stage_statuses[res.stage] = res.status
            readiness_label = run.verdict
            readiness_score = run.readiness_score
            if run.readiness and isinstance(run.readiness, dict):
                readiness_label = run.readiness.get("label", readiness_label)
                readiness_score = run.readiness.get("overall_score", readiness_score)
            latest_readiness = LatestReadiness(
                label=readiness_label,
                overall_score=readiness_score,
            )

        revalidation_required = (
            (p.current_version > validated_version)
            if validated_version is not None
            else False
        )

        comps = competitors_by_prod.get(p.id, [])
        competitors_count = len(comps)
        missing_evidence_count = sum(
            1 for c_ev in comps if c_ev < rules_config.COMPETITOR_MIN_EVIDENCE_PER_COMPETITOR
        )

        rr = latest_research.get(p.id)
        research_provider = rr.provider if rr else settings.RESEARCH_PROVIDER

        responses.append(
            ProductResponse(
                id=p.id,
                name=p.name,
                description=p.description,
                category=p.category,
                target_market=p.target_market,
                current_version=p.current_version,
                status=p.status,
                created_at=p.created_at,
                validated_version=validated_version,
                revalidation_required=revalidation_required,
                latest_readiness=latest_readiness,
                stage_statuses=stage_statuses,
                competitors_count=competitors_count,
                missing_evidence_count=missing_evidence_count,
                research_provider=research_provider,
            )
        )
    return responses


@router.get("", response_model=ProductListResponse)
def list_products(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """List products with pagination."""
    total = db.scalar(select(func.count(Product.id))) or 0
    query = (
        select(Product)
        .order_by(Product.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    products = list(db.scalars(query).all())
    items = _enrich_product_models(products, db)
    return ProductListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{product_id}", response_model=ProductDetailResponse)
def get_product(
    product_id: UUID,
    db: Session = Depends(get_db),
):
    """Get a product with latest assumptions and stage status summary."""
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")

    latest_version = get_latest_version(product_id, db)
    assumptions_data = (
        Assumptions.model_validate(latest_version.assumptions)
        if latest_version
        else Assumptions()
    )

    enriched = _enrich_product_models([product], db)[0]

    return ProductDetailResponse(
        id=enriched.id,
        name=enriched.name,
        description=enriched.description,
        category=enriched.category,
        target_market=enriched.target_market,
        current_version=enriched.current_version,
        status=enriched.status,
        created_at=enriched.created_at,
        validated_version=enriched.validated_version,
        revalidation_required=enriched.revalidation_required,
        latest_readiness=enriched.latest_readiness,
        stage_statuses=enriched.stage_statuses,
        competitors_count=enriched.competitors_count,
        missing_evidence_count=enriched.missing_evidence_count,
        research_provider=enriched.research_provider,
        assumptions=assumptions_data,
    )


@router.get("/{product_id}/impact-events", response_model=ImpactEventListResponse)
def list_product_impact_events(
    product_id: UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """Get paginated impact events for a product, newest first."""
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")

    total = db.scalar(
        select(func.count(ImpactEvent.id)).where(ImpactEvent.product_id == product_id)
    ) or 0
    items = list(
        db.scalars(
            select(ImpactEvent)
            .where(ImpactEvent.product_id == product_id)
            .order_by(ImpactEvent.created_at.desc())
            .offset(offset)
            .limit(limit)
        ).all()
    )
    return ImpactEventListResponse(
        items=[ImpactEventResponse.model_validate(it) for it in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{product_id}/evidence", response_model=EvidenceListResponse)
def list_product_evidence(
    product_id: UUID,
    competitor_id: Optional[UUID] = Query(default=None),
    source_type: Optional[str] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """Get research evidence for a product, optionally filtered by competitor_id or source_type."""
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")

    query = select(ResearchEvidence).where(ResearchEvidence.product_id == product_id)
    if competitor_id:
        query = query.where(ResearchEvidence.competitor_id == competitor_id)
    if source_type:
        query = query.where(ResearchEvidence.source_type == source_type)

    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    items = list(
        db.scalars(
            query.order_by(ResearchEvidence.retrieved_at.desc(), ResearchEvidence.created_at.desc())
            .offset(offset)
            .limit(limit)
        ).all()
    )
    return EvidenceListResponse(
        items=[EvidenceResponse.model_validate(it) for it in items],
        total=total,
        limit=limit,
        offset=offset,
    )



from backend.app.services.impact_tracker import apply_assumptions_change


@router.patch("/{product_id}/assumptions", response_model=AssumptionsPatchResponse)
def patch_assumptions(
    product_id: UUID,
    payload: AssumptionsPatchRequest,
    db: Session = Depends(get_db),
):
    """Patch product assumptions, trigger impact analysis, and optionally revalidate."""
    product = db.scalar(
        select(Product).where(Product.id == product_id).with_for_update()
    )
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")

    resp, _ = apply_assumptions_change(
        product=product,
        patch=payload.patch,
        revalidate=payload.revalidate,
        db=db,
    )
    return resp

