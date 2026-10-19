"""Deterministic recommendation generation, prioritisation, ordering, and deduplication.

Pure function: Takes StageResults, Assumptions, and optional ReadinessResult.
Produces a deterministically ordered, deduplicated List[Recommendation].
No DB, no network, Decimal only.
"""

from typing import Any, Dict, List, Optional, Set, Tuple

from backend.app.services.validation.base import StageResult, Status, STAGE_ORDER
from backend.app.services.validation import rules_config
from backend.app.services.validation.recommendations.models import Priority, Recommendation
from backend.app.services.validation.recommendations.rules import RECOMMENDATION_RULE_TABLE


def _get_sort_key(rec: Recommendation, stage_results_map: Dict[str, StageResult]) -> Tuple[int, int, str, str, str]:
    """
    Deterministic sort key:
    1. Priority Rank:
       - FAILED critical stage finding -> 0
       - Other FAILED stage finding -> 1
       - WARNING finding -> 2
       - INSUFFICIENT_EVIDENCE / MISSING_INPUT -> 3
       - Info finding -> 4
    2. STAGE_ORDER index (customer -> competitor -> product_packaging -> pricing -> financial -> marketing)
    3. Finding / Recommendation code (alphabetical)
    4. Target field (alphabetical)
    5. Action type (alphabetical)
    """
    sr = stage_results_map.get(rec.stage)
    stage_status = sr.status if sr else Status.NOT_RUN
    is_critical_stage = rec.stage in rules_config.CRITICAL_STAGES

    if stage_status == Status.FAILED and is_critical_stage:
        rank = rules_config.RECOMMENDATION_RANK_FAILED_CRITICAL
    elif stage_status == Status.FAILED:
        rank = rules_config.RECOMMENDATION_RANK_FAILED_NON_CRITICAL
    elif rec.priority == Priority.CRITICAL:
        rank = rules_config.RECOMMENDATION_RANK_FAILED_CRITICAL
    elif rec.priority == Priority.HIGH:
        rank = rules_config.RECOMMENDATION_RANK_FAILED_NON_CRITICAL
    elif rec.priority == Priority.MEDIUM or stage_status == Status.WARNING:
        rank = rules_config.RECOMMENDATION_RANK_WARNING
    elif stage_status == Status.INSUFFICIENT_EVIDENCE:
        rank = rules_config.RECOMMENDATION_RANK_INSUFFICIENT_INPUT
    else:
        rank = rules_config.RECOMMENDATION_RANK_INFO

    stage_idx = STAGE_ORDER.index(rec.stage) if rec.stage in STAGE_ORDER else 99
    code_str = str(rec.code)
    field_str = rec.target_field or ""
    action_str = str(rec.action_type)

    return (rank, stage_idx, code_str, field_str, action_str)


def generate_recommendations(
    stage_results: List[StageResult],
    assumptions: Any,
    readiness: Optional[Any] = None,
) -> List[Recommendation]:
    """
    Generates, prioritizes, deduplicates, and deterministically orders recommendations
    across all validation stage results.

    - PASSED stages produce no recommendations.
    - Findings mapped via RECOMMENDATION_RULE_TABLE.
    - Deterministic tie-breaking by STAGE_ORDER, code, target_field.
    - Duplicate cap: one recommendation per (code, target_field).
    - Alternative grouping preserved for margin adjustments.
    """
    stage_results_map: Dict[str, StageResult] = {sr.stage: sr for sr in stage_results}
    raw_recommendations: List[Recommendation] = []

    for sr in stage_results:
        # PASSED stages produce no recommendations
        if sr.status == Status.PASSED:
            continue

        for finding in sr.findings:
            raw_code = str(finding.code)
            # Find matching rule: check raw_code or canonical code if present
            builder = RECOMMENDATION_RULE_TABLE.get(raw_code)
            if not builder and hasattr(finding.code, "canonical"):
                builder = RECOMMENDATION_RULE_TABLE.get(str(finding.code.canonical))

            # If it's a field-qualified MISSING_INPUT or NEGATIVE_COST:
            if not builder and raw_code.startswith("MISSING_INPUT:"):
                builder = RECOMMENDATION_RULE_TABLE.get("MISSING_INPUT")
            if not builder and raw_code.startswith("NEGATIVE_COST"):
                builder = RECOMMENDATION_RULE_TABLE.get("NEGATIVE_COST")
            if not builder and raw_code.startswith("MISSING_UPSTREAM"):
                builder = RECOMMENDATION_RULE_TABLE.get("MISSING_UPSTREAM")

            if builder:
                built_recs = builder(finding, sr, assumptions)
                raw_recommendations.extend(built_recs)

    # Sort deterministically
    sorted_recs = sorted(raw_recommendations, key=lambda r: _get_sort_key(r, stage_results_map))

    # Deduplicate: cap at one recommendation per (code, target_field)
    seen_keys: Set[Tuple[str, str]] = set()
    deduped_recs: List[Recommendation] = []

    for rec in sorted_recs:
        key = (rec.code, rec.target_field or "")
        if key not in seen_keys:
            seen_keys.add(key)
            deduped_recs.append(rec)

    return deduped_recs
