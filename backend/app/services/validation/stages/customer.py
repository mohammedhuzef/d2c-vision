from decimal import Decimal
from typing import Any, List
from backend.app.services.validation.base import Finding, FindingCode, Stage, StageContext, StageResult, Status
from backend.app.services.validation import rules_config


class CustomerStage(Stage):
    name = "customer"

    def run(self, ctx: StageContext) -> StageResult:
        inputs_used = [
            "customer.target_customer",
            "customer.problem_statement",
            "customer.customer_interviews_count",
            "customer.segment_size_estimate",
            "customer.willingness_to_pay_signal",
        ]
        cust = getattr(ctx.assumptions, "customer", None) if ctx.assumptions else None
        findings: List[Finding] = []

        target_cust = getattr(cust, "target_customer", None) if cust else None
        problem = getattr(cust, "problem_statement", None) if cust else None
        interviews = getattr(cust, "customer_interviews_count", None) if cust else None
        segment = getattr(cust, "segment_size_estimate", None) if cust else None
        wtp = getattr(cust, "willingness_to_pay_signal", None) if cust else None

        metrics = {
            "customer_interviews_count": interviews,
            "segment_size_estimate": segment,
            "willingness_to_pay_signal": wtp,
        }

        # Required input missing -> INSUFFICIENT_EVIDENCE (return early, one MISSING_INPUT finding per field)
        if not target_cust or not target_cust.strip():
            findings.append(
                Finding(
                    code=FindingCode("MISSING_INPUT", "CUSTOMER_TARGET_MISSING", "MISSING_INPUT:customer.target_customer"),
                    severity="critical",
                    message="Target customer profile is not defined.",
                    field="customer.target_customer",
                )
            )

        if not problem or not problem.strip():
            findings.append(
                Finding(
                    code=FindingCode("MISSING_INPUT", "CUSTOMER_PROBLEM_MISSING", "MISSING_INPUT:customer.problem_statement"),
                    severity="critical",
                    message="Customer problem statement is not defined.",
                    field="customer.problem_statement",
                )
            )

        if interviews is None:
            findings.append(
                Finding(
                    code=FindingCode("MISSING_INPUT", "CUSTOMER_INTERVIEWS_MISSING", "MISSING_INPUT:customer.customer_interviews_count"),
                    severity="critical",
                    message="Customer interviews count is missing.",
                    field="customer.customer_interviews_count",
                )
            )

        if findings:
            status = Status.INSUFFICIENT_EVIDENCE
            return StageResult(
                stage=self.name,
                status=status,
                score=rules_config.score_from(status, findings),
                metrics=metrics,
                findings=findings,
                inputs_used=inputs_used,
                upstream_stages_used=[],
            )

        # Precedence rule on interviews count
        if interviews < rules_config.CUSTOMER_MIN_INTERVIEWS:
            findings.append(
                Finding(
                    code=FindingCode("CUSTOMER_INTERVIEWS_INSUFFICIENT", "MISSING_INPUT:customer.customer_interviews_count"),
                    severity="critical",
                    message=f"Only {interviews} customer interviews conducted. Minimum {rules_config.CUSTOMER_MIN_INTERVIEWS} required for validation.",
                    field="customer.customer_interviews_count",
                )
            )
            status = Status.INSUFFICIENT_EVIDENCE
        elif interviews < rules_config.CUSTOMER_STRONG_INTERVIEWS:
            findings.append(
                Finding(
                    code="CUSTOMER_INTERVIEWS_LOW",
                    severity="warning",
                    message=f"Conducted {interviews} interviews. Validating with {rules_config.CUSTOMER_STRONG_INTERVIEWS}+ interviews is strongly recommended before launch.",
                    field="customer.customer_interviews_count",
                )
            )
            status = Status.WARNING
        else:
            status = Status.PASSED

        return StageResult(
            stage=self.name,
            status=status,
            score=rules_config.score_from(status, findings),
            metrics=metrics,
            findings=findings,
            inputs_used=inputs_used,
            upstream_stages_used=[],
        )
