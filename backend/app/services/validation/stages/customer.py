"""Customer validation stage.

Evaluates qualitative customer research assumptions:
- target_customer, problem_statement, customer_interviews_count are required
- < 5 interviews -> INSUFFICIENT_EVIDENCE
- 5 to 9 interviews -> WARNING
- >= 10 interviews -> PASSED
"""

from typing import Any, List, Optional
from backend.app.services.validation.base import Finding, Severity, Stage, StageContext, StageResult, Status
from backend.app.services.validation.rules_config import (
    CUSTOMER_MIN_INTERVIEWS,
    CUSTOMER_STRONG_INTERVIEWS,
)
from backend.app.services.validation.scoring import score_from

EMITTED_CODES: frozenset[str] = frozenset({
    "MISSING_INPUT",
    "CUSTOMER_INTERVIEWS_INSUFFICIENT",
    "CUSTOMER_INTERVIEWS_LOW",
})


class CustomerStage(Stage):
    @property
    def name(self) -> str:
        return "customer"

    def run(self, ctx: StageContext) -> StageResult:
        inputs_used = [
            "customer.target_customer",
            "customer.problem_statement",
            "customer.customer_interviews_count",
            "customer.segment_size_estimate",
            "customer.willingness_to_pay_signal",
        ]

        assumptions = ctx.assumptions or {}
        cust = assumptions.get("customer") if isinstance(assumptions, dict) else getattr(assumptions, "customer", None)

        target_customer = None
        problem_statement = None
        interviews_count = None
        segment_size = None
        wtp_signal = None

        if cust is not None:
            if isinstance(cust, dict):
                target_customer = cust.get("target_customer")
                problem_statement = cust.get("problem_statement")
                interviews_count = cust.get("customer_interviews_count")
                segment_size = cust.get("segment_size_estimate")
                wtp_signal = cust.get("willingness_to_pay_signal")
            else:
                target_customer = getattr(cust, "target_customer", None)
                problem_statement = getattr(cust, "problem_statement", None)
                interviews_count = getattr(cust, "customer_interviews_count", None)
                segment_size = getattr(cust, "segment_size_estimate", None)
                wtp_signal = getattr(cust, "willingness_to_pay_signal", None)

        metrics: dict[str, Any] = {
            "customer_interviews_count": interviews_count,
            "segment_size_estimate": segment_size,
            "willingness_to_pay_signal": wtp_signal,
        }

        # Check required fields; return early with INSUFFICIENT_EVIDENCE if missing
        missing_findings: List[Finding] = []
        if not target_customer or not str(target_customer).strip():
            missing_findings.append(
                Finding(
                    code="MISSING_INPUT",
                    severity=Severity.CRITICAL,
                    message="Target customer profile is missing or empty.",
                    field="customer.target_customer",
                )
            )

        if not problem_statement or not str(problem_statement).strip():
            missing_findings.append(
                Finding(
                    code="MISSING_INPUT",
                    severity=Severity.CRITICAL,
                    message="Customer problem statement is missing or empty.",
                    field="customer.problem_statement",
                )
            )

        if interviews_count is None:
            missing_findings.append(
                Finding(
                    code="MISSING_INPUT",
                    severity=Severity.CRITICAL,
                    message="Customer interviews count is missing.",
                    field="customer.customer_interviews_count",
                )
            )

        if missing_findings:
            status = Status.INSUFFICIENT_EVIDENCE
            return StageResult(
                stage=self.name,
                status=status,
                score=score_from(status, missing_findings),
                metrics=metrics,
                findings=tuple(missing_findings),
                inputs_used=tuple(inputs_used),
                upstream_stages_used=(),
            )

        # Threshold rules on customer_interviews_count
        findings: List[Finding] = []
        int_count = int(interviews_count)

        if int_count < CUSTOMER_MIN_INTERVIEWS:
            status = Status.INSUFFICIENT_EVIDENCE
            findings.append(
                Finding(
                    code="CUSTOMER_INTERVIEWS_INSUFFICIENT",
                    severity=Severity.CRITICAL,
                    message=(
                        f"Only {int_count} customer interviews conducted. "
                        f"Minimum {CUSTOMER_MIN_INTERVIEWS} required for validation."
                    ),
                    field="customer.customer_interviews_count",
                )
            )
        elif int_count < CUSTOMER_STRONG_INTERVIEWS:
            status = Status.WARNING
            findings.append(
                Finding(
                    code="CUSTOMER_INTERVIEWS_LOW",
                    severity=Severity.WARNING,
                    message=(
                        f"Conducted {int_count} interviews. Validating with "
                        f"{CUSTOMER_STRONG_INTERVIEWS}+ interviews is recommended before launch."
                    ),
                    field="customer.customer_interviews_count",
                )
            )
        else:
            status = Status.PASSED

        return StageResult(
            stage=self.name,
            status=status,
            score=score_from(status, findings),
            metrics=metrics,
            findings=tuple(findings),
            inputs_used=tuple(inputs_used),
            upstream_stages_used=(),
        )


__all__ = ["CustomerStage"]

