from decimal import Decimal
import uuid
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.errors import ConflictError, NotFoundError, ValidationError
from backend.app.models.product import Product
from backend.app.models.competitor import Competitor
from backend.app.models.analysis import CompetitorAnalysis
from backend.app.models.evidence import ResearchEvidence, compute_evidence_content_hash
from backend.app.schemas.competitor import (
    CompetitorCreate,
    CompetitorDetailResponse,
    CompetitorListResponse,
)

router = APIRouter(prefix="/products/{product_id}/competitors", tags=["Competitors"])


@router.post("", response_model=CompetitorListResponse, status_code=status.HTTP_201_CREATED)
def add_competitors(
    product_id: UUID,
    payload: CompetitorCreate,
    db: Session = Depends(get_db),
):
    """Add one or more competitors for a product (case-insensitive deduplication)."""
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")

    if not payload.competitors:
        raise ValidationError(
            "At least one competitor is required",
            details=[{"field": "competitors", "issue": "empty list"}],
        )

    for item in payload.competitors:
        if not item.name or not item.name.strip():
            raise ValidationError(
                "Competitor name cannot be blank",
                details=[{"field": "name", "issue": "blank name"}],
            )

    # In-payload duplicate check
    seen_in_payload = set()
    for item in payload.competitors:
        norm_name = item.name.strip().lower()
        if norm_name in seen_in_payload:
            raise ConflictError(
                f"Duplicate competitor name '{item.name}' in request payload",
                details=[{"field": "competitors", "issue": "duplicate"}],
            )
        seen_in_payload.add(norm_name)

    # Existing competitors duplicate check
    existing_names = set(
        db.scalars(
            select(func.lower(Competitor.name)).where(Competitor.product_id == product_id)
        ).all()
    )

    for item in payload.competitors:
        if item.name.strip().lower() in existing_names:
            raise ConflictError(
                f"Competitor '{item.name}' already exists for this product",
                details=[{"field": "name", "issue": "duplicate"}],
            )

    # Insert competitors and optional manual evidence / analysis
    created_items = []
    for item in payload.competitors:
        comp_id = uuid.uuid4()
        comp = Competitor(
            id=comp_id,
            product_id=product_id,
            name=item.name.strip(),
            website_url=item.website_url,
            notes=item.notes,
            product_name=item.product_name,
        )
        db.add(comp)
        created_items.append(comp)

        if item.observed_price:
            price_dec = Decimal(str(item.observed_price))
            price_str = f"{price_dec:.2f}"
            ev_title = f"Manual price observation for {item.name}"
            ev_excerpt = f"Observed price for {item.product_name or item.name}: ${price_str}"
            ev_hash = compute_evidence_content_hash(item.website_url, ev_excerpt)

            existing_ev = db.scalar(
                select(ResearchEvidence).where(
                    ResearchEvidence.product_id == product_id,
                    ResearchEvidence.content_hash == ev_hash,
                )
            )
            if existing_ev:
                ev_id = existing_ev.id
            else:
                ev_id = uuid.uuid4()
                manual_ev = ResearchEvidence(
                    id=ev_id,
                    product_id=product_id,
                    competitor_id=comp_id,
                    content_hash=ev_hash,
                    source_type="manual",
                    source_url=item.website_url,
                    title=ev_title,
                    excerpt=ev_excerpt,
                    confidence=Decimal("1.00"),
                    data={"price": price_str},
                )
                db.add(manual_ev)

            manual_analysis = CompetitorAnalysis(
                id=uuid.uuid4(),
                product_id=product_id,
                competitor_id=comp_id,
                summary=f"Manual competitor analysis for {item.name}",
                strengths=[],
                weaknesses=[],
                price_observed=price_dec,
                evidence_ids=[ev_id],
                produced_by="manual",
            )
            db.add(manual_analysis)

    db.commit()

    # Re-fetch all competitors for this product to return complete state
    all_competitors = db.scalars(
        select(Competitor)
        .where(Competitor.product_id == product_id)
        .order_by(Competitor.created_at.asc())
    ).all()

    result_items = []
    for c in all_competitors:
        analyses_data = [
            {
                "id": a.id,
                "summary": a.summary,
                "strengths": a.strengths,
                "weaknesses": a.weaknesses,
                "price_observed": float(a.price_observed) if a.price_observed is not None else None,
                "evidence_ids": a.evidence_ids,
                "produced_by": a.produced_by,
            }
            for a in c.analyses
        ]
        result_items.append(
            CompetitorDetailResponse(
                id=c.id,
                product_id=c.product_id,
                name=c.name,
                website_url=c.website_url,
                notes=c.notes,
                product_name=c.product_name,
                created_at=c.created_at,
                evidence_count=len(c.evidence),
                analyses=analyses_data,
            )
        )

    return CompetitorListResponse(items=result_items)


@router.get("", response_model=CompetitorListResponse)
def list_competitors(
    product_id: UUID,
    db: Session = Depends(get_db),
):
    """List competitors with their analyses and evidence counts."""
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")

    competitors = db.scalars(
        select(Competitor)
        .where(Competitor.product_id == product_id)
        .order_by(Competitor.created_at.asc())
    ).all()

    result_items = []
    for c in competitors:
        analyses_data = [
            {
                "id": a.id,
                "summary": a.summary,
                "strengths": a.strengths,
                "weaknesses": a.weaknesses,
                "price_observed": float(a.price_observed) if a.price_observed is not None else None,
                "evidence_ids": a.evidence_ids,
                "produced_by": a.produced_by,
            }
            for a in c.analyses
        ]
        result_items.append(
            CompetitorDetailResponse(
                id=c.id,
                product_id=c.product_id,
                name=c.name,
                website_url=c.website_url,
                notes=c.notes,
                product_name=c.product_name,
                created_at=c.created_at,
                evidence_count=len(c.evidence),
                analyses=analyses_data,
            )
        )

    return CompetitorListResponse(items=result_items)

