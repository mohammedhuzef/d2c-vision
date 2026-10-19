import json
import uuid
from typing import Any, Dict, List, Optional, Tuple
from pydantic import ValidationError as PydanticValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.errors import ValidationError
from backend.app.models.product import Product
from backend.app.models.version import ProductVersion
from backend.app.models.impact import ImpactEvent
from backend.app.models.validation import ValidationRun
from backend.app.schemas.assumptions import Assumptions
from backend.app.schemas.impact import (
    AssumptionsPatchResponse,
    ImpactEventResponse,
)
from backend.app.schemas.validation import FindingResponse, StageResultResponse
from backend.app.services.dependencies import get_affected_stages
from backend.app.services.versioning import deep_merge, diff_dict_paths
from backend.app.services.validation.orchestrator import ValidationOrchestrator


def _extract_summary_state(run: Optional[ValidationRun]) -> Dict[str, Any]:
    """Extracts summary key metrics and stage statuses for impact event snapshot."""
    if not run or not run.results:
        return {}

    state: Dict[str, Any] = {}
    for res in run.results:
        state[f"{res.stage}.status"] = res.status
        if res.metrics:
            for k, v in res.metrics.items():
                if isinstance(v, (int, float, str)) or v is None:
                    state[f"{res.stage}.{k}"] = v
    return state


def apply_assumptions_change(
    product: Product,
    patch: Dict[str, Any],
    revalidate: bool,
    db: Session,
) -> Tuple[AssumptionsPatchResponse, bool]:
    """
    Applies assumptions patch:
    1. Deep-merge into latest assumptions; validate with Pydantic; reject unknown fields (422).
    2. Diff to find changed_fields. If no change, returns existing state with no new version.
    3. Creates new immutable product_version; updates products.current_version.
    4. Computes affected_stages.
    5. If revalidate=True, re-runs affected stages, carrying forward unaffected stages.
    6. Writes an impact_events row with before/after metrics and statuses.
    """
    # Lock product row if not already locked in current transaction
    product = db.scalar(select(Product).where(Product.id == product.id).with_for_update()) or product

    # 1. Fetch latest version assumptions
    latest_version = db.scalar(
        select(ProductVersion).where(
            ProductVersion.product_id == product.id,
            ProductVersion.version_number == product.current_version,
        )
    )
    old_assumptions_dict = latest_version.assumptions if latest_version else {}

    # Check packaging_cost mirror rules (Amendment 9)
    # If both packaging.packaging_cost and costs.packaging_cost are given and differ -> 422 VALIDATION_ERROR. If only one is given, mirror it.
    import copy
    from decimal import Decimal

    patch_to_apply = copy.deepcopy(patch)
    pkg_cost_given = False
    pkg_cost_val = None
    if isinstance(patch_to_apply.get("packaging"), dict) and "packaging_cost" in patch_to_apply["packaging"]:
        pkg_cost_given = True
        pkg_cost_val = patch_to_apply["packaging"]["packaging_cost"]

    costs_cost_given = False
    costs_cost_val = None
    if isinstance(patch_to_apply.get("costs"), dict) and "packaging_cost" in patch_to_apply["costs"]:
        costs_cost_given = True
        costs_cost_val = patch_to_apply["costs"]["packaging_cost"]

    if pkg_cost_given and costs_cost_given:
        d1 = Decimal(str(pkg_cost_val)) if pkg_cost_val is not None else None
        d2 = Decimal(str(costs_cost_val)) if costs_cost_val is not None else None
        if d1 != d2:
            raise ValidationError(
                message="Assumptions validation failed",
                details=[{"field": "packaging.packaging_cost", "issue": "packaging.packaging_cost and costs.packaging_cost conflict and must be equal."}],
            )
    elif pkg_cost_given:
        patch_to_apply.setdefault("costs", {})
        patch_to_apply["costs"]["packaging_cost"] = pkg_cost_val
    elif costs_cost_given:
        patch_to_apply.setdefault("packaging", {})
        patch_to_apply["packaging"]["packaging_cost"] = costs_cost_val

    # Merge
    merged_dict = deep_merge(old_assumptions_dict, patch_to_apply)

    # Validate with Pydantic
    try:
        validated_assumptions = Assumptions.model_validate(merged_dict)
    except PydanticValidationError as e:
        details = []
        for err in e.errors():
            loc = err.get("loc", [])
            field_path = ".".join(str(p) for p in loc)
            details.append({"field": f"assumptions.{field_path}" if field_path else "assumptions", "issue": err.get("msg", "Invalid value")})
        raise ValidationError(message="Assumptions validation failed", details=details)

    new_assumptions_dict = validated_assumptions.model_dump(mode="json")

    # 2. Compute changed fields
    changed_fields = diff_dict_paths(old_assumptions_dict, new_assumptions_dict)
    if pkg_cost_given and not costs_cost_given and "costs.packaging_cost" in changed_fields:
        changed_fields.remove("costs.packaging_cost")
    elif costs_cost_given and not pkg_cost_given and "packaging.packaging_cost" in changed_fields:
        changed_fields.remove("packaging.packaging_cost")

    if not changed_fields:
        # No actual change
        return AssumptionsPatchResponse(
            new_version=product.current_version,
            version_id=latest_version.id if latest_version else uuid.uuid4(),
            changed_fields=[],
            affected_stages=[],
            impact_event=None,
            results=None,
        ), False

    # 3. Create new immutable product version
    new_version_number = product.current_version + 1
    new_version_id = uuid.uuid4()

    change_summary = {
        field_path: {"changed": True}
        for field_path in changed_fields
    }

    new_version_record = ProductVersion(
        id=new_version_id,
        product_id=product.id,
        version_number=new_version_number,
        assumptions=new_assumptions_dict,
        change_summary=change_summary,
        created_by=None,
    )
    db.add(new_version_record)
    product.current_version = new_version_number
    db.flush()

    # 4. Compute affected stages
    affected_stages = get_affected_stages(changed_fields)

    # Capture before state
    last_run = db.scalar(
        select(ValidationRun)
        .where(ValidationRun.product_id == product.id)
        .order_by(ValidationRun.started_at.desc())
        .limit(1)
    )
    before_state = _extract_summary_state(last_run)

    # 5. Revalidate if requested
    revalidated_run: Optional[ValidationRun] = None
    results_responses: Optional[List[StageResultResponse]] = None

    if revalidate:
        orchestrator = ValidationOrchestrator(db)
        revalidated_run = orchestrator.run_validation(
            product_id=product.id,
            version_number=new_version_number,
            stages_to_run=affected_stages,
            trigger="revalidation",
        )
        # Format results response
        results_responses = [
            StageResultResponse(
                stage=r.stage,
                status=r.status,
                score=json.loads(f"{r.score:.2f}") if r.score is not None else None,
                metrics=r.metrics or {},
                findings=[
                    FindingResponse(
                        code=f.get("code", ""),
                        severity=f.get("severity", "info"),
                        message=f.get("message", ""),
                        evidence_ids=f.get("evidence_ids", []),
                        field=f.get("field"),
                    )
                    for f in (r.findings or [])
                ],
                inputs_used=r.inputs_used or [],
                upstream_stages_used=r.upstream or [],
                carried_forward_from=r.carried_forward_from,
            )
            for r in revalidated_run.results
        ]

    # Capture after state
    after_state = _extract_summary_state(revalidated_run if revalidate else last_run)

    # 6. Record ImpactEvent
    impact_event_id = uuid.uuid4()
    impact_event = ImpactEvent(
        id=impact_event_id,
        product_id=product.id,
        from_version=product.current_version - 1,
        to_version=new_version_number,
        changed_fields=changed_fields,
        affected_stages=affected_stages,
        rerun_run_id=revalidated_run.id if revalidated_run else None,
        before=before_state,
        after=after_state,
    )
    db.add(impact_event)
    db.commit()

    impact_resp = ImpactEventResponse(
        id=impact_event.id,
        product_id=impact_event.product_id,
        from_version=impact_event.from_version,
        to_version=impact_event.to_version,
        changed_fields=impact_event.changed_fields,
        affected_stages=impact_event.affected_stages,
        rerun_run_id=impact_event.rerun_run_id,
        before=impact_event.before,
        after=impact_event.after,
        created_at=impact_event.created_at,
    )

    return AssumptionsPatchResponse(
        new_version=new_version_number,
        version_id=new_version_id,
        changed_fields=changed_fields,
        affected_stages=affected_stages,
        impact_event=impact_resp,
        results=results_responses,
    ), True
