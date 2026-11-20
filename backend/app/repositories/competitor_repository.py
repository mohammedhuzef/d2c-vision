import uuid
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.core.errors import ConflictError, NotFoundError
from backend.app.models.analysis import CompetitorAnalysis
from backend.app.models.competitor import Competitor
from backend.app.models.evidence import ResearchEvidence
from backend.app.models.product import Product
from backend.app.schemas.competitor import (
    CompetitorDetailResponse,
    CompetitorItem,
    CompetitorPriceSummary,
)
from backend.app.schemas.evidence import (
    EvidenceListResponse,
    EvidenceResponse,
)


def _serialize_analysis(analysis: CompetitorAnalysis) -> Dict[str, Any]:
    price = None
    if analysis.price_observed is not None:
        price = float(analysis.price_observed)
    return {
        "id": str(analysis.id),
        "summary": analysis.summary,
        "strengths": analysis.strengths or [],
        "weaknesses": analysis.weaknesses or [],
        "price_observed": price,
        "produced_by": analysis.produced_by,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
    }


def list_competitors(db: Session, product_id: uuid.UUID) -> List[CompetitorDetailResponse]:
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product '{product_id}' not found")

    competitors = (
        db.execute(
            select(Competitor)
            .where(Competitor.product_id == product_id)
            .order_by(Competitor.created_at.asc())
        )
        .scalars()
        .all()
    )

    results = []
    for comp in competitors:
        ev_count = (
            db.execute(
                select(func.count(ResearchEvidence.id)).where(
                    ResearchEvidence.competitor_id == comp.id
                )
            ).scalar()
            or 0
        )

        analyses_data = [_serialize_analysis(a) for a in comp.analyses]

        results.append(
            CompetitorDetailResponse(
                id=comp.id,
                product_id=comp.product_id,
                name=comp.name,
                website_url=comp.website_url,
                notes=comp.notes,
                product_name=comp.product_name,
                created_at=comp.created_at,
                evidence_count=ev_count,
                analyses=analyses_data,
            )
        )
    return results


def create_competitors(
    db: Session, product_id: uuid.UUID, items: List[CompetitorItem]
) -> List[CompetitorDetailResponse]:
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product '{product_id}' not found")

    # Check for duplicates within the request items
    seen_names = set()
    for item in items:
        norm_name = item.name.strip().lower()
        if norm_name in seen_names:
            raise ConflictError(f"Duplicate competitor name in request: '{item.name}'")
        seen_names.add(norm_name)

    # Check for duplicates against database
    for item in items:
        existing = db.execute(
            select(Competitor).where(
                Competitor.product_id == product_id,
                func.lower(Competitor.name) == item.name.strip().lower(),
            )
        ).scalars().first()
        if existing:
            raise ConflictError(
                f"Competitor '{item.name}' already exists for product '{product_id}'"
            )

    created_competitors: List[Competitor] = []
    for item in items:
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

        if item.observed_price is not None:
            try:
                obs_price = Decimal(str(item.observed_price))
            except (InvalidOperation, TypeError):
                obs_price = None

            if obs_price is not None:
                analysis = CompetitorAnalysis(
                    id=uuid.uuid4(),
                    product_id=product_id,
                    competitor_id=comp_id,
                    summary=f"Initial pricing observation for {comp.name}",
                    strengths=[],
                    weaknesses=[],
                    price_observed=obs_price,
                    produced_by="user",
                )
                db.add(analysis)

        created_competitors.append(comp)

    db.commit()

    # Re-fetch with relations
    results = []
    for comp in created_competitors:
        db.refresh(comp)
        ev_count = (
            db.execute(
                select(func.count(ResearchEvidence.id)).where(
                    ResearchEvidence.competitor_id == comp.id
                )
            ).scalar()
            or 0
        )
        analyses_data = [_serialize_analysis(a) for a in comp.analyses]
        results.append(
            CompetitorDetailResponse(
                id=comp.id,
                product_id=comp.product_id,
                name=comp.name,
                website_url=comp.website_url,
                notes=comp.notes,
                product_name=comp.product_name,
                created_at=comp.created_at,
                evidence_count=ev_count,
                analyses=analyses_data,
            )
        )
    return results


def get_competitor_price_summary(
    db: Session, product_id: uuid.UUID
) -> CompetitorPriceSummary:
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product '{product_id}' not found")

    comp_count = (
        db.execute(
            select(func.count(Competitor.id)).where(Competitor.product_id == product_id)
        ).scalar()
        or 0
    )

    prices_raw = (
        db.execute(
            select(CompetitorAnalysis.price_observed).where(
                CompetitorAnalysis.product_id == product_id,
                CompetitorAnalysis.price_observed.isnot(None),
            )
        )
        .scalars()
        .all()
    )

    valid_prices = [p for p in prices_raw if p is not None and p > 0]
    if not valid_prices:
        return CompetitorPriceSummary(
            competitor_price_min=None,
            competitor_price_median=None,
            competitor_price_max=None,
            competitors_count=comp_count,
        )

    sorted_prices = sorted(valid_prices)
    min_p = sorted_prices[0]
    max_p = sorted_prices[-1]

    n = len(sorted_prices)
    if n % 2 == 1:
        median_p = sorted_prices[n // 2]
    else:
        median_p = (sorted_prices[n // 2 - 1] + sorted_prices[n // 2]) / Decimal("2")

    return CompetitorPriceSummary(
        competitor_price_min=f"{min_p:.2f}",
        competitor_price_median=f"{median_p:.2f}",
        competitor_price_max=f"{max_p:.2f}",
        competitors_count=comp_count,
    )


def list_evidence(
    db: Session,
    product_id: uuid.UUID,
    competitor_id: Optional[uuid.UUID] = None,
    source_type: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> EvidenceListResponse:
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product '{product_id}' not found")

    base_query = select(ResearchEvidence).where(
        ResearchEvidence.product_id == product_id
    )
    if competitor_id is not None:
        base_query = base_query.where(ResearchEvidence.competitor_id == competitor_id)
    if source_type is not None:
        base_query = base_query.where(ResearchEvidence.source_type == source_type)

    total = (
        db.execute(select(func.count()).select_from(base_query.subquery())).scalar()
        or 0
    )

    items = (
        db.execute(
            base_query.order_by(ResearchEvidence.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        .scalars()
        .all()
    )

    ev_responses = []
    for ev in items:
        conf = float(ev.confidence) if ev.confidence is not None else None
        ev_responses.append(
            EvidenceResponse(
                id=ev.id,
                product_id=ev.product_id,
                competitor_id=ev.competitor_id,
                source_type=ev.source_type,
                source_url=ev.source_url,
                title=ev.title,
                excerpt=ev.excerpt,
                retrieved_at=ev.retrieved_at,
                confidence=conf,
                data=ev.data or {},
                created_at=ev.created_at,
            )
        )

    return EvidenceListResponse(
        items=ev_responses,
        total=total,
        limit=limit,
        offset=offset,
    )
