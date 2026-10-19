"""Readiness aggregation engine.

Computes project readiness status, overall weighted score, and stage-by-stage
breakdowns from validation stage results.
This module is pure: plain data in, plain data out, no DB, no network,
and strict Decimal arithmetic.
"""

from dataclasses import dataclass, field
from decimal import Decimal, ROUND_HALF_UP, localcontext
import json
from typing import Any, Dict, List, Optional, Tuple, Union

from backend.app.services.validation.base import StageResult, Status, STAGE_ORDER
from backend.app.services.validation import rules_config


@dataclass(frozen=True)
class ReadinessResult:
    overall_score: Optional[Decimal]
    label: str  # "READY" | "READY_WITH_WARNINGS" | "NOT_READY" | "INSUFFICIENT_EVIDENCE"
    blocking_stages: List[str] = field(default_factory=list)
    warning_stages: List[str] = field(default_factory=list)
    missing_stages: List[str] = field(default_factory=list)
    breakdown: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize readiness result for JSON/JSONB storage adhering to 5A formatting rules."""
        score_val = None
        if self.overall_score is not None:
            score_val = json.loads(f"{self.overall_score:.2f}")

        return {
            "overall_score": score_val,
            "label": self.label,
            "blocking_stages": list(self.blocking_stages),
            "warning_stages": list(self.warning_stages),
            "missing_stages": list(self.missing_stages),
            "breakdown": self.breakdown,
        }


def calculate_readiness(
    results: Union[Dict[str, StageResult], List[StageResult]],
) -> ReadinessResult:
    """
    Pure aggregation function calculating project readiness and weighted overall score.

    Rules in strict precedence order:
    1. Any CRITICAL_STAGES result FAILED -> NOT_READY
    2. Any critical stage INSUFFICIENT_EVIDENCE or NOT_RUN -> INSUFFICIENT_EVIDENCE
    3. Any non-critical stage FAILED -> NOT_READY
    4. Any WARNING or any non-critical INSUFFICIENT_EVIDENCE / NOT_RUN -> READY_WITH_WARNINGS
    5. Else -> READY (downgraded to READY_WITH_WARNINGS if score < config threshold)

    overall_score: weighted average of non-null stage scores using STAGE_WEIGHTS_DECIMAL
    renormalized over stages that have non-null scores. Null if no stage has a score.
    A non-null overall_score never contradicts the label (FAILED critical can never show READY).
    """
    if isinstance(results, list):
        res_map: Dict[str, StageResult] = {r.stage: r for r in results}
    else:
        res_map = dict(results)

    critical_stages = set(rules_config.CRITICAL_STAGES)

    blocking_stages: List[str] = []
    warning_stages: List[str] = []
    missing_stages: List[str] = []
    breakdown: Dict[str, Any] = {}

    # Scored stages accumulator
    scored_items: List[Tuple[str, Decimal, Decimal]] = []  # (stage, score, weight)

    with localcontext() as ctx:
        ctx.prec = 50

        # Build breakdown and partition stages
        for stage_name in STAGE_ORDER:
            res = res_map.get(stage_name)
            weight = rules_config.STAGE_WEIGHTS_DECIMAL.get(stage_name, rules_config.DEFAULT_STAGE_WEIGHT_DECIMAL)

            if res is None:
                stage_status = Status.NOT_RUN
                stage_score: Optional[Decimal] = None
                missing_stages.append(stage_name)
            else:
                stage_status = res.status
                stage_score = Decimal(str(res.score)) if res.score is not None else None
                if stage_status in (Status.INSUFFICIENT_EVIDENCE, Status.NOT_RUN):
                    missing_stages.append(stage_name)
                elif stage_status == Status.WARNING:
                    warning_stages.append(stage_name)
                elif stage_status == Status.FAILED:
                    blocking_stages.append(stage_name)

            if stage_score is not None and stage_status not in (Status.INSUFFICIENT_EVIDENCE, Status.NOT_RUN):
                scored_items.append((stage_name, stage_score, weight))

            breakdown[stage_name] = {
                "status": stage_status.value if isinstance(stage_status, Status) else str(stage_status),
                "score": json.loads(f"{stage_score:.2f}") if stage_score is not None else None,
                "weight": json.loads(f"{weight:.4f}"),
                "is_critical": stage_name in critical_stages,
            }

        # Calculate renormalized weighted score
        overall_score: Optional[Decimal] = None
        if scored_items:
            total_weight = sum(item[2] for item in scored_items)
            if total_weight > Decimal("0"):
                weighted_sum = sum(score * weight for _, score, weight in scored_items)
                raw_score = weighted_sum / total_weight
                overall_score = raw_score.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

                # Annotate breakdown with normalized weights and weighted contribution
                for st_name, sc, wt in scored_items:
                    norm_wt = (wt / total_weight).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
                    weighted_val = (sc * (wt / total_weight)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    breakdown[st_name]["normalized_weight"] = json.loads(f"{norm_wt:.4f}")
                    breakdown[st_name]["weighted_score"] = json.loads(f"{weighted_val:.2f}")

    # Determine Label by strict precedence
    critical_failed = [s for s in blocking_stages if s in critical_stages]
    critical_missing = [s for s in missing_stages if s in critical_stages]
    non_critical_failed = [s for s in blocking_stages if s not in critical_stages]
    non_critical_missing = [s for s in missing_stages if s not in critical_stages]

    if critical_failed:
        # Precedence Rule 1: any critical stage FAILED -> NOT_READY
        label = rules_config.READINESS_LABEL_NOT_READY
    elif critical_missing:
        # Precedence Rule 2: any critical stage INSUFFICIENT_EVIDENCE or NOT_RUN -> INSUFFICIENT_EVIDENCE
        label = rules_config.READINESS_LABEL_INSUFFICIENT_EVIDENCE
    elif non_critical_failed:
        # Precedence Rule 3: any non-critical stage FAILED -> NOT_READY
        label = rules_config.READINESS_LABEL_NOT_READY
    elif warning_stages or non_critical_missing:
        # Precedence Rule 4: any WARNING or any non-critical INSUFFICIENT_EVIDENCE -> READY_WITH_WARNINGS
        label = rules_config.READINESS_LABEL_READY_WITH_WARNINGS
    else:
        # Precedence Rule 5: else READY (all stages PASSED)
        label = rules_config.READINESS_LABEL_READY
        # Non-contradiction check: if overall score is below threshold, cannot be unconditionally READY
        if overall_score is not None and overall_score < rules_config.READINESS_SCORE_CUTOFF_READY:
            label = rules_config.READINESS_LABEL_READY_WITH_WARNINGS

    return ReadinessResult(
        overall_score=overall_score,
        label=label,
        blocking_stages=blocking_stages,
        warning_stages=warning_stages,
        missing_stages=missing_stages,
        breakdown=breakdown,
    )


def compute_readiness(results: List[StageResult]) -> Tuple[float, str]:
    """
    Backwards-compatibility wrapper for legacy tests and callers.
    Maps results to legacy (score: float, verdict: GO | GO_WITH_CONDITIONS | NO_GO | INSUFFICIENT_EVIDENCE).
    """
    insufficient_count = sum(1 for r in results if r.status == Status.INSUFFICIENT_EVIDENCE)
    has_failed_critical = any(
        r.status == Status.FAILED and r.stage in rules_config.CRITICAL_STAGES
        for r in results
    )
    has_any_failed = any(r.status == Status.FAILED for r in results)

    # Use pure calculate_readiness to get deterministic score
    aggregated = calculate_readiness(results)
    if aggregated.overall_score is not None:
        score_val = json.loads(f"{aggregated.overall_score:.2f}")
    else:
        score_val = 0.0

    if insufficient_count >= 2:
        verdict = "INSUFFICIENT_EVIDENCE"
    elif has_failed_critical:
        verdict = "NO_GO"
    elif score_val >= rules_config.READINESS_GO_THRESHOLD and not has_any_failed:
        verdict = "GO"
    elif score_val >= rules_config.READINESS_CONDITIONS_THRESHOLD:
        verdict = "GO_WITH_CONDITIONS"
    else:
        verdict = "NO_GO"

    return score_val, verdict
