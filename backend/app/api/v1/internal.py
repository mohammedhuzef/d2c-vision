import hashlib
import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.errors import NotFoundError
from backend.app.models.product import Product
from backend.app.models.competitor import Competitor
from backend.app.models.evidence import ResearchEvidence, compute_evidence_content_hash
from backend.app.models.analysis import CompetitorAnalysis
from backend.app.schemas.research import (
    ResearchIngestRequest,
    ResearchIngestResponse,
)

router = APIRouter(prefix="/internal", tags=["Internal / Member 3"])


@router.post("/research-results", response_model=ResearchIngestResponse, status_code=status.HTTP_201_CREATED)
def ingest_research_results(
    payload: ResearchIngestRequest,
    db: Session = Depends(get_db),
):
    """
    Ingest research results directly from Member 3's AI pipeline.
    Idempotent on (product_id, content_hash).
    """
    product = db.get(Product, payload.product_id)
    if not product:
        raise NotFoundError(f"Product with id '{payload.product_id}' not found")

    if payload.competitor_id:
        comp = db.get(Competitor, payload.competitor_id)
        if not comp:
            raise NotFoundError(f"Competitor with id '{payload.competitor_id}' not found")

    # Fetch existing evidence for this product to prevent duplicates
    existing_hashes = set(
        db.scalars(
            select(ResearchEvidence.content_hash).where(ResearchEvidence.product_id == payload.product_id)
        ).all()
    )

    evidence_inserted = 0
    created_evidence_ids = []

    for ev_in in payload.evidence:
        ev_hash = compute_evidence_content_hash(ev_in.source_url, ev_in.excerpt)
        if ev_hash in existing_hashes:
            # Duplicate, skip idempotently
            continue

        new_ev_id = uuid.uuid4()
        new_ev = ResearchEvidence(
            id=new_ev_id,
            product_id=payload.product_id,
            competitor_id=payload.competitor_id,
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
        evidence_inserted += 1
        created_evidence_ids.append(new_ev_id)

    # Ingest analyses
    analyses_inserted = 0
    for an_in in payload.analyses:
        cid = an_in.competitor_id if an_in.competitor_id else payload.competitor_id
        ev_ids = [uuid.UUID(str(e)) for e in an_in.evidence_ids] if an_in.evidence_ids else created_evidence_ids

        new_an = CompetitorAnalysis(
            id=uuid.uuid4(),
            product_id=payload.product_id,
            competitor_id=cid,
            summary=an_in.summary,
            strengths=an_in.strengths,
            weaknesses=an_in.weaknesses,
            price_observed=Decimal(str(an_in.price_observed)) if an_in.price_observed is not None else None,
            evidence_ids=ev_ids,
            produced_by=an_in.produced_by or "ai-v1",
        )
        db.add(new_an)
        analyses_inserted += 1

    db.commit()

    return ResearchIngestResponse(
        status="success",
        evidence_inserted=evidence_inserted,
        analyses_inserted=analyses_inserted,
    )
