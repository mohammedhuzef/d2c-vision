from decimal import Decimal
from typing import List, Optional
from backend.app.services.validation.base import Finding, FindingCode, Stage, StageContext, StageResult, Status
from backend.app.services.validation import rules_config
from backend.app.services.finance import calculate_financials, fraction_to_str, money_to_str


class PricingStage(Stage):
    name = "pricing"

    def run(self, ctx: StageContext) -> StageResult:
        inputs_used = ["pricing.selling_price", "pricing.target_margin_fraction"]
        upstream_used = ["competitor"]
        pricing = getattr(ctx.assumptions, "pricing", None) if ctx.assumptions else None
        costs = getattr(ctx.assumptions, "costs", None) if ctx.assumptions else None
        pkg = getattr(ctx.assumptions, "packaging", None) if ctx.assumptions else None
        findings: List[Finding] = []

        sp_val = getattr(pricing, "selling_price", None) if pricing else None
        selling_price = Decimal(str(sp_val)) if sp_val is not None else None
        target_margin = getattr(pricing, "target_margin_fraction", None) if pricing else None
        if target_margin is None:
            target_margin = rules_config.PRICING_TARGET_MARGIN_DEFAULT

        # Check required cost inputs
        cogs = getattr(costs, "cogs_per_unit", None) if costs else None
        shipping = getattr(costs, "shipping_cost_per_unit", None) if costs else None
        pkg_cost = getattr(pkg, "packaging_cost", None) if pkg else None
        if pkg_cost is None and costs:
            pkg_cost = getattr(costs, "packaging_cost", None)

        metrics = {
            "selling_price": money_to_str(selling_price),
            "target_margin_fraction": fraction_to_str(target_margin),
            "realized_margin_fraction": None,
        }

        # 1. Price and cost inputs existence check (precedence rule: return early)
        if selling_price is None or selling_price <= Decimal("0"):
            findings.append(
                Finding(
                    code=FindingCode("MISSING_INPUT", "PRICING_PRICE_MISSING", "MISSING_INPUT:pricing.selling_price"),
                    severity="critical",
                    message="Selling price is missing or non-positive.",
                    field="pricing.selling_price",
                )
            )

        if cogs is None:
            findings.append(
                Finding(
                    code=FindingCode("MISSING_INPUT", "MISSING_INPUT:costs.cogs_per_unit"),
                    severity="critical",
                    message="cogs_per_unit is missing.",
                    field="costs.cogs_per_unit",
                )
            )

        if pkg_cost is None:
            findings.append(
                Finding(
                    code=FindingCode("MISSING_INPUT", "MISSING_INPUT:packaging.packaging_cost"),
                    severity="critical",
                    message="packaging_cost is missing.",
                    field="packaging.packaging_cost",
                )
            )

        if shipping is None:
            findings.append(
                Finding(
                    code=FindingCode("MISSING_INPUT", "MISSING_INPUT:costs.shipping_cost_per_unit"),
                    severity="critical",
                    message="shipping_cost_per_unit is missing.",
                    field="costs.shipping_cost_per_unit",
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
                upstream_stages_used=upstream_used,
            )

        # 2. Competitor Price Band Comparison (from ctx.upstream["competitor"])
        comp_upstream = ctx.upstream.get("competitor") if ctx.upstream else None
        has_band = False
        if comp_upstream and comp_upstream.metrics:
            comp_min_raw = comp_upstream.metrics.get("competitor_price_min")
            comp_max_raw = comp_upstream.metrics.get("competitor_price_max")

            if comp_min_raw is not None and comp_max_raw is not None:
                try:
                    comp_min = Decimal(str(comp_min_raw))
                    comp_max = Decimal(str(comp_max_raw))
                    if comp_min > Decimal("0") and comp_max > Decimal("0"):
                        has_band = True
                        min_threshold = comp_min * (Decimal("1") - rules_config.PRICING_BELOW_BAND_WARN)
                        if selling_price < min_threshold:
                            pct_below = rules_config.PRICING_BELOW_BAND_WARN * Decimal("100")
                            findings.append(
                                Finding(
                                    code="PRICE_BELOW_MARKET_BAND",
                                    severity="warning",
                                    message=f"Selling price (${selling_price}) is more than {pct_below:.0f}% below competitor minimum (${comp_min:.2f}), presenting value perception risk.",
                                    field="pricing.selling_price",
                                )
                            )

                        max_threshold = comp_max * (Decimal("1") + rules_config.PRICING_ABOVE_BAND_WARN)
                        if selling_price > max_threshold:
                            pct_above = rules_config.PRICING_ABOVE_BAND_WARN * Decimal("100")
                            findings.append(
                                Finding(
                                    code="PRICE_ABOVE_MARKET_BAND",
                                    severity="warning",
                                    message=f"Selling price (${selling_price}) is more than {pct_above:.0f}% above competitor maximum (${comp_max:.2f}), creating price resistance risk.",
                                    field="pricing.selling_price",
                                )
                            )
                except Exception:
                    pass

        if not has_band:
            findings.append(
                Finding(
                    code="NO_COMPETITOR_BAND",
                    severity="info",
                    message="Competitor price band is unavailable for market comparison.",
                )
            )

        # 3. Margin check using finance engine directly
        fin_calc = calculate_financials(ctx.assumptions)
        realized_margin = fin_calc.contribution_margin

        if realized_margin is not None:
            metrics["realized_margin_fraction"] = fraction_to_str(realized_margin)

            if realized_margin < rules_config.PRICING_FAIL_MARGIN:
                pct_margin = realized_margin * Decimal("100")
                pct_fail = rules_config.PRICING_FAIL_MARGIN * Decimal("100")
                findings.append(
                    Finding(
                        code="PRICING_MARGIN_UNVIABLE",
                        severity="critical",
                        message=f"Contribution margin ({pct_margin:.1f}%) is below the viability threshold of {pct_fail:.0f}%.",
                        field="pricing.selling_price",
                    )
                )
            elif realized_margin < target_margin:
                pct_margin = realized_margin * Decimal("100")
                pct_target = target_margin * Decimal("100")
                findings.append(
                    Finding(
                        code="PRICING_MARGIN_BELOW_TARGET",
                        severity="warning",
                        message=f"Contribution margin ({pct_margin:.1f}%) is below target margin of {pct_target:.0f}%.",
                        field="pricing.selling_price",
                    )
                )

        # Determine status: worst of FAILED > WARNING > PASSED
        critical_count = sum(1 for f in findings if f.severity == "critical")
        warning_count = sum(1 for f in findings if f.severity == "warning")

        if critical_count > 0:
            status = Status.FAILED
        elif warning_count > 0:
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
