import uuid
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.core.errors import ConflictError, NotFoundError
from backend.app.models.analysis import CompetitorAnalysis
from backend.app.models.competitor import Competitor
from backend.app.models.evidence import ResearchEvidence, compute_evidence_content_hash
from backend.app.models.product import Product
from backend.app.models.research_run import ResearchRun
from backend.app.schemas.research import (
    CompetitorOutcome,
    ResearchIngestRequest,
    ResearchIngestResponse,
    ResearchRunListResponse,
    ResearchRunResponse,
    ResearchStartResponse,
    ResearchStatusResponse,
)
from backend.app.services.research_provider import MockResearchProvider


def ingest_research_data(
    db: Session, request: ResearchIngestRequest
) -> ResearchIngestResponse:
    product = db.get(Product, request.product_id)
    if not product:
        raise NotFoundError(f"Product '{request.product_id}' not found")

    ev_inserted = 0
    created_evidence_ids: List[uuid.UUID] = []

    for ev_in in request.evidence:
        c_hash = compute_evidence_content_hash(ev_in.source_url, ev_in.excerpt)

        # Idempotent deduplication check on (product_id, content_hash)
        existing_ev = db.execute(
            select(ResearchEvidence).where(
                ResearchEvidence.product_id == request.product_id,
                ResearchEvidence.content_hash == c_hash,
            )
        ).scalars().first()

        if existing_ev:
            continue

        # Confidence capping: manual = 1.00, AI capped at 0.80
        if ev_in.source_type == "manual":
            conf = Decimal("1.00")
        else:
            if ev_in.confidence is not None:
                try:
                    raw_conf = Decimal(str(ev_in.confidence))
                    conf = min(raw_conf, Decimal("0.80"))
                except (InvalidOperation, TypeError):
                    conf = Decimal("0.80")
            else:
                conf = Decimal("0.80")

        new_ev_id = uuid.uuid4()
        new_ev = ResearchEvidence(
            id=new_ev_id,
            product_id=request.product_id,
            competitor_id=request.competitor_id,
            content_hash=c_hash,
            source_type=ev_in.source_type,
            source_url=ev_in.source_url,
            title=ev_in.title,
            excerpt=ev_in.excerpt,
            confidence=conf,
            data=ev_in.data or {},
        )
        db.add(new_ev)
        created_evidence_ids.append(new_ev_id)
        ev_inserted += 1

    analyses_inserted = 0
    for a_in in request.analyses:
        price_val = None
        if a_in.price_observed is not None:
            try:
                price_val = Decimal(str(a_in.price_observed))
            except (InvalidOperation, TypeError):
                price_val = None

        comp_id = a_in.competitor_id or request.competitor_id
        ev_ids = [uuid.UUID(str(x)) for x in a_in.evidence_ids] if a_in.evidence_ids else created_evidence_ids

        new_analysis = CompetitorAnalysis(
            id=uuid.uuid4(),
            product_id=request.product_id,
            competitor_id=comp_id,
            summary=a_in.summary,
            strengths=a_in.strengths or [],
            weaknesses=a_in.weaknesses or [],
            price_observed=price_val,
            evidence_ids=ev_ids,
            produced_by=a_in.produced_by or "mock",
        )
        db.add(new_analysis)
        analyses_inserted += 1

    db.commit()

    return ResearchIngestResponse(
        status="success",
        evidence_inserted=ev_inserted,
        analyses_inserted=analyses_inserted,
    )


def start_research_run(
    db: Session, product_id: uuid.UUID, provider_name: str = "mock"
) -> ResearchStartResponse:
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product '{product_id}' not found")

    # Conflict check: 409 if a run is already active
    active_run = db.execute(
        select(ResearchRun).where(
            ResearchRun.product_id == product_id,
            ResearchRun.status.in_(["queued", "running"]),
        )
    ).scalars().first()

    if active_run:
        raise ConflictError(
            f"An active research run '{active_run.id}' is already in progress for product '{product_id}'"
        )

    run_id = uuid.uuid4()
    run = ResearchRun(
        id=run_id,
        product_id=product_id,
        status="running",
        provider=provider_name,
        evidence_count=0,
        started_at=datetime.now(timezone.utc),
    )
    db.add(run)
    db.commit()

    # Execute mock research synchronously for deterministic reliability
    try:
        competitors = (
            db.execute(
                select(Competitor).where(Competitor.product_id == product_id)
            )
            .scalars()
            .all()
        )

        p_data = {"id": str(product.id), "name": product.name}
        comps_data = [
            {"id": str(c.id), "name": c.name, "website_url": c.website_url}
            for c in competitors
        ]

        provider = MockResearchProvider()
        result = provider.research(p_data, comps_data)

        # Ingest extracted evidence
        ingest_count = 0
        for ev in result.evidence:
            c_hash = compute_evidence_content_hash(ev.source_url, ev.excerpt)
            exists = db.execute(
                select(ResearchEvidence).where(
                    ResearchEvidence.product_id == product_id,
                    ResearchEvidence.content_hash == c_hash,
                )
            ).scalars().first()

            if not exists:
                c_uuid = uuid.UUID(ev.competitor_id) if ev.competitor_id else None
                new_ev = ResearchEvidence(
                    id=uuid.uuid4(),
                    product_id=product_id,
                    competitor_id=c_uuid,
                    content_hash=c_hash,
                    source_type=ev.source_type,
                    source_url=ev.source_url,
                    title=ev.title,
                    excerpt=ev.excerpt,
                    confidence=ev.confidence,
                    data=ev.data,
                )
                db.add(new_ev)
                ingest_count += 1

        # Ingest analyses
        for a in result.analyses:
            c_uuid = uuid.UUID(a.competitor_id) if a.competitor_id else None
            new_analysis = CompetitorAnalysis(
                id=uuid.uuid4(),
                product_id=product_id,
                competitor_id=c_uuid,
                summary=a.summary,
                strengths=a.strengths,
                weaknesses=a.weaknesses,
                price_observed=a.price_observed,
                evidence_ids=[],
                produced_by=a.produced_by,
            )
            db.add(new_analysis)

        run.status = "completed"
        run.evidence_count = ingest_count
        run.finished_at = datetime.now(timezone.utc)
        db.commit()

        return ResearchStartResponse(
            research_id=run.id,
            status=run.status,
            evidence_count=run.evidence_count,
        )
    except Exception as exc:
        db.rollback()
        # Mark run as failed with safe message, never a stack trace
        run_record = db.get(ResearchRun, run_id)
        if run_record:
            run_record.status = "failed"
            run_record.errors = {"message": "Research provider execution encountered an error"}
            run_record.finished_at = datetime.now(timezone.utc)
            db.commit()
        return ResearchStartResponse(
            research_id=run_id,
            status="failed",
            evidence_count=0,
        )


def get_research_run(
    db: Session, product_id: uuid.UUID, research_id: uuid.UUID
) -> ResearchStatusResponse:
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product '{product_id}' not found")

    run = db.execute(
        select(ResearchRun).where(
            ResearchRun.id == research_id, ResearchRun.product_id == product_id
        )
    ).scalars().first()

    if not run:
        raise NotFoundError(
            f"Research run '{research_id}' not found for product '{product_id}'"
        )

    competitors = (
        db.execute(select(Competitor).where(Competitor.product_id == product_id))
        .scalars()
        .all()
    )

    outcomes = []
    for c in competitors:
        ev_count = (
            db.execute(
                select(func.count(ResearchEvidence.id)).where(
                    ResearchEvidence.competitor_id == c.id
                )
            ).scalar()
            or 0
        )
        outcomes.append(
            CompetitorOutcome(
                competitor_id=c.id,
                status="completed" if run.status == "completed" else run.status,
                error_code=None,
                evidence_count=ev_count,
            )
        )

    return ResearchStatusResponse(
        research_id=run.id,
        status=run.status,
        evidence_count=run.evidence_count,
        competitor_count=len(competitors),
        competitor_outcomes=outcomes,
        provider=run.provider,
        errors=run.errors,
    )


def list_research_runs(
    db: Session, product_id: uuid.UUID, limit: int = 20, offset: int = 0
) -> ResearchRunListResponse:
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product '{product_id}' not found")

    base_query = select(ResearchRun).where(ResearchRun.product_id == product_id)
    total = (
        db.execute(select(func.count()).select_from(base_query.subquery())).scalar()
        or 0
    )

    runs = (
        db.execute(
            base_query.order_by(ResearchRun.started_at.desc())
            .offset(offset)
            .limit(limit)
        )
        .scalars()
        .all()
    )

    run_responses = [
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
        items=run_responses,
        total=total,
        limit=limit,
        offset=offset,
    )
