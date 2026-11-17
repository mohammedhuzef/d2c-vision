"""Product packaging validation stage.

Evaluates packaging sustainability, material, and cost ratio vs selling price:
- packaging.material, resolved packaging_cost, and pricing.selling_price are required
- ratio = packaging_cost / selling_price (4 dp)
- Strict >:
  - ratio > PACKAGING_FAIL_FRACTION -> FAILED (PACKAGING_COST_EXCESSIVE)
  - ratio > PACKAGING_WARN_FRACTION -> WARNING (PACKAGING_COST_HIGH)
  - <= PACKAGING_WARN_FRACTION -> PASSED
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Any, List, Optional
from backend.app.services.finance import resolve_packaging_cost, to_decimal
from backend.app.services.validation.base import Finding, Severity, Stage, StageContext, StageResult, Status
from backend.app.services.validation.rules_config import (
    PACKAGING_FAIL_FRACTION,
    PACKAGING_WARN_FRACTION,
)
from backend.app.services.validation.scoring import score_from

MARGIN_PRECISION: Decimal = Decimal("0.0001")

EMITTED_CODES: frozenset[str] = frozenset({
    "MISSING_INPUT",
    "PACKAGING_COST_MISMATCH",
    "PACKAGING_COST_EXCESSIVE",
    "PACKAGING_COST_HIGH",
})


class ProductPackagingStage(Stage):
    @property
    def name(self) -> str:
        return "product_packaging"

    def run(self, ctx: StageContext) -> StageResult:
        inputs_used = [
            "packaging.material",
            "packaging.packaging_cost",
            "pricing.selling_price",
        ]

        assumptions = ctx.assumptions or {}
        pkg = assumptions.get("packaging") if isinstance(assumptions, dict) else getattr(assumptions, "packaging", None)
        pricing = assumptions.get("pricing") if isinstance(assumptions, dict) else getattr(assumptions, "pricing", None)

        material = None
        if pkg is not None:
            material = pkg.get("material") if isinstance(pkg, dict) else getattr(pkg, "material", None)

        packaging_cost, resolver_findings = resolve_packaging_cost(assumptions)

        selling_price_raw = None
        if pricing is not None:
            selling_price_raw = pricing.get("selling_price") if isinstance(pricing, dict) else getattr(pricing, "selling_price", None)
        selling_price = to_decimal(selling_price_raw)

        metrics: dict[str, Any] = {
            "material": material,
            "packaging_cost": packaging_cost,
            "packaging_cost_ratio": None,
        }

        # Check required fields; return early with INSUFFICIENT_EVIDENCE if missing
        missing_findings: List[Finding] = []
        if not material or not str(material).strip():
            missing_findings.append(
                Finding(
                    code="MISSING_INPUT",
                    severity=Severity.CRITICAL,
                    message="Packaging material specification is missing.",
                    field="packaging.material",
                )
            )

        if packaging_cost is None:
            missing_findings.append(
                Finding(
                    code="MISSING_INPUT",
                    severity=Severity.CRITICAL,
                    message="Packaging cost per unit is missing.",
                    field="packaging.packaging_cost",
                )
            )

        if selling_price is None or selling_price <= Decimal("0"):
            missing_findings.append(
                Finding(
                    code="MISSING_INPUT",
                    severity=Severity.CRITICAL,
                    message="Selling price is required to evaluate packaging cost ratio.",
                    field="pricing.selling_price",
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

        # Ratio calculation (4 dp ROUND_HALF_UP)
        raw_ratio = packaging_cost / selling_price
        ratio = raw_ratio.quantize(MARGIN_PRECISION, rounding=ROUND_HALF_UP)
        metrics["packaging_cost_ratio"] = ratio

        findings: List[Finding] = list(resolver_findings)

        # Strict greater-than thresholds
        if ratio > PACKAGING_FAIL_FRACTION:
            status = Status.FAILED
            findings.append(
                Finding(
                    code="PACKAGING_COST_EXCESSIVE",
                    severity=Severity.CRITICAL,
                    message=(
                        f"Packaging cost is {ratio:.4f} of retail price, "
                        f"exceeding failure threshold of {PACKAGING_FAIL_FRACTION}."
                    ),
                    field="packaging.packaging_cost",
                )
            )
        elif ratio > PACKAGING_WARN_FRACTION:
            status = Status.WARNING
            findings.append(
                Finding(
                    code="PACKAGING_COST_HIGH",
                    severity=Severity.WARNING,
                    message=(
                        f"Packaging cost is {ratio:.4f} of retail price, "
                        f"exceeding threshold of {PACKAGING_WARN_FRACTION}."
                    ),
                    field="packaging.packaging_cost",
                )
            )
        else:
            # Check if resolver emitted warnings (e.g. PACKAGING_COST_MISMATCH)
            if any(f.severity == Severity.WARNING for f in findings):
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


__all__ = ["ProductPackagingStage"]
