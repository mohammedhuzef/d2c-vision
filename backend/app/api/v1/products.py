"""Product endpoints implementing /api/v1/products."""

from typing import Any, Dict, Optional
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.errors import NotFoundError
from backend.app.repositories.product_repository import ProductRepository
from backend.app.schemas.patch import AssumptionsPatchRequest, AssumptionsPatchResponse
from backend.app.schemas.product import (
    ProductCreate,
    ProductDetailResponse,
    ProductListResponse,
    ProductResponse,
)

router = APIRouter(tags=["Products"])


def _extract_assumptions(data: ProductCreate) -> Dict[str, Any]:
    """Extracts assumptions dict from ProductCreate, merging flat convenience fields."""
    if data.assumptions:
        if hasattr(data.assumptions, "model_dump"):
            assumptions = data.assumptions.model_dump(exclude_unset=True)
        else:
            assumptions = dict(data.assumptions)
    else:
        assumptions = {}

    # Merge flat fields if provided and not already present
    if data.target_retail_price is not None:
        assumptions.setdefault("pricing", {})["selling_price"] = str(data.target_retail_price)

    if data.target_margin_percent is not None:
        try:
            fraction = float(data.target_margin_percent) / 100.0
            assumptions.setdefault("pricing", {})["target_margin_fraction"] = fraction
        except Exception:
            pass

    if data.cogs is not None:
        assumptions.setdefault("costs", {})["cogs_per_unit"] = str(data.cogs)

    if data.packaging_cost is not None:
        assumptions.setdefault("costs", {})["packaging_cost"] = str(data.packaging_cost)
        assumptions.setdefault("packaging", {})["packaging_cost"] = str(data.packaging_cost)

    if data.shipping_cost is not None:
        assumptions.setdefault("costs", {})["shipping_cost_per_unit"] = str(data.shipping_cost)

    return assumptions


@router.post(
    "/products",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product with initial version",
)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
):
    name = (data.name or data.title or "").strip()
    assumptions = _extract_assumptions(data)

    product, version = ProductRepository.create_product_with_initial_version(
        db=db,
        name=name,
        description=data.description,
        category=data.category,
        target_market=data.target_market,
        assumptions=assumptions,
    )

    return ProductResponse(
        id=str(product.id),
        name=product.name,
        description=product.description,
        category=product.category,
        target_market=product.target_market,
        current_version=product.current_version,
        status=product.status,
        created_at=product.created_at.isoformat() if product.created_at else "",
        validated_version=None,
        stage_statuses={},
        competitors_count=0,
        missing_evidence_count=0,
        revalidation_required=False,
        research_provider="mock",
        latest_readiness=None,
    )


@router.get(
    "/products",
    response_model=ProductListResponse,
    summary="List products with pagination",
)
def list_products(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    items, total = ProductRepository.list_products(db=db, limit=limit, offset=offset)

    responses = [
        ProductResponse(
            id=str(p.id),
            name=p.name,
            description=p.description,
            category=p.category,
            target_market=p.target_market,
            current_version=p.current_version,
            status=p.status,
            created_at=p.created_at.isoformat() if p.created_at else "",
            validated_version=None,
            stage_statuses={},
            competitors_count=len(p.competitors) if p.competitors else 0,
            missing_evidence_count=0,
            revalidation_required=False,
            research_provider="mock",
            latest_readiness=None,
        )
        for p in items
    ]

    return ProductListResponse(
        items=responses,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/products/{product_id}",
    response_model=ProductDetailResponse,
    summary="Get product detail with current assumptions and validation state",
)
def get_product_detail(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    product = ProductRepository.get_product(db=db, product_id=product_id)
    if not product:
        raise NotFoundError(f"Product {product_id} not found")

    detail_data = ProductRepository.get_product_detail_data(db=db, product=product)

    return ProductDetailResponse(
        id=str(product.id),
        name=product.name,
        description=product.description,
        category=product.category,
        target_market=product.target_market,
        current_version=product.current_version,
        status=product.status,
        created_at=product.created_at.isoformat() if product.created_at else "",
        validated_version=detail_data["validated_version"],
        stage_statuses=detail_data["stage_statuses"],
        competitors_count=detail_data["competitors_count"],
        missing_evidence_count=detail_data["missing_evidence_count"],
        revalidation_required=detail_data["revalidation_required"],
        research_provider=detail_data["research_provider"],
        latest_readiness=detail_data["latest_readiness"],
        assumptions=detail_data["assumptions"],
    )


@router.patch(
    "/products/{product_id}/assumptions",
    response_model=AssumptionsPatchResponse,
    summary="Partially patch product assumptions and generate new version",
)
def patch_product_assumptions(
    product_id: uuid.UUID,
    data: AssumptionsPatchRequest,
    db: Session = Depends(get_db),
):
    product, version, changed_fields, affected_stages, impact_event, is_mutated = (
        ProductRepository.patch_assumptions(
            db=db,
            product_id=product_id,
            patch=data.patch,
            revalidate=data.revalidate,
        )
    )

    impact_event_response = None
    if impact_event:
        impact_event_response = {
            "id": str(impact_event.id),
            "product_id": str(impact_event.product_id),
            "from_version": impact_event.from_version,
            "to_version": impact_event.to_version,
            "changed_fields": impact_event.changed_fields,
            "affected_stages": impact_event.affected_stages,
            "before": impact_event.before,
            "after": impact_event.after,
            "rerun_run_id": str(impact_event.rerun_run_id) if impact_event.rerun_run_id else None,
            "created_at": impact_event.created_at.isoformat() if impact_event.created_at else "",
        }

    return AssumptionsPatchResponse(
        new_version=product.current_version,
        version_id=str(version.id),
        changed_fields=changed_fields,
        affected_stages=affected_stages,
        impact_event=impact_event_response,
        results=None,  # Results are populated during revalidation run in 3B
    )

