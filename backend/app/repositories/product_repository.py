"""Repository for Product, ProductVersion, and ImpactEvent database operations."""

import threading
from typing import Any, Dict, List, Optional, Tuple
import uuid

from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session, joinedload

from backend.app.core.config import settings
from backend.app.core.errors import NotFoundError, ValidationError
from backend.app.models.competitor import Competitor
from backend.app.models.evidence import ResearchEvidence
from backend.app.models.impact import ImpactEvent
from backend.app.models.product import Product
from backend.app.models.validation import ValidationRun
from backend.app.models.version import ProductVersion
from backend.app.repositories.assumptions_utils import (
    _unflatten_dict,
    compute_diff,
    deep_merge,
    validate_patch,
)
from backend.app.services.finance import calculate_financials, from_assumptions
from backend.app.services.validation.dependencies import affected_stages

# Process-level thread synchronization locks per product_id for concurrency safety on SQLite
_PRODUCT_LOCKS: Dict[uuid.UUID, threading.Lock] = {}
_LOCK_MUTEX = threading.Lock()


def _get_product_lock(product_id: uuid.UUID) -> threading.Lock:
    with _LOCK_MUTEX:
        if product_id not in _PRODUCT_LOCKS:
            _PRODUCT_LOCKS[product_id] = threading.Lock()
        return _PRODUCT_LOCKS[product_id]


class ProductRepository:
    @staticmethod
    def create_product_with_initial_version(
        db: Session,
        name: str,
        description: Optional[str],
        category: Optional[str],
        target_market: Optional[str],
        assumptions: Dict[str, Any],
    ) -> Tuple[Product, ProductVersion]:
        """Creates a new product and its initial version 1 atomically."""
        product_id = uuid.uuid4()
        product = Product(
            id=product_id,
            name=name,
            description=description,
            category=category,
            target_market=target_market,
            current_version=1,
            status="draft",
        )
        version = ProductVersion(
            id=uuid.uuid4(),
            product_id=product_id,
            version_number=1,
            assumptions=assumptions,
            change_summary={},
            created_by=None,
        )

        db.add(product)
        db.add(version)
        db.commit()
        db.refresh(product)
        db.refresh(version)
        return product, version

    @staticmethod
    def get_product(db: Session, product_id: uuid.UUID) -> Optional[Product]:
        """Retrieves a product by primary key."""
        return db.query(Product).filter(Product.id == product_id).first()

    @staticmethod
    def list_products(
        db: Session,
        limit: int = 20,
        offset: int = 0,
    ) -> Tuple[List[Product], int]:
        """Returns paginated products ordered by created_at descending."""
        # Cap limit to 100 hard maximum
        effective_limit = min(max(1, limit), 100)
        query = db.query(Product).order_by(Product.created_at.desc())
        total = query.count()
        items = query.offset(offset).limit(effective_limit).all()
        return items, total

    @staticmethod
    def get_latest_version(db: Session, product_id: uuid.UUID) -> Optional[ProductVersion]:
        """Retrieves the latest version of a product."""
        return (
            db.query(ProductVersion)
            .filter(ProductVersion.product_id == product_id)
            .order_by(ProductVersion.version_number.desc())
            .first()
        )

    @staticmethod
    def get_product_detail_data(db: Session, product: Product) -> Dict[str, Any]:
        """Calculates derived metrics and reads latest validation state for ProductDetailResponse."""
        # Read latest version assumptions
        latest_version = (
            db.query(ProductVersion)
            .filter(
                ProductVersion.product_id == product.id,
                ProductVersion.version_number == product.current_version,
            )
            .first()
        )
        assumptions = latest_version.assumptions if latest_version else {}

        # Competitors & evidence counts
        competitors = db.query(Competitor).filter(Competitor.product_id == product.id).all()
        competitors_count = len(competitors)

        evidence_items = (
            db.query(ResearchEvidence)
            .filter(
                ResearchEvidence.product_id == product.id,
            )
            .all()
        )
        comps_with_evidence = {e.competitor_id for e in evidence_items if e.competitor_id is not None}
        missing_evidence_count = sum(1 for c in competitors if c.id not in comps_with_evidence)

        # Validation run state
        latest_run = (
            db.query(ValidationRun)
            .filter(ValidationRun.product_id == product.id)
            .order_by(ValidationRun.created_at.desc())
            .first()
        )

        validated_version: Optional[int] = None
        revalidation_required = False
        stage_statuses: Dict[str, str] = {}
        latest_readiness: Optional[Dict[str, Any]] = None

        if latest_run:
            validated_version = getattr(product, "validated_version", None)
            if validated_version is None and latest_run.version:
                validated_version = latest_run.version.version_number

            if validated_version is not None and product.current_version > validated_version:
                revalidation_required = True
            elif product.status == "revalidation_required":
                revalidation_required = True
            else:
                latest_ev_time = db.execute(
                    select(func.max(ResearchEvidence.created_at)).where(
                        ResearchEvidence.product_id == product.id
                    )
                ).scalar()
                if latest_ev_time and latest_run.created_at and latest_ev_time > latest_run.created_at:
                    revalidation_required = True

            stage_statuses = {res.stage: res.status for res in latest_run.results}
            verdict = getattr(latest_run, "verdict", None) or getattr(latest_run, "readiness_verdict", None)
            if verdict:
                latest_readiness = {
                    "label": verdict,
                    "score": float(latest_run.readiness_score) if latest_run.readiness_score is not None else None,
                    "calculated_at": latest_run.created_at.isoformat() if latest_run.created_at else None,
                }

        return {
            "assumptions": assumptions,
            "competitors_count": competitors_count,
            "missing_evidence_count": missing_evidence_count,
            "stage_statuses": stage_statuses,
            "latest_readiness": latest_readiness,
            "validated_version": validated_version,
            "revalidation_required": revalidation_required,
            "research_provider": getattr(settings, "RESEARCH_PROVIDER", "mock"),
        }

    @staticmethod
    def patch_assumptions(
        db: Session,
        product_id: uuid.UUID,
        patch: Dict[str, Any],
        revalidate: bool = False,
    ) -> Tuple[Product, ProductVersion, List[str], List[str], Optional[ImpactEvent], bool]:
        """Applies a partial patch with deep merge, computing diff and creating a new version.

        Concurrency: Uses row locking on Postgres and per-product threading locks for SQLite.
        Returns:
            (product, current_or_new_version, changed_fields, affected_stages, impact_event, is_mutated)
        """
        lock = _get_product_lock(product_id)
        with lock:
            # 1. Lock product row on Postgres
            query = db.query(Product).filter(Product.id == product_id)
            if db.bind and db.bind.dialect.name == "postgresql":
                query = query.with_for_update()
            product = query.first()

            if not product:
                raise NotFoundError(f"Product {product_id} not found")

            # 2. Get current active version
            current_version = (
                db.query(ProductVersion)
                .filter(
                    ProductVersion.product_id == product.id,
                    ProductVersion.version_number == product.current_version,
                )
                .first()
            )
            if not current_version:
                # Fallback to latest
                current_version = (
                    db.query(ProductVersion)
                    .filter(ProductVersion.product_id == product.id)
                    .order_by(ProductVersion.version_number.desc())
                    .first()
                )

            current_assumptions = current_version.assumptions if current_version else {}

            # 3. Validate patch
            flat_patch = validate_patch(patch)
            nested_patch = _unflatten_dict(flat_patch)
            merged_assumptions = deep_merge(current_assumptions, nested_patch)

            # 4. Compute diff
            changed_fields, change_summary = compute_diff(current_assumptions, merged_assumptions)

            # No-op check: if nothing changed, create NO new version and NO impact event
            if not changed_fields:
                return (
                    product,
                    current_version,
                    [],
                    [],
                    None,
                    False,
                )

            # 5. Compute affected stages
            stages = affected_stages(changed_fields)

            # 6. Build before / after metrics snapshot for ImpactEvent
            before_snapshot: Dict[str, Any] = {}
            after_snapshot: Dict[str, Any] = {}

            try:
                fin_before = calculate_financials(from_assumptions(current_assumptions))
                if fin_before.contribution_margin is not None:
                    before_snapshot["financial.contribution_margin"] = float(fin_before.contribution_margin)
                if fin_before.break_even_units is not None:
                    before_snapshot["financial.break_even_units"] = fin_before.break_even_units
            except Exception:
                pass

            try:
                fin_after = calculate_financials(from_assumptions(merged_assumptions))
                if fin_after.contribution_margin is not None:
                    after_snapshot["financial.contribution_margin"] = float(fin_after.contribution_margin)
                if fin_after.break_even_units is not None:
                    after_snapshot["financial.break_even_units"] = fin_after.break_even_units
            except Exception:
                pass

            for field_path in changed_fields:
                before_snapshot[field_path] = change_summary[field_path]["old"]
                after_snapshot[field_path] = change_summary[field_path]["new"]

            # 7. Create new immutable version
            next_version_num = product.current_version + 1
            new_version = ProductVersion(
                id=uuid.uuid4(),
                product_id=product.id,
                version_number=next_version_num,
                assumptions=merged_assumptions,
                change_summary=change_summary,
                created_by=None,
            )

            # 8. Create ImpactEvent
            impact_event = ImpactEvent(
                id=uuid.uuid4(),
                product_id=product.id,
                from_version=product.current_version,
                to_version=next_version_num,
                changed_fields=changed_fields,
                affected_stages=stages,
                before=before_snapshot,
                after=after_snapshot,
                rerun_run_id=None,
            )

            # 9. Update Product
            product.current_version = next_version_num
            if revalidate:
                product.status = "revalidation_required"

            db.add(new_version)
            db.add(impact_event)
            db.commit()
            db.refresh(product)
            db.refresh(new_version)
            db.refresh(impact_event)

            return (
                product,
                new_version,
                changed_fields,
                stages,
                impact_event,
                True,
            )
