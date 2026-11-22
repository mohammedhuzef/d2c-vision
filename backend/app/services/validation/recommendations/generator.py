"""Deterministic recommendation generation engine for LaunchTwin AI validation runs.

Aggregates findings across evaluated stages and transforms them into prioritized,
actionable recommendation items.
"""

from typing import Any, Mapping, Optional, Sequence, Union

from backend.app.services.validation.base import StageResult, Status
from backend.app.services.validation.recommendations.models import RecommendationItem
from backend.app.services.validation.recommendations.rules import (
    _build_generic_assumption_review,
    RECOMMENDATION_RULES,
)
from backend.app.services.validation.rules_config import (
    RECOMMENDATION_PRIORITY_RANK,
    STAGE_ORDER,
)


def generate(
    stage_results: Union[Mapping[str, StageResult], Sequence[StageResult]],
    assumptions: dict[str, Any],
) -> list[RecommendationItem]:
    """Generates prioritized and deduplicated recommendations from validation stage outcomes.

    Args:
        stage_results: Mapping or sequence of StageResult objects from pipeline execution.
        assumptions: Product and financial assumptions dictionary.

    Returns:
        List of RecommendationItem objects sorted by priority, STAGE_ORDER, and code.
    """
    if isinstance(stage_results, Mapping):
        results_list = [stage_results[name] for name in STAGE_ORDER if name in stage_results]
    else:
        results_list = list(stage_results)

    raw_recommendations: list[RecommendationItem] = []
    seen_keys: set[tuple[str, str, Optional[str]]] = set()

    for result in results_list:
        # Rule: PASSED stages produce nothing
        if result.status == Status.PASSED:
            continue

        for finding in result.findings:
            builder = RECOMMENDATION_RULES.get(finding.code, _build_generic_assumption_review)
            items = builder(finding, result, assumptions)

            for item in items:
                # Deduplication key: one recommendation per (code, target_field) within a stage
                dedup_key = (item.stage, item.code, item.target_field)
                if dedup_key in seen_keys:
                    continue
                seen_keys.add(dedup_key)
                raw_recommendations.append(item)

    # Sort deterministically:
    # 1. Priority rank (CRITICAL=0, HIGH=1, MEDIUM=2, LOW=3)
    # 2. Canonical STAGE_ORDER rank (0 to 5)
    # 3. Code (alphabetical)
    # 4. Target field
    def sort_key(item: RecommendationItem) -> tuple[int, int, str, str]:
        p_rank = RECOMMENDATION_PRIORITY_RANK.get(item.priority, 99)
        s_rank = STAGE_ORDER.index(item.stage) if item.stage in STAGE_ORDER else 99
        return (p_rank, s_rank, item.code, item.target_field or "")

    return sorted(raw_recommendations, key=sort_key)

