"""Financial validation stage.

Evaluates unit economics, break-even volume, and margin health using finance.py:
- contribution <= 0 -> FAILED (FINANCIAL_UNIT_ECONOMICS_NEGATIVE)
- break_even_units > FINANCIAL_BREAK_EVEN_WARN_UNITS -> WARNING (FINANCIAL_HIGH_BREAK_EVEN_VOLUME)
- Maps every finance Issue to a Finding
- Missing inputs -> INSUFFICIENT_EVIDENCE
"""

from decimal import Decimal
from typing import Any, List, Optional
from backend.app.services.finance import calculate_financials, to_decimal
from backend.app.services.validation.base import Finding, Severity, Stage, StageContext, StageResult, Status
from backend.app.services.validation.rules_config import (
    FINANCIAL_BREAK_EVEN_WARN_UNITS,
    PRICING_TARGET_MARGIN_DEFAULT,
)
from backend.app.services.validation.scoring import score_from


EMITTED_CODES: frozenset[str] = frozenset({
    "MISSING_INPUT",
    "FINANCIAL_UNIT_ECONOMICS_NEGATIVE",
    "FINANCIAL_HIGH_BREAK_EVEN_VOLUME",
    "FINANCIAL_MARGIN_BELOW_TARGET",
    "NEGATIVE_PRICE",
    "NEGATIVE_COST",
    "NEGATIVE_MARGIN",
    "ZERO_PRICE",
    "MISSING_REQUIRED_INPUT",
})


class FinancialStage(Stage):
    @property
    def name(self) -> str:
        return "financial"

    def run(self, ctx: StageContext) -> StageResult:
        inputs_used = [
            "pricing.selling_price",
            "costs.cogs_per_unit",
            "packaging.packaging_cost",
            "costs.shipping_cost_per_unit",
            "costs.fixed_costs_total",
        ]
        assumptions = ctx.assumptions or {}
        pricing = assumptions.get("pricing") if isinstance(assumptions, dict) else getattr(assumptions, "pricing", None)

        target_raw = pricing.get("target_margin_fraction") if isinstance(pricing, dict) else getattr(pricing, "target_margin_fraction", None) if pricing else None
        target_margin = to_decimal(target_raw)
        if target_margin is None:
            target_margin = PRICING_TARGET_MARGIN_DEFAULT

        fin_result = calculate_financials(assumptions)
        findings: List[Finding] = []

        has_blocking_missing = False

        # Map finance Issues to Findings
        for issue in fin_result.issues:
            if issue.code == "MISSING_INPUT":
                has_blocking_missing = True
                findings.append(
                    Finding(
                        code="MISSING_INPUT",
                        severity=Severity.CRITICAL,
                        message=issue.message,
                        field=issue.field,
                    )
                )
            elif issue.code in ("NEGATIVE_CONTRIBUTION", "ZERO_CONTRIBUTION"):
                findings.append(
                    Finding(
                        code="FINANCIAL_UNIT_ECONOMICS_NEGATIVE",
                        severity=Severity.CRITICAL,
                        message=issue.message,
                        field=issue.field,
                    )
                )
            elif issue.code == "NEGATIVE_COST":
                has_blocking_missing = True
                findings.append(
                    Finding(
                        code="NEGATIVE_COST",
                        severity=Severity.CRITICAL,
                        message=issue.message,
                        field=issue.field,
                    )
                )
            elif issue.code in ("ZERO_PRICE", "NEGATIVE_PRICE"):
                has_blocking_missing = True
                findings.append(
                    Finding(
                        code="NON_POSITIVE_PRICE",
                        severity=Severity.CRITICAL,
                        message=issue.message,
                        field=issue.field,
                    )
                )
            elif issue.code == "INVALID_FRACTION":
                has_blocking_missing = True
                findings.append(
                    Finding(
                        code="INVALID_FRACTION",
                        severity=Severity.CRITICAL,
                        message=issue.message,
                        field=issue.field,
                    )
                )

        metrics: dict[str, Any] = {
            "selling_price": fin_result.selling_price,
            "variable_cost_per_unit": fin_result.variable_cost_per_unit,
            "contribution_per_unit": fin_result.contribution_per_unit,
            "contribution_margin": fin_result.contribution_margin,
            "break_even_units": fin_result.break_even_units,
            "fixed_costs_total": fin_result.fixed_costs_total,
        }

        break_even = fin_result.break_even_units
        margin = fin_result.contribution_margin
        contribution = fin_result.contribution_per_unit

        # Break-even threshold check
        if break_even is not None and break_even > FINANCIAL_BREAK_EVEN_WARN_UNITS:
            findings.append(
                Finding(
                    code="FINANCIAL_HIGH_BREAK_EVEN_VOLUME",
                    severity=Severity.WARNING,
                    message=(
                        f"Break-even volume ({break_even} units) exceeds "
                        f"sustainable threshold of {FINANCIAL_BREAK_EVEN_WARN_UNITS}."
                    ),
                    field="costs.fixed_costs_total",
                )
            )

        # Margin target check
        if margin is not None and margin < target_margin:
            findings.append(
                Finding(
                    code="FINANCIAL_MARGIN_BELOW_TARGET",
                    severity=Severity.WARNING,
                    message=(
                        f"Realized contribution margin ({margin:.4f}) is below "
                        f"target margin of {target_margin}."
                    ),
                    field="pricing.target_margin_fraction",
                )
            )

        # Status determination:
        if has_blocking_missing or fin_result.variable_cost_per_unit is None:
            status = Status.INSUFFICIENT_EVIDENCE
        elif contribution is not None and contribution <= Decimal("0"):
            status = Status.FAILED
        else:
            critical_count = sum(1 for f in findings if f.severity == Severity.CRITICAL)
            warning_count = sum(1 for f in findings if f.severity == Severity.WARNING)
            if critical_count > 0:
                status = Status.FAILED
            elif warning_count > 0:
                status = Status.WARNING
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


__all__ = ["FinancialStage"]
