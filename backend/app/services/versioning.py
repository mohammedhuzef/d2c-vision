from decimal import Decimal
from typing import Any, Dict, List, Optional, Set, Tuple
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.version import ProductVersion
from backend.app.models.validation import ValidationRun, ValidationResult
from backend.app.schemas.impact import StageDelta, VersionCompareResponse
from backend.app.schemas.validation import FindingResponse
from backend.app.services.validation.stages import ORDERED_STAGE_NAMES
import uuid
from backend.app.models.product import Product


def create_initial_version(
    product: Product,
    assumptions: Any,
    db: Session,
) -> ProductVersion:
    """Creates immutable version 1 for a newly created product and sets product.current_version = 1."""
    if hasattr(assumptions, "model_dump"):
        assumptions_dict = assumptions.model_dump(mode="json")
    elif isinstance(assumptions, dict):
        assumptions_dict = assumptions
    else:
        assumptions_dict = {}

    version_id = uuid.uuid4()
    version = ProductVersion(
        id=version_id,
        product_id=product.id,
        version_number=1,
        assumptions=assumptions_dict,
        change_summary={},
        created_by=None,
    )
    product.current_version = 1
    db.add(version)
    return version


def get_latest_version(
    product_id: uuid.UUID,
    db: Session,
) -> Optional[ProductVersion]:
    """Fetches the latest version for a given product."""
    product = db.get(Product, product_id)
    current_ver = product.current_version if product else 1

    return db.scalar(
        select(ProductVersion).where(
            ProductVersion.product_id == product_id,
            ProductVersion.version_number == current_ver,
        )
    )


def deep_merge(base: Dict[str, Any], patch: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively merges patch dictionary into base dictionary without mutating inputs."""
    result = dict(base)
    for key, value in patch.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result


def diff_dict_paths(old_val: Any, new_val: Any, prefix: str = "") -> List[str]:
    """Computes all dotted paths where values differ between two dictionaries."""
    changed = []
    if isinstance(old_val, dict) and isinstance(new_val, dict):
        all_keys = set(old_val.keys()).union(set(new_val.keys()))
        for k in sorted(all_keys):
            sub_prefix = f"{prefix}.{k}" if prefix else k
            if k not in old_val:
                changed.append(sub_prefix)
            elif k not in new_val:
                changed.append(sub_prefix)
            else:
                changed.extend(diff_dict_paths(old_val[k], new_val[k], sub_prefix))
    elif old_val != new_val:
        changed.append(prefix)
    return changed


def compare_versions(
    product_id: Any,
    version_a: ProductVersion,
    version_b: ProductVersion,
    db: Session,
) -> VersionCompareResponse:
    """
    Compares two versions by checking the validation runs associated with each.
    Returns per-stage status_before, status_after, metric_deltas, findings_added, findings_removed.
    """
    run_a = db.scalar(
        select(ValidationRun)
        .where(ValidationRun.version_id == version_a.id)
        .order_by(ValidationRun.started_at.desc())
        .limit(1)
    )
    run_b = db.scalar(
        select(ValidationRun)
        .where(ValidationRun.version_id == version_b.id)
        .order_by(ValidationRun.started_at.desc())
        .limit(1)
    )

    results_a_map: Dict[str, ValidationResult] = {r.stage: r for r in (run_a.results if run_a else [])}
    results_b_map: Dict[str, ValidationResult] = {r.stage: r for r in (run_b.results if run_b else [])}

    stages_comparison: Dict[str, StageDelta] = {}

    for stage_name in ORDERED_STAGE_NAMES:
        res_a = results_a_map.get(stage_name)
        res_b = results_b_map.get(stage_name)

        status_before = res_a.status if res_a else None
        status_after = res_b.status if res_b else None

        # Metric deltas
        metrics_a = res_a.metrics or {} if res_a else {}
        metrics_b = res_b.metrics or {} if res_b else {}
        all_metric_keys = set(metrics_a.keys()).union(set(metrics_b.keys()))

        metric_deltas: Dict[str, Any] = {}
        for k in sorted(all_metric_keys):
            val_a = metrics_a.get(k)
            val_b = metrics_b.get(k)
            if val_a != val_b:
                entry: Dict[str, Any] = {"before": val_a, "after": val_b}
                if isinstance(val_a, (int, float)) and isinstance(val_b, (int, float)):
                    delta = round(val_b - val_a, 4)
                    entry["delta"] = delta
                elif isinstance(val_a, str) and isinstance(val_b, str):
                    try:
                        dec_a = Decimal(val_a)
                        dec_b = Decimal(val_b)
                        entry["delta"] = json.loads(f"{(dec_b - dec_a):.2f}")
                    except Exception:
                        pass
                metric_deltas[k] = entry

        # Findings diff
        findings_a = res_a.findings or [] if res_a else []
        findings_b = res_b.findings or [] if res_b else []

        codes_a = {f.get("code") for f in findings_a if f.get("code")}
        codes_b = {f.get("code") for f in findings_b if f.get("code")}

        added = [
            FindingResponse(
                code=f.get("code", ""),
                severity=f.get("severity", "info"),
                message=f.get("message", ""),
                evidence_ids=f.get("evidence_ids", []),
                field=f.get("field"),
            )
            for f in findings_b
            if f.get("code") not in codes_a
        ]

        removed = [
            FindingResponse(
                code=f.get("code", ""),
                severity=f.get("severity", "info"),
                message=f.get("message", ""),
                evidence_ids=f.get("evidence_ids", []),
                field=f.get("field"),
            )
            for f in findings_a
            if f.get("code") not in codes_b
        ]

        stages_comparison[stage_name] = StageDelta(
            status_before=status_before,
            status_after=status_after,
            metric_deltas=metric_deltas,
            findings_added=added,
            findings_removed=removed,
        )

    return VersionCompareResponse(
        product_id=product_id,
        version_a=version_a.version_number,
        version_b=version_b.version_number,
        stages=stages_comparison,
    )
