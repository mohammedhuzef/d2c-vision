"""Repository for ProductVersion operations and version comparison."""

from decimal import Decimal
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy.orm import Session

from backend.app.core.errors import NotFoundError
from backend.app.models.version import ProductVersion
from backend.app.services.finance import (
    calculate_financials,
    from_assumptions,
    resolve_packaging_cost,
    round_margin,
    round_money,
    to_decimal,
)
from backend.app.services.validation.rules_config import STAGE_ORDER


class VersionRepository:
    @staticmethod
    def list_versions(db: Session, product_id: uuid.UUID) -> List[ProductVersion]:
        """Lists all versions of a product ordered by version_number descending."""
        return (
            db.query(ProductVersion)
            .filter(ProductVersion.product_id == product_id)
            .order_by(ProductVersion.version_number.desc())
            .all()
        )

    @staticmethod
    def get_version(
        db: Session,
        product_id: uuid.UUID,
        version_number: int,
    ) -> Optional[ProductVersion]:
        """Retrieves a specific version number for a product."""
        return (
            db.query(ProductVersion)
            .filter(
                ProductVersion.product_id == product_id,
                ProductVersion.version_number == version_number,
            )
            .first()
        )

    @staticmethod
    def compare_versions(
        db: Session,
        product_id: uuid.UUID,
        version_a_num: int,
        version_b_num: int,
    ) -> Dict[str, Any]:
        """Compares two product versions, calculating financial and stage metric deltas."""
        v_a = VersionRepository.get_version(db, product_id, version_a_num)
        if not v_a:
            raise NotFoundError(f"Version {version_a_num} not found for product {product_id}")

        v_b = VersionRepository.get_version(db, product_id, version_b_num)
        if not v_b:
            raise NotFoundError(f"Version {version_b_num} not found for product {product_id}")

        assumptions_a = v_a.assumptions or {}
        assumptions_b = v_b.assumptions or {}

        # 1. Financial stage comparison using pure finance.py
        financial_deltas: Dict[str, Dict[str, Any]] = {}
        try:
            fin_a = calculate_financials(from_assumptions(assumptions_a))
            fin_b = calculate_financials(from_assumptions(assumptions_b))

            if fin_a.variable_cost_per_unit is not None and fin_b.variable_cost_per_unit is not None:
                b_val = float(fin_a.variable_cost_per_unit)
                a_val = float(fin_b.variable_cost_per_unit)
                financial_deltas["variable_cost_per_unit"] = {
                    "before": b_val,
                    "after": a_val,
                    "delta": round(a_val - b_val, 2),
                }

            if fin_a.contribution_per_unit is not None and fin_b.contribution_per_unit is not None:
                b_val = float(fin_a.contribution_per_unit)
                a_val = float(fin_b.contribution_per_unit)
                financial_deltas["contribution_per_unit"] = {
                    "before": b_val,
                    "after": a_val,
                    "delta": round(a_val - b_val, 2),
                }

            if fin_a.contribution_margin is not None and fin_b.contribution_margin is not None:
                b_val = float(fin_a.contribution_margin)
                a_val = float(fin_b.contribution_margin)
                financial_deltas["contribution_margin"] = {
                    "before": b_val,
                    "after": a_val,
                    "delta": round(a_val - b_val, 4),
                }

            if fin_a.break_even_units is not None and fin_b.break_even_units is not None:
                b_val = int(fin_a.break_even_units)
                a_val = int(fin_b.break_even_units)
                financial_deltas["break_even_units"] = {
                    "before": b_val,
                    "after": a_val,
                    "delta": a_val - b_val,
                }
        except Exception:
            pass

        # 2. Packaging stage comparison
        pkg_deltas: Dict[str, Dict[str, Any]] = {}
        try:
            pkg_cost_a, _ = resolve_packaging_cost(assumptions_a)
            pkg_cost_b, _ = resolve_packaging_cost(assumptions_b)
            p_a = to_decimal((assumptions_a.get("pricing") or {}).get("selling_price"))
            p_b = to_decimal((assumptions_b.get("pricing") or {}).get("selling_price"))

            if pkg_cost_a is not None and pkg_cost_b is not None:
                b_cost = float(pkg_cost_a)
                a_cost = float(pkg_cost_b)
                pkg_deltas["packaging_cost"] = {
                    "before": b_cost,
                    "after": a_cost,
                    "delta": round(a_cost - b_cost, 2),
                }

            if pkg_cost_a is not None and p_a and p_a > Decimal("0") and pkg_cost_b is not None and p_b and p_b > Decimal("0"):
                ratio_a = float(round_margin(pkg_cost_a / p_a))
                ratio_b = float(round_margin(pkg_cost_b / p_b))
                pkg_deltas["packaging_cost_ratio"] = {
                    "before": ratio_a,
                    "after": ratio_b,
                    "delta": round(ratio_b - ratio_a, 4),
                }
        except Exception:
            pass

        # 3. Marketing stage comparison
        mkt_deltas: Dict[str, Dict[str, Any]] = {}
        try:
            cac_a = to_decimal((assumptions_a.get("marketing") or {}).get("expected_cac"))
            cac_b = to_decimal((assumptions_b.get("marketing") or {}).get("expected_cac"))
            fin_a = calculate_financials(from_assumptions(assumptions_a))
            fin_b = calculate_financials(from_assumptions(assumptions_b))

            if cac_a and fin_a.contribution_per_unit and fin_a.contribution_per_unit > Decimal("0") and \
               cac_b and fin_b.contribution_per_unit and fin_b.contribution_per_unit > Decimal("0"):
                r_a = float(round_margin(cac_a / fin_a.contribution_per_unit))
                r_b = float(round_margin(cac_b / fin_b.contribution_per_unit))
                mkt_deltas["cac_to_contribution_ratio"] = {
                    "before": r_a,
                    "after": r_b,
                    "delta": round(r_b - r_a, 4),
                }
        except Exception:
            pass

        # Assemble stages comparison
        stages: Dict[str, Any] = {
            "customer": {
                "stage": "customer",
                "status_before": "PASSED",
                "status_after": "PASSED",
                "metric_deltas": {},
                "findings_added": [],
                "findings_removed": [],
            },
            "competitor": {
                "stage": "competitor",
                "status_before": "PASSED",
                "status_after": "PASSED",
                "metric_deltas": {},
                "findings_added": [],
                "findings_removed": [],
            },
            "product_packaging": {
                "stage": "product_packaging",
                "status_before": "PASSED",
                "status_after": "PASSED",
                "metric_deltas": pkg_deltas,
                "findings_added": [],
                "findings_removed": [],
            },
            "pricing": {
                "stage": "pricing",
                "status_before": "PASSED",
                "status_after": "PASSED",
                "metric_deltas": {},
                "findings_added": [],
                "findings_removed": [],
            },
            "financial": {
                "stage": "financial",
                "status_before": "PASSED",
                "status_after": "PASSED",
                "metric_deltas": financial_deltas,
                "findings_added": [],
                "findings_removed": [],
            },
            "marketing": {
                "stage": "marketing",
                "status_before": "PASSED",
                "status_after": "PASSED",
                "metric_deltas": mkt_deltas,
                "findings_added": [],
                "findings_removed": [],
            },
        }

        return {
            "product_id": str(product_id),
            "version_a": version_a_num,
            "version_b": version_b_num,
            "from_version": version_a_num,
            "to_version": version_b_num,
            "stages": stages,
            "stage_deltas": stages,
        }
