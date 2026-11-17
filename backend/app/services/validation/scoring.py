"""Deterministic scoring function for validation stages.

Calculates stage scores according to FROZEN RULES:
- INSUFFICIENT_EVIDENCE or NOT_RUN -> None
- Base score starts at 100.00
- Warning finding: -25.00 points each
- Critical finding: -30.00 points each
- FAILED stage: score capped at 40.00
- Score is floored at 0.00 (never negative)
- Quantized to 2 decimal places (ROUND_HALF_UP)
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Iterable, Optional, Union

from backend.app.services.validation.base import Finding, Severity, Status
from backend.app.services.validation.rules_config import (
    BASE_SCORE,
    CRITICAL_DEDUCTION,
    FAILED_CAP,
    MIN_SCORE,
    WARNING_DEDUCTION,
)


def score_from(
    status: Union[Status, str],
    findings: Iterable[Finding] = (),
) -> Optional[Decimal]:
    """Computes deterministic stage score from status and findings."""
    if isinstance(status, str):
        status = Status(status)

    if status in (Status.INSUFFICIENT_EVIDENCE, Status.NOT_RUN):
        return None

    score = BASE_SCORE

    for f in findings:
        sev = f.severity if isinstance(f.severity, Severity) else Severity(f.severity)
        if sev == Severity.WARNING:
            score -= WARNING_DEDUCTION
        elif sev == Severity.CRITICAL:
            score -= CRITICAL_DEDUCTION

    if status == Status.FAILED:
        score = min(score, FAILED_CAP)

    score = max(score, MIN_SCORE)

    return score.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


__all__ = ["score_from"]

