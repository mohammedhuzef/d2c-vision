"""Shared pure validation pipeline execution.

Pure functions: plain data in, plain data out, no DB, no network, no LLM.
Executes validation stages in STAGE_ORDER, isolates stage crashes, and computes
readiness and recommendations.
"""

import logging
from typing import List, Optional, Tuple

from backend.app.services.validation.base import Finding, StageContext, StageResult, Status, STAGE_ORDER
from backend.app.services.validation.stages import STAGE_MAP, ORDERED_STAGE_NAMES
from backend.app.services.readiness import calculate_readiness, ReadinessResult
from backend.app.services.validation.recommendations import generate_recommendations, Recommendation

logger = logging.getLogger(__name__)


def execute_stages(
    ctx: StageContext,
    stage_names: Optional[List[str]] = None,
) -> List[StageResult]:
    """
    Executes stages in order, isolating unexpected crashes into NOT_RUN stage results.
    Updates ctx.upstream as stages finish so downstream stages have upstream results.
    """
    ordered = stage_names if stage_names is not None else ORDERED_STAGE_NAMES
    results: List[StageResult] = []

    for stage_name in ordered:
        stage_instance = STAGE_MAP[stage_name]
        try:
            result = stage_instance.run(ctx)
        except Exception as exc:
            logger.error(
                f"Validation stage '{stage_name}' encountered unexpected internal error: {exc}",
                exc_info=True,
            )
            result = StageResult(
                stage=stage_name,
                status=Status.NOT_RUN,
                score=None,
                metrics={},
                findings=[
                    Finding(
                        code="STAGE_ERROR",
                        severity="critical",
                        message=f"Stage '{stage_name}' encountered an unexpected internal error: {type(exc).__name__}",
                    )
                ],
                inputs_used=[],
                upstream_stages_used=list(ctx.upstream.keys()),
            )

        ctx.upstream[stage_name] = result
        results.append(result)

    return results


def run_pipeline(
    ctx: StageContext,
) -> Tuple[List[StageResult], ReadinessResult, List[Recommendation]]:
    """
    Runs all six validation stages in STAGE_ORDER, followed by pure readiness
    aggregation and recommendations generation.
    """
    stage_results = execute_stages(ctx)
    readiness_res = calculate_readiness(stage_results)
    recommendations = generate_recommendations(
        stage_results=stage_results,
        assumptions=ctx.assumptions,
        readiness=readiness_res,
    )
    return stage_results, readiness_res, recommendations
