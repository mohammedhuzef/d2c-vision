from decimal import Decimal, ROUND_HALF_UP
from typing import List
from backend.app.services.validation.base import Finding, FindingCode, Stage, StageContext, StageResult, Status
from backend.app.services.validation import rules_config
from backend.app.services.finance import fraction_to_str, money_to_str


class ProductPackagingStage(Stage):
    name = "product_packaging"

    def run(self, ctx: StageContext) -> StageResult:
        inputs_used = ["packaging.material", "packaging.packaging_cost", "pricing.selling_price"]
        pkg = getattr(ctx.assumptions, "packaging", None) if ctx.assumptions else None
        pricing = getattr(ctx.assumptions, "pricing", None) if ctx.assumptions else None
        costs = getattr(ctx.assumptions, "costs", None) if ctx.assumptions else None
        findings: List[Finding] = []

        material = getattr(pkg, "material", None) if pkg else None
        pkg_cost_val = getattr(pkg, "packaging_cost", None) if pkg else None
        if pkg_cost_val is None and costs:
            pkg_cost_val = getattr(costs, "packaging_cost", None)

        packaging_cost = Decimal(str(pkg_cost_val)) if pkg_cost_val is not None else None
        sp_val = getattr(pricing, "selling_price", None) if pricing else None
        selling_price = Decimal(str(sp_val)) if sp_val is not None else None

        metrics = {
            "material": material,
            "packaging_cost": money_to_str(packaging_cost),
            "packaging_cost_fraction": None,
            "packaging_cost_ratio": None,
        }

        # 1. Missing data checks (precedence: return early)
        if not material or not material.strip():
            findings.append(
                Finding(
                    code=FindingCode("MISSING_INPUT", "PACKAGING_MATERIAL_MISSING", "MISSING_INPUT:packaging.material"),
                    severity="critical",
                    message="Packaging material specification is missing.",
                    field="packaging.material",
                )
            )

        if packaging_cost is None:
            findings.append(
                Finding(
                    code=FindingCode("MISSING_INPUT", "PACKAGING_COST_MISSING", "MISSING_INPUT:packaging.packaging_cost"),
                    severity="critical",
                    message="Packaging cost per unit is missing.",
                    field="packaging.packaging_cost",
                )
            )

        if selling_price is None or selling_price <= Decimal("0"):
            findings.append(
                Finding(
                    code=FindingCode("MISSING_INPUT", "PRICING_SELLING_PRICE_MISSING", "MISSING_INPUT:pricing.selling_price"),
                    severity="critical",
                    message="Valid selling price is required to evaluate packaging cost ratio.",
                    field="pricing.selling_price",
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

        # 2. Ratio Calculation & Strict Thresholds
        raw_ratio = packaging_cost / selling_price
        ratio = raw_ratio.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
        metrics["packaging_cost_fraction"] = fraction_to_str(ratio)
        metrics["packaging_cost_ratio"] = fraction_to_str(ratio)

        # Strict greater-than
        if ratio > rules_config.PACKAGING_FAIL_FRACTION:
            pct_ratio = ratio * Decimal("100")
            pct_fail = rules_config.PACKAGING_FAIL_FRACTION * Decimal("100")
            findings.append(
                Finding(
                    code="PACKAGING_COST_EXCESSIVE",
                    severity="critical",
                    message=f"Packaging cost is {pct_ratio:.1f}% of retail price, exceeding failure threshold of {pct_fail:.0f}%.",
                    field="packaging.packaging_cost",
                )
            )
            status = Status.FAILED
        elif ratio > rules_config.PACKAGING_WARN_FRACTION:
            pct_ratio = ratio * Decimal("100")
            pct_warn = rules_config.PACKAGING_WARN_FRACTION * Decimal("100")
            findings.append(
                Finding(
                    code="PACKAGING_COST_ELEVATED",
                    severity="warning",
                    message=f"Packaging cost is {pct_ratio:.1f}% of retail price, exceeding threshold of {pct_warn:.0f}%.",
                    field="packaging.packaging_cost",
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
