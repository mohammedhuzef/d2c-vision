import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.errors import NotFoundError, ConflictError
from backend.app.models.product import Product
from backend.app.models.competitor import Competitor
from backend.app.models.evidence import ResearchEvidence, compute_evidence_content_hash
from backend.app.models.analysis import CompetitorAnalysis
from backend.app.models.research_run import ResearchRun
from backend.app.schemas.research import (
    CompetitorOutcome,
    ResearchStartResponse,
    ResearchStatusResponse,
    ResearchRunResponse,
    ResearchRunListResponse,
)
from backend.app.services.research_provider import (
    ProductSummary,
    CompetitorSummary,
    ResearchProvider,
    get_research_provider,
)

router = APIRouter(prefix="/products/{product_id}/research", tags=["Research"])


@router.post("", response_model=ResearchStartResponse, status_code=status.HTTP_202_ACCEPTED)
def start_research(
    product_id: UUID,
    provider: ResearchProvider = Depends(get_research_provider),
    db: Session = Depends(get_db),
):
    """
    Trigger research provider (mock or AI) and persist evidence, analyses, and a research_run record.
    Synchronous in v1, shaped for async job polling.
    """
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")

    active_run = db.scalar(
        select(ResearchRun).where(
            ResearchRun.product_id == product_id,
            ResearchRun.status.in_(["running", "pending"]),
        )
    )
    if active_run:
        raise ConflictError(
            f"A research run is already in progress for product '{product_id}'",
            details=[{"field": "research_id", "issue": str(active_run.id)}],
        )

    competitors = list(
        db.scalars(
            select(Competitor)
            .where(Competitor.product_id == product_id)
            .order_by(Competitor.created_at.asc())
        ).all()
    )

    prod_summary = ProductSummary(
        id=product.id,
        name=product.name,
        category=product.category,
        target_market=product.target_market,
    )
    comp_summaries = [
        CompetitorSummary(
            id=c.id,
            name=c.name,
            website_url=c.website_url,
            notes=c.notes,
        )
        for c in competitors
    ]

    started_at = datetime.now(timezone.utc)
    output = provider.research(prod_summary, comp_summaries)

    # Ingest output evidence idempotently via content_hash
    existing_hashes = set(
        db.scalars(
            select(ResearchEvidence.content_hash).where(ResearchEvidence.product_id == product_id)
        ).all()
    )

    created_evidence_ids = []
    evidence_inserted = 0

    for ev_in in output.evidence:
        ev_hash = compute_evidence_content_hash(ev_in.source_url, ev_in.excerpt)
        if ev_hash in existing_hashes:
            continue

        # Associate with competitor if matching
        cid = None
        for c in competitors:
            if c.name.lower() in (ev_in.title + " " + ev_in.excerpt).lower():
                cid = c.id
                break

        new_ev_id = uuid.uuid4()
        new_ev = ResearchEvidence(
            id=new_ev_id,
            product_id=product_id,
            competitor_id=cid,
            content_hash=ev_hash,
            source_type=ev_in.source_type,
            source_url=ev_in.source_url,
            title=ev_in.title,
            excerpt=ev_in.excerpt,
            confidence=Decimal(str(ev_in.confidence)) if ev_in.confidence is not None else None,
            data=ev_in.data or {},
        )
        db.add(new_ev)
        existing_hashes.add(ev_hash)
        created_evidence_ids.append(new_ev_id)
        evidence_inserted += 1

    # Ingest analyses
    for an_in in output.analyses:
        new_an = CompetitorAnalysis(
            id=uuid.uuid4(),
            product_id=product_id,
            competitor_id=an_in.competitor_id,
            summary=an_in.summary,
            strengths=an_in.strengths,
            weaknesses=an_in.weaknesses,
            price_observed=Decimal(str(an_in.price_observed)) if an_in.price_observed is not None else None,
            evidence_ids=[uuid.UUID(str(e)) for e in an_in.evidence_ids] if an_in.evidence_ids else created_evidence_ids,
            produced_by=an_in.produced_by,
        )
        db.add(new_an)

    # Record research_run
    reported_provider = getattr(provider, "provider_name", settings.RESEARCH_PROVIDER)
    run_status = output.run_status or ("completed" if evidence_inserted > 0 or not competitors else "completed")
    errors_payload = None
    if output.competitor_outcomes:
        errors_payload = {
            "competitor_outcomes": [
                {
                    "competitor_id": str(o.competitor_id),
                    "status": o.status,
                    "error_code": o.error_code,
                    "evidence_count": o.evidence_count,
                }
                for o in output.competitor_outcomes
            ]
        }

    research_id = uuid.uuid4()
    research_run = ResearchRun(
        id=research_id,
        product_id=product_id,
        status=run_status,
        evidence_count=evidence_inserted,
        started_at=started_at,
        finished_at=datetime.now(timezone.utc),
        provider=reported_provider,
        errors=errors_payload,
    )
    db.add(research_run)

    db.commit()

    return ResearchStartResponse(
        research_id=research_run.id,
        status=research_run.status,
        evidence_count=research_run.evidence_count,
    )


@router.get("", response_model=ResearchRunListResponse)
def list_research_runs(
    product_id: UUID,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """List research runs for a product."""
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")

    total = db.scalar(
        select(func.count(ResearchRun.id)).where(ResearchRun.product_id == product_id)
    ) or 0
    runs = list(
        db.scalars(
            select(ResearchRun)
            .where(ResearchRun.product_id == product_id)
            .order_by(ResearchRun.started_at.desc())
            .offset(offset)
            .limit(limit)
        ).all()
    )
    items = [
        ResearchRunResponse(
            id=r.id,
            product_id=r.product_id,
            status=r.status,
            provider=r.provider,
            evidence_count=r.evidence_count,
            started_at=r.started_at,
            finished_at=r.finished_at,
            errors=r.errors,
        )
        for r in runs
    ]
    return ResearchRunListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{research_id}", response_model=ResearchStatusResponse)
def get_research_status(
    product_id: UUID,
    research_id: UUID,
    db: Session = Depends(get_db),
):
    """Get status and counts of evidence and competitors for a research job by research_runs ID."""
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")

    run = db.scalar(
        select(ResearchRun).where(
            ResearchRun.id == research_id,
            ResearchRun.product_id == product_id,
        )
    )
    if not run:
        raise NotFoundError(f"Research run with id '{research_id}' not found")

    comp_count = db.scalar(
        select(func.count(Competitor.id)).where(Competitor.product_id == product_id)
    ) or 0

    outcomes: List[CompetitorOutcome] = []
    if run.errors and isinstance(run.errors, dict) and "competitor_outcomes" in run.errors:
        for item in run.errors["competitor_outcomes"]:
            try:
                outcomes.append(
                    CompetitorOutcome(
                        competitor_id=UUID(str(item["competitor_id"])),
                        status=str(item["status"]),
                        error_code=item.get("error_code"),
                        evidence_count=int(item.get("evidence_count", 0)),
                    )
                )
            except Exception:
                pass

    return ResearchStatusResponse(
        research_id=run.id,
        status=run.status,
        evidence_count=run.evidence_count,
        competitor_count=comp_count,
        competitor_outcomes=outcomes,
    )
