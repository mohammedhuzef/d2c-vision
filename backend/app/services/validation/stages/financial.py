from decimal import Decimal
from typing import List
from backend.app.services.validation.base import Finding, FindingCode, Stage, StageContext, StageResult, Status
from backend.app.services.validation import rules_config
from backend.app.services.finance import calculate_financials, to_metrics_dict


class FinancialStage(Stage):
    name = "financial"

    def run(self, ctx: StageContext) -> StageResult:
        inputs_used = [
            "pricing.selling_price",
            "costs.cogs_per_unit",
            "packaging.packaging_cost",
            "costs.shipping_cost_per_unit",
            "costs.fixed_costs_total",
        ]
        upstream_used = ["pricing"]
        pricing = getattr(ctx.assumptions, "pricing", None) if ctx.assumptions else None
        target_margin = getattr(pricing, "target_margin_fraction", None) if pricing else None
        if target_margin is None:
            target_margin = rules_config.PRICING_TARGET_MARGIN_DEFAULT

        fin_result = calculate_financials(ctx.assumptions)
        findings: List[Finding] = []

        # Map finance issues to findings
        has_blocking_missing = False
        for issue in fin_result.issues:
            if issue.code.startswith("MISSING_INPUT"):
                has_blocking_missing = True
                findings.append(
                    Finding(
                        code=FindingCode("MISSING_INPUT", issue.code),
                        severity="critical",
                        message=issue.message,
                        field=issue.field,
                    )
                )
            elif issue.code in ("NEGATIVE_CONTRIBUTION", "ZERO_CONTRIBUTION"):
                findings.append(
                    Finding(
                        code=FindingCode("FINANCIAL_UNIT_ECONOMICS_NEGATIVE", issue.code),
                        severity="critical",
                        message=f"Unit economics are non-viable: {issue.message}.",
                        field=issue.field,
                    )
                )
            elif issue.code.startswith("NEGATIVE_COST"):
                has_blocking_missing = True
                findings.append(
                    Finding(
                        code=issue.code,
                        severity="critical",
                        message=issue.message,
                        field=issue.field,
                    )
                )
            elif issue.code in ("NON_POSITIVE_PRICE", "INVALID_FRACTION", "INVALID_NUMBER"):
                has_blocking_missing = True
                findings.append(
                    Finding(
                        code=issue.code,
                        severity="critical",
                        message=issue.message,
                        field=issue.field,
                    )
                )

        metrics = to_metrics_dict(fin_result)
        break_even = fin_result.break_even_units
        margin = fin_result.contribution_margin
        contribution = fin_result.contribution_per_unit

        # Threshold checks on valid metrics
        if break_even is not None and break_even > rules_config.FINANCIAL_BREAK_EVEN_WARN_UNITS:
            findings.append(
                Finding(
                    code="FINANCIAL_HIGH_BREAK_EVEN_VOLUME",
                    severity="warning",
                    message=f"High break-even volume required: {break_even} units exceeds threshold of {rules_config.FINANCIAL_BREAK_EVEN_WARN_UNITS}.",
                    field="costs.fixed_costs_total",
                )
            )

        if margin is not None and margin < target_margin:
            pct_margin = margin * Decimal("100")
            pct_target = target_margin * Decimal("100")
            findings.append(
                Finding(
                    code="FINANCIAL_MARGIN_BELOW_TARGET",
                    severity="warning",
                    message=f"Realized contribution margin of {pct_margin:.1f}% is below target of {pct_target:.0f}%.",
                    field="pricing.target_margin_fraction",
                )
            )

        # Status determination:
        # INSUFFICIENT_EVIDENCE if metrics are null because of missing inputs
        if has_blocking_missing or fin_result.variable_cost_per_unit is None:
            status = Status.INSUFFICIENT_EVIDENCE
        elif contribution is not None and contribution <= Decimal("0"):
            status = Status.FAILED
        else:
            warning_count = sum(1 for f in findings if f.severity == "warning")
            if warning_count > 0:
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
            upstream_stages_used=upstream_used,
        )
