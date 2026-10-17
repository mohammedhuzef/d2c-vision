from uuid import UUID
from fastapi import APIRouter, Depends, Path
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.errors import NotFoundError
from backend.app.models.product import Product
from backend.app.models.version import ProductVersion
from backend.app.schemas.assumptions import Assumptions
from backend.app.schemas.version import (
    ProductVersionResponse,
    ProductVersionListResponse,
)
from backend.app.schemas.impact import (
    VersionCompareResponse,
)
from backend.app.services.versioning import compare_versions

router = APIRouter(prefix="/products/{product_id}/versions", tags=["Versions"])


@router.get("", response_model=ProductVersionListResponse)
def list_versions(
    product_id: UUID,
    db: Session = Depends(get_db),
):
    """List immutable versions for a product with change summaries."""
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")

    versions = list(
        db.scalars(
            select(ProductVersion)
            .where(ProductVersion.product_id == product_id)
            .order_by(desc(ProductVersion.version_number))
        ).all()
    )

    items = [
        ProductVersionResponse(
            id=v.id,
            product_id=v.product_id,
            version_number=v.version_number,
            assumptions=Assumptions.model_validate(v.assumptions),
            change_summary=v.change_summary or {},
            created_by=v.created_by,
            created_at=v.created_at,
        )
        for v in versions
    ]
    return ProductVersionListResponse(items=items)


@router.get("/{version_a}/compare/{version_b}", response_model=VersionCompareResponse)
def compare_product_versions(
    product_id: UUID,
    version_a: int = Path(..., description="First version number to compare"),
    version_b: int = Path(..., description="Second version number to compare"),
    db: Session = Depends(get_db),
):
    """Per-stage comparison showing status changes, metric deltas, and finding diffs."""
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError(f"Product with id '{product_id}' not found")

    va = db.scalar(
        select(ProductVersion).where(
            ProductVersion.product_id == product_id,
            ProductVersion.version_number == version_a,
        )
    )
    if not va:
        raise NotFoundError(f"Version {version_a} for product '{product_id}' not found")

    vb = db.scalar(
        select(ProductVersion).where(
            ProductVersion.product_id == product_id,
            ProductVersion.version_number == version_b,
        )
    )
    if not vb:
        raise NotFoundError(f"Version {version_b} for product '{product_id}' not found")

    return compare_versions(product_id, va, vb, db)
