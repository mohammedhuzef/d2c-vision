"""Pricing validation stage.

Evaluates price corridor vs competitor benchmarks and margin viability:
- selling_price and required cost inputs (cogs, packaging, shipping) are required
- Computes margin directly by calling finance.py (never reads financial stage)
- Target margin defaults to PRICING_TARGET_MARGIN_DEFAULT
- Reads competitor band from ctx.upstream["competitor"].metrics
- Price corridor checks:
  - price > band_max * (1 + PRICING_ABOVE_BAND_WARN) -> WARNING (PRICE_ABOVE_MARKET_BAND)
  - price < band_min * (1 - PRICING_BELOW_BAND_WARN) -> WARNING (PRICE_BELOW_MARKET_BAND)
  - exact boundaries are NOT warned
- Margin checks:
  - realized_margin < PRICING_FAIL_MARGIN -> FAILED (PRICING_MARGIN_UNVIABLE)
  - realized_margin < target_margin -> WARNING (PRICING_MARGIN_BELOW_TARGET)
- Missing band -> info finding NO_COMPETITOR_BAND and still runs margin checks
"""

from decimal import Decimal
from typing import Any, List, Optional
from backend.app.services.finance import calculate_financials, round_margin, to_decimal
from backend.app.services.validation.base import Finding, Severity, Stage, StageContext, StageResult, Status
from backend.app.services.validation.rules_config import (
    PRICING_ABOVE_BAND_WARN,
    PRICING_BELOW_BAND_WARN,
    PRICING_FAIL_MARGIN,
    PRICING_TARGET_MARGIN_DEFAULT,
)
from backend.app.services.validation.scoring import score_from

ONE: Decimal = Decimal("1")

EMITTED_CODES: frozenset[str] = frozenset({
    "MISSING_INPUT",
    "PRICE_ABOVE_MARKET_BAND",
    "PRICE_BELOW_MARKET_BAND",
    "NO_COMPETITOR_BAND",
    "PRICING_MARGIN_UNVIABLE",
    "PRICING_MARGIN_BELOW_TARGET",
})


class PricingStage(Stage):
    @property
    def name(self) -> str:
        return "pricing"

    def run(self, ctx: StageContext) -> StageResult:
        inputs_used = [
            "pricing.selling_price",
            "pricing.target_margin_fraction",
            "costs.cogs_per_unit",
            "packaging.packaging_cost",
            "costs.shipping_cost_per_unit",
        ]
        upstream_stages_used: List[str] = []
        findings: List[Finding] = []

        assumptions = ctx.assumptions or {}
        pricing = assumptions.get("pricing") if isinstance(assumptions, dict) else getattr(assumptions, "pricing", None)

        sp_raw = pricing.get("selling_price") if isinstance(pricing, dict) else getattr(pricing, "selling_price", None) if pricing else None
        selling_price = to_decimal(sp_raw)

        target_raw = pricing.get("target_margin_fraction") if isinstance(pricing, dict) else getattr(pricing, "target_margin_fraction", None) if pricing else None
        target_margin = to_decimal(target_raw)
        if target_margin is None:
            target_margin = PRICING_TARGET_MARGIN_DEFAULT

        # Check financial inputs by invoking finance engine directly
        fin_calc = calculate_financials(assumptions)

        metrics: dict[str, Any] = {
            "selling_price": selling_price,
            "target_margin_fraction": target_margin,
            "realized_margin_fraction": None,
            "competitor_price_min": None,
            "competitor_price_max": None,
        }

        # Check required input existence; return early if missing
        missing_findings: List[Finding] = []
        if selling_price is None or selling_price <= Decimal("0"):
            missing_findings.append(
                Finding(
                    code="MISSING_INPUT",
                    severity=Severity.CRITICAL,
                    message="Selling price is missing or non-positive.",
                    field="pricing.selling_price",
                )
            )

        for issue in fin_calc.issues:
            if issue.code == "MISSING_INPUT" and issue.field in ("cogs_per_unit", "packaging_cost", "shipping_cost_per_unit"):
                missing_findings.append(
                    Finding(
                        code="MISSING_INPUT",
                        severity=Severity.CRITICAL,
                        message=issue.message,
                        field=issue.field,
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

        # 2. Competitor band evaluation
        comp_upstream = ctx.upstream.get("competitor") if ctx.upstream else None
        has_band = False

        if comp_upstream and comp_upstream.metrics:
            comp_min_raw = comp_upstream.metrics.get("competitor_price_min")
            comp_max_raw = comp_upstream.metrics.get("competitor_price_max")
            comp_min = to_decimal(comp_min_raw)
            comp_max = to_decimal(comp_max_raw)

            if comp_min is not None and comp_max is not None and comp_min > Decimal("0") and comp_max > Decimal("0"):
                has_band = True
                upstream_stages_used.append("competitor")
                metrics["competitor_price_min"] = comp_min
                metrics["competitor_price_max"] = comp_max

                min_threshold = comp_min * (ONE - PRICING_BELOW_BAND_WARN)
                if selling_price < min_threshold:
                    findings.append(
                        Finding(
                            code="PRICE_BELOW_MARKET_BAND",
                            severity=Severity.WARNING,
                            message=(
                                f"Selling price ({selling_price}) is more than {PRICING_BELOW_BAND_WARN:.2%} "
                                f"below competitor minimum ({comp_min})."
                            ),
                            field="pricing.selling_price",
                        )
                    )

                max_threshold = comp_max * (ONE + PRICING_ABOVE_BAND_WARN)
                if selling_price > max_threshold:
                    findings.append(
                        Finding(
                            code="PRICE_ABOVE_MARKET_BAND",
                            severity=Severity.WARNING,
                            message=(
                                f"Selling price ({selling_price}) is more than {PRICING_ABOVE_BAND_WARN:.2%} "
                                f"above competitor maximum ({comp_max})."
                            ),
                            field="pricing.selling_price",
                        )
                    )

        if not has_band:
            findings.append(
                Finding(
                    code="NO_COMPETITOR_BAND",
                    severity=Severity.INFO,
                    message="Competitor price band is unavailable for market comparison.",
                )
            )

        # 3. Realized margin evaluation
        realized_margin = fin_calc.contribution_margin
        metrics["realized_margin_fraction"] = realized_margin
        metrics["realized_margin"] = realized_margin

        if realized_margin is not None:
            if realized_margin < PRICING_FAIL_MARGIN:
                findings.append(
                    Finding(
                        code="PRICING_MARGIN_UNVIABLE",
                        severity=Severity.CRITICAL,
                        message=(
                            f"Contribution margin ({realized_margin:.4f}) is below "
                            f"the viability threshold of {PRICING_FAIL_MARGIN}."
                        ),
                        field="pricing.selling_price",
                    )
                )
            elif realized_margin < target_margin:
                findings.append(
                    Finding(
                        code="PRICING_MARGIN_BELOW_TARGET",
                        severity=Severity.WARNING,
                        message=(
                            f"Contribution margin ({realized_margin:.4f}) is below "
                            f"target margin of {target_margin}."
                        ),
                        field="pricing.selling_price",
                    )
                )

        # Status determination: worst of FAILED > WARNING > PASSED
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
            upstream_stages_used=tuple(upstream_stages_used),
        )


__all__ = ["PricingStage"]
