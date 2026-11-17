"""Launch readiness assessment and scoring aggregation engine.

Pure Python only:
- Decimal arithmetic with ROUND_HALF_UP
- Pure Decimal arithmetic (zero Python float usage)
- No imports from database, ORM, HTTP clients, or LLMs
- Evaluates FROZEN RULES readiness precedence (1 to 5)
- Computes weighted overall score renormalized over active stages
"""

from dataclasses import dataclass, field
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Dict, List, Optional, Tuple, Union

from backend.app.services.validation.base import StageResult, Status
from backend.app.services.validation.rules_config import (
    CRITICAL_STAGES,
    READINESS_LABEL_INSUFFICIENT_EVIDENCE,
    READINESS_LABEL_NOT_READY,
    READINESS_LABEL_READY,
    READINESS_LABEL_READY_WITH_WARNINGS,
    READINESS_SCORE_CUTOFF_READY,
    READINESS_WARNING_MIN_SCORE,
    STAGE_ORDER,
    STAGE_WEIGHTS,
)

CENTS: Decimal = Decimal("0.01")
RATE_PRECISION: Decimal = Decimal("0.0001")


@dataclass(frozen=True)
class ReadinessResult:
    """The aggregate launch readiness determination."""
    overall_score: Optional[Decimal]
    label: str
    blocking_stages: tuple[str, ...] = field(default_factory=tuple)
    warning_stages: tuple[str, ...] = field(default_factory=tuple)
    missing_stages: tuple[str, ...] = field(default_factory=tuple)
    breakdown: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if isinstance(self.blocking_stages, list):
            object.__setattr__(self, "blocking_stages", tuple(self.blocking_stages))
        if isinstance(self.warning_stages, list):
            object.__setattr__(self, "warning_stages", tuple(self.warning_stages))
        if isinstance(self.missing_stages, list):
            object.__setattr__(self, "missing_stages", tuple(self.missing_stages))


def calculate_readiness(
    results: Union[Dict[str, StageResult], List[StageResult]],
) -> ReadinessResult:
    """
    Computes overall readiness verdict and weighted score from stage results.

    Precedence Order:
    1. Any critical stage FAILED -> NOT_READY
    2. Any critical stage INSUFFICIENT_EVIDENCE or NOT_RUN -> INSUFFICIENT_EVIDENCE
    3. Any other stage FAILED OR overall_score < READINESS_WARNING_MIN_SCORE -> NOT_READY
    4. Any WARNING OR non-critical INSUFFICIENT_EVIDENCE / NOT_RUN OR overall_score < READINESS_SCORE_CUTOFF_READY -> READY_WITH_WARNINGS
    5. All stages PASSED AND overall_score >= READINESS_SCORE_CUTOFF_READY -> READY
    """
    if isinstance(results, list):
        res_map: Dict[str, StageResult] = {r.stage: r for r in results}
    else:
        res_map = dict(results)

    blocking_stages: List[str] = []
    warning_stages: List[str] = []
    missing_stages: List[str] = []
    breakdown: Dict[str, Any] = {}

    scored_items: List[Tuple[str, Decimal, Decimal]] = []  # (stage, score, weight)

    for stage_name in STAGE_ORDER:
        res = res_map.get(stage_name)
        weight = STAGE_WEIGHTS[stage_name]

        if res is None:
            stage_status = Status.NOT_RUN
            stage_score = None
            missing_stages.append(stage_name)
        else:
            stage_status = res.status
            stage_score = res.score
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
            "score": stage_score,
            "weight": weight,
            "is_critical": stage_name in CRITICAL_STAGES,
        }

    # Calculate renormalized weighted score
    overall_score: Optional[Decimal] = None
    if scored_items:
        total_weight = sum(item[2] for item in scored_items)
        if total_weight > Decimal("0"):
            weighted_sum = sum(score * weight for _, score, weight in scored_items)
            raw_score = weighted_sum / total_weight
            overall_score = raw_score.quantize(CENTS, rounding=ROUND_HALF_UP)

            for st_name, sc, wt in scored_items:
                norm_wt = (wt / total_weight).quantize(RATE_PRECISION, rounding=ROUND_HALF_UP)
                weighted_val = (sc * (wt / total_weight)).quantize(CENTS, rounding=ROUND_HALF_UP)
                breakdown[st_name]["normalized_weight"] = norm_wt
                breakdown[st_name]["weighted_score"] = weighted_val

    # Verdict evaluation via strict 5-tier precedence
    critical_failed = [s for s in blocking_stages if s in CRITICAL_STAGES]
    critical_missing = [s for s in missing_stages if s in CRITICAL_STAGES]
    non_critical_failed = [s for s in blocking_stages if s not in CRITICAL_STAGES]
    non_critical_missing = [s for s in missing_stages if s not in CRITICAL_STAGES]

    if critical_failed:
        # Precedence 1: Any critical stage FAILED -> NOT_READY
        label = READINESS_LABEL_NOT_READY
    elif critical_missing:
        # Precedence 2: Any critical stage INSUFFICIENT_EVIDENCE or NOT_RUN -> INSUFFICIENT_EVIDENCE
        label = READINESS_LABEL_INSUFFICIENT_EVIDENCE
    elif non_critical_failed or (overall_score is not None and overall_score < READINESS_WARNING_MIN_SCORE):
        # Precedence 3: Any non-critical stage FAILED OR overall_score < 50.00 -> NOT_READY
        label = READINESS_LABEL_NOT_READY
    elif warning_stages or non_critical_missing or (overall_score is not None and overall_score < READINESS_SCORE_CUTOFF_READY):
        # Precedence 4: Any WARNING OR non-critical missing OR overall_score < 70.00 -> READY_WITH_WARNINGS
        label = READINESS_LABEL_READY_WITH_WARNINGS
    else:
        # Precedence 5: All stages PASSED and overall_score >= 70.00 -> READY
        label = READINESS_LABEL_READY

    return ReadinessResult(
        overall_score=overall_score,
        label=label,
        blocking_stages=tuple(blocking_stages),
        warning_stages=tuple(warning_stages),
        missing_stages=tuple(missing_stages),
        breakdown=breakdown,
    )


__all__ = ["ReadinessResult", "calculate_readiness"]
