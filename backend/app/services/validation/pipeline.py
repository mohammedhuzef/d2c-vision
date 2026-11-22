"""Validation pipeline execution engine for LaunchTwin AI.

Executes validation stages in deterministic STAGE_ORDER with support for:
- Selective stage execution based on dependency closure
- Carry-forward of unaffected stage results from previous runs
- Upstream result propagation between stages
- Crash isolation: exceptions in a stage are trapped without terminating the pipeline
"""

import dataclasses
import logging
from typing import Any, Mapping, Optional, Sequence

from backend.app.services.validation.base import Finding, Severity, Stage, StageContext, StageResult, Status
from backend.app.services.validation.dependencies import DOWNSTREAM_MAP
from backend.app.services.validation.rules_config import STAGE_ORDER
from backend.app.services.validation.stages import (
    CompetitorStage,
    CustomerStage,
    FinancialStage,
    MarketingStage,
    PricingStage,
    ProductPackagingStage,
)

logger = logging.getLogger(__name__)

STAGE_REGISTRY: dict[str, type[Stage]] = {
    "customer": CustomerStage,
    "competitor": CompetitorStage,
    "product_packaging": ProductPackagingStage,
    "pricing": PricingStage,
    "financial": FinancialStage,
    "marketing": MarketingStage,
}


def run_pipeline(
    assumptions: Any,
    evidence: Sequence[Any],
    competitor_analyses: Sequence[Any],
    *,
    stages: Optional[Sequence[str]] = None,
    previous: Optional[Mapping[str, Any]] = None,
    is_demo: bool = False,
) -> dict[str, StageResult]:
    """Executes validation stages across the project assumptions and evidence.

    Args:
        assumptions: Product and business assumptions (dict or object).
        evidence: Sequence of research evidence items.
        competitor_analyses: Sequence of competitor benchmark analyses.
        stages: Optional subset of stage names to execute. If None, all stages run.
        previous: Optional mapping stage_name -> (StageResult, result_id) from an earlier run.

    Returns:
        Dictionary mapping stage names to their StageResult, ordered strictly by STAGE_ORDER.
    """
    # 1. Determine which stages must be freshly executed
    if stages is None:
        to_execute = set(STAGE_ORDER)
    else:
        to_execute = set(stages)

    # If a requested stage is not in previous, it must be executed anyway
    for stage_name in STAGE_ORDER:
        if previous is None or stage_name not in previous or previous[stage_name] is None:
            to_execute.add(stage_name)

    # Any stage downstream of an executed stage must also be re-executed
    queue = list(to_execute)
    while queue:
        current = queue.pop(0)
        for downstream in DOWNSTREAM_MAP.get(current, ()):
            if downstream not in to_execute:
                to_execute.add(downstream)
                queue.append(downstream)

    results_so_far: dict[str, StageResult] = {}

    # 2. Iterate through stages in canonical STAGE_ORDER
    for stage_name in STAGE_ORDER:
        stage_cls = STAGE_REGISTRY.get(stage_name)
        if stage_cls is None:
            continue

        if stage_name in to_execute:
            # Stage must be executed
            stage_instance = stage_cls()
            ctx = StageContext(
                assumptions=assumptions,
                evidence=tuple(evidence),
                competitor_analyses=tuple(competitor_analyses),
                upstream=dict(results_so_far),
                is_demo=is_demo,
            )
            try:
                res = stage_instance.run(ctx)
            except Exception:
                logger.exception("Unexpected error executing validation stage '%s'", stage_name)
                res = StageResult(
                    stage=stage_name,
                    status=Status.NOT_RUN,
                    score=None,
                    metrics={},
                    findings=(
                        Finding(
                            code="STAGE_ERROR",
                            severity=Severity.CRITICAL,
                            message="An unexpected error occurred during validation of this stage.",
                        ),
                    ),
                    inputs_used=(),
                    upstream_stages_used=(),
                )
            results_so_far[stage_name] = res
        else:
            # Carry forward from previous
            prev_entry = previous[stage_name]
            if isinstance(prev_entry, tuple) and len(prev_entry) == 2:
                prev_result, result_id = prev_entry
            elif isinstance(prev_entry, StageResult):
                prev_result = prev_entry
                result_id = getattr(prev_result, "carried_forward_from", None) or "previous"
            else:
                prev_result = prev_entry[0]
                result_id = prev_entry[1]

            carried = dataclasses.replace(
                prev_result,
                carried_forward_from=str(result_id) if result_id is not None else None,
            )
            results_so_far[stage_name] = carried

    return {name: results_so_far[name] for name in STAGE_ORDER if name in results_so_far}

