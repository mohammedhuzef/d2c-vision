from decimal import Decimal, ROUND_HALF_UP
from typing import List
from backend.app.services.validation.base import Finding, FindingCode, Stage, StageContext, StageResult, Status
from backend.app.services.validation import rules_config
from backend.app.services.finance import fraction_to_str, money_to_str


class MarketingStage(Stage):
    name = "marketing"

    def run(self, ctx: StageContext) -> StageResult:
        inputs_used = ["marketing.channels", "marketing.expected_cac", "marketing.monthly_budget"]
        upstream_used = ["financial"]
        mkt = getattr(ctx.assumptions, "marketing", None) if ctx.assumptions else None
        findings: List[Finding] = []

        channels = getattr(mkt, "channels", None) if mkt else None
        expected_cac_val = getattr(mkt, "expected_cac", None) if mkt else None
        expected_cac = Decimal(str(expected_cac_val)) if expected_cac_val is not None else None
        monthly_budget_val = getattr(mkt, "monthly_budget", None) if mkt else None
        monthly_budget = Decimal(str(monthly_budget_val)) if monthly_budget_val is not None else None

        metrics = {
            "channels_count": len(channels) if channels else 0,
            "expected_cac": money_to_str(expected_cac),
            "monthly_budget": money_to_str(monthly_budget),
            "cac_to_contribution_ratio": None,
        }

        # 1. Inputs completeness (precedence rule: return early)
        if not channels:
            findings.append(
                Finding(
                    code=FindingCode("MISSING_INPUT", "MARKETING_CHANNELS_MISSING", "MISSING_INPUT:marketing.channels"),
                    severity="critical",
                    message="At least one acquisition channel must be specified.",
                    field="marketing.channels",
                )
            )

        if expected_cac is None or expected_cac <= Decimal("0"):
            findings.append(
                Finding(
                    code=FindingCode("MISSING_INPUT", "MARKETING_CAC_MISSING", "MISSING_INPUT:marketing.expected_cac"),
                    severity="critical",
                    message="Expected Customer Acquisition Cost (CAC) is missing or non-positive.",
                    field="marketing.expected_cac",
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

        # 2. Financial Upstream Contribution Check
        fin_upstream = ctx.upstream.get("financial") if ctx.upstream else None
        contribution_per_unit = None
        if fin_upstream and fin_upstream.metrics:
            cpu = fin_upstream.metrics.get("contribution_per_unit")
            if cpu is not None:
                try:
                    contribution_per_unit = Decimal(str(cpu))
                except Exception:
                    pass

        # Contribution null -> INSUFFICIENT_EVIDENCE
        if contribution_per_unit is None:
            findings.append(
                Finding(
                    code=FindingCode("MISSING_UPSTREAM:financial.contribution_per_unit", "MARKETING_FINANCIAL_DATA_UNAVAILABLE"),
                    severity="critical",
                    message="Cannot compute CAC ratio because upstream unit contribution is missing or uncomputed.",
                )
            )
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

        # Contribution <= 0 -> FAILED with finding NEGATIVE_UNIT_ECONOMICS (ratio null)
        if contribution_per_unit <= Decimal("0"):
            findings.append(
                Finding(
                    code="NEGATIVE_UNIT_ECONOMICS",
                    severity="critical",
                    message=f"Cannot compute CAC ratio because unit contribution is non-positive (${contribution_per_unit:.2f}).",
                )
            )
            status = Status.FAILED
            return StageResult(
                stage=self.name,
                status=status,
                score=rules_config.score_from(status, findings),
                metrics=metrics,
                findings=findings,
                inputs_used=inputs_used,
                upstream_stages_used=upstream_used,
            )

        # 3. Ratio Calculation (cac_to_contribution_ratio = expected_cac / contribution at 4 dp)
        raw_ratio = expected_cac / contribution_per_unit
        ratio = raw_ratio.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
        metrics["cac_to_contribution_ratio"] = fraction_to_str(ratio)

        # Strict greater-than: above fail -> FAILED, above warn -> WARNING, else PASSED
        if ratio > rules_config.MARKETING_CAC_RATIO_FAIL:
            findings.append(
                Finding(
                    code="MARKETING_CAC_EXCEEDS_CONTRIBUTION",
                    severity="critical",
                    message=f"CAC (${expected_cac:.2f}) exceeds unit contribution (${contribution_per_unit:.2f}) with ratio {ratio:.4f}. The business loses money on customer acquisition on first order.",
                    field="marketing.expected_cac",
                )
            )
            status = Status.FAILED
        elif ratio > rules_config.MARKETING_CAC_RATIO_WARN:
            findings.append(
                Finding(
                    code="MARKETING_CAC_RATIO_HIGH",
                    severity="warning",
                    message=f"CAC to contribution ratio is {ratio:.4f}, exceeding sustainable warning threshold of {rules_config.MARKETING_CAC_RATIO_WARN:.2f}.",
                    field="marketing.expected_cac",
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
            upstream_stages_used=upstream_used,
        )
