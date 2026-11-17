"""Product versions and version comparison endpoints."""

from typing import Optional
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.errors import NotFoundError, ValidationError
from backend.app.repositories.product_repository import ProductRepository
from backend.app.repositories.version_repository import VersionRepository
from backend.app.schemas.version import (
    ProductVersionListResponse,
    ProductVersionResponse,
    VersionCompareResponse,
)

router = APIRouter(tags=["Versions"])


@router.get(
    "/products/{product_id}/versions",
    response_model=ProductVersionListResponse,
    summary="List product versions ordered by version number descending",
)
def list_versions(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    product = ProductRepository.get_product(db=db, product_id=product_id)
    if not product:
        raise NotFoundError(f"Product {product_id} not found")

    versions = VersionRepository.list_versions(db=db, product_id=product_id)
    items = [
        ProductVersionResponse(
            id=str(v.id),
            product_id=str(v.product_id),
            version_number=v.version_number,
            assumptions=v.assumptions,
            change_summary=v.change_summary or {},
            created_at=v.created_at.isoformat() if v.created_at else "",
            created_by=v.created_by,
        )
        for v in versions
    ]
    return ProductVersionListResponse(items=items)


@router.get(
    "/products/{product_id}/versions/compare",
    response_model=VersionCompareResponse,
    summary="Compare two product versions using query parameters",
)
def compare_versions_query(
    product_id: uuid.UUID,
    version_a: Optional[int] = Query(default=None),
    version_b: Optional[int] = Query(default=None),
    a: Optional[int] = Query(default=None),
    b: Optional[int] = Query(default=None),
    from_version: Optional[int] = Query(default=None),
    to_version: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
):
    product = ProductRepository.get_product(db=db, product_id=product_id)
    if not product:
        raise NotFoundError(f"Product {product_id} not found")

    v_a = version_a if version_a is not None else (a if a is not None else from_version)
    v_b = version_b if version_b is not None else (b if b is not None else to_version)

    if v_a is None or v_b is None:
        raise ValidationError(
            message="Both version_a and version_b query parameters must be specified for comparison",
            details=[{"field": "version_a/version_b", "issue": "Missing version parameters"}],
        )

    compare_data = VersionRepository.compare_versions(
        db=db,
        product_id=product_id,
        version_a_num=v_a,
        version_b_num=v_b,
    )
    return VersionCompareResponse(**compare_data)


@router.get(
    "/products/{product_id}/versions/{version_a}/compare/{version_b}",
    response_model=VersionCompareResponse,
    summary="Compare two product versions using path parameters",
)
def compare_versions_path(
    product_id: uuid.UUID,
    version_a: int,
    version_b: int,
    db: Session = Depends(get_db),
):
    product = ProductRepository.get_product(db=db, product_id=product_id)
    if not product:
        raise NotFoundError(f"Product {product_id} not found")

    compare_data = VersionRepository.compare_versions(
        db=db,
        product_id=product_id,
        version_a_num=version_a,
        version_b_num=version_b,
    )
    return VersionCompareResponse(**compare_data)

