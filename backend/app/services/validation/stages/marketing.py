"""Marketing validation stage.

Evaluates marketing channel strategy and CAC viability against unit contribution:
- marketing.channels (non-empty list) and marketing.expected_cac (> 0) are required
- Reads contribution_per_unit from ctx.upstream['financial'].metrics only
- Missing upstream financial result or contribution_per_unit -> early INSUFFICIENT_EVIDENCE
- contribution_per_unit <= 0 -> FAILED (NEGATIVE_UNIT_ECONOMICS)
- CAC ratio = expected_cac / contribution_per_unit (quantized to 4 dp)
- ratio > MARKETING_CAC_RATIO_FAIL -> FAILED (MARKETING_CAC_EXCEEDS_CONTRIBUTION)
- ratio > MARKETING_CAC_RATIO_WARN -> WARNING (MARKETING_CAC_RATIO_HIGH)
- strict boundary comparisons
"""

from decimal import Decimal
from typing import Any, List, Optional

from backend.app.services.finance import round_margin, round_money, to_decimal
from backend.app.services.validation.base import Finding, Severity, Stage, StageContext, StageResult, Status
from backend.app.services.validation.rules_config import (
    MARKETING_CAC_RATIO_FAIL,
    MARKETING_CAC_RATIO_WARN,
)
from backend.app.services.validation.scoring import score_from

ZERO: Decimal = Decimal("0")

EMITTED_CODES: frozenset[str] = frozenset({
    "MISSING_INPUT",
    "MISSING_UPSTREAM",
    "NEGATIVE_UNIT_ECONOMICS",
    "MARKETING_CAC_EXCEEDS_CONTRIBUTION",
    "MARKETING_CAC_RATIO_HIGH",
})


class MarketingStage(Stage):
    @property
    def name(self) -> str:
        return "marketing"

    def run(self, ctx: StageContext) -> StageResult:
        inputs_used = [
            "marketing.channels",
            "marketing.expected_cac",
        ]
        upstream_stages_used: List[str] = []
        findings: List[Finding] = []

        assumptions = ctx.assumptions or {}
        marketing = assumptions.get("marketing") if isinstance(assumptions, dict) else getattr(assumptions, "marketing", None)

        channels = None
        expected_cac_raw = None

        if marketing is not None:
            if isinstance(marketing, dict):
                channels = marketing.get("channels")
                expected_cac_raw = marketing.get("expected_cac")
            else:
                channels = getattr(marketing, "channels", None)
                expected_cac_raw = getattr(marketing, "expected_cac", None)

        expected_cac = to_decimal(expected_cac_raw)
        channels_count = len(channels) if isinstance(channels, list) else None

        metrics: dict[str, Any] = {
            "expected_cac": round_money(expected_cac) if expected_cac is not None else None,
            "contribution_per_unit": None,
            "cac_to_contribution_ratio": None,
            "channels_count": channels_count,
        }

        # Check required inputs
        missing_findings: List[Finding] = []
        if channels is None or not isinstance(channels, list) or len(channels) == 0:
            missing_findings.append(
                Finding(
                    code="MISSING_INPUT",
                    severity=Severity.CRITICAL,
                    message="Marketing channels list is missing or empty.",
                    field="marketing.channels",
                )
            )

        if expected_cac is None or expected_cac <= ZERO:
            missing_findings.append(
                Finding(
                    code="MISSING_INPUT",
                    severity=Severity.CRITICAL,
                    message="Expected CAC is missing or must be greater than zero.",
                    field="marketing.expected_cac",
                )
            )

        if missing_findings:
            status = Status.INSUFFICIENT_EVIDENCE
            return StageResult(
                stage=self.name,
                status=status,
                score=score_from(status, missing_findings),
                metrics=metrics,
                findings=missing_findings,
                inputs_used=inputs_used,
                upstream_stages_used=upstream_stages_used,
            )

        # Consult upstream financial stage
        upstream_stages_used.append("financial")
        fin_stage = ctx.upstream.get("financial") if ctx.upstream else None

        if fin_stage is None or fin_stage.metrics is None or fin_stage.metrics.get("contribution_per_unit") is None:
            upstream_finding = Finding(
                code="MISSING_UPSTREAM",
                severity=Severity.CRITICAL,
                message="Upstream financial stage result or contribution_per_unit is missing.",
            )
            status = Status.INSUFFICIENT_EVIDENCE
            return StageResult(
                stage=self.name,
                status=status,
                score=score_from(status, [upstream_finding]),
                metrics=metrics,
                findings=[upstream_finding],
                inputs_used=inputs_used,
                upstream_stages_used=upstream_stages_used,
            )

        raw_contribution = fin_stage.metrics.get("contribution_per_unit")
        contribution = to_decimal(raw_contribution)
        if contribution is None:
            upstream_finding = Finding(
                code="MISSING_UPSTREAM",
                severity=Severity.CRITICAL,
                message="Upstream financial stage contribution_per_unit could not be parsed as Decimal.",
            )
            status = Status.INSUFFICIENT_EVIDENCE
            return StageResult(
                stage=self.name,
                status=status,
                score=score_from(status, [upstream_finding]),
                metrics=metrics,
                findings=[upstream_finding],
                inputs_used=inputs_used,
                upstream_stages_used=upstream_stages_used,
            )

        metrics["contribution_per_unit"] = contribution

        # Check negative/zero unit economics
        if contribution <= ZERO:
            findings.append(
                Finding(
                    code="NEGATIVE_UNIT_ECONOMICS",
                    severity=Severity.CRITICAL,
                    message=f"Contribution per unit is non-positive ({contribution}), making unit economics unviable.",
                )
            )
            status = Status.FAILED
            return StageResult(
                stage=self.name,
                status=status,
                score=score_from(status, findings),
                metrics=metrics,
                findings=findings,
                inputs_used=inputs_used,
                upstream_stages_used=upstream_stages_used,
            )

        # Compute ratio
        ratio = round_margin(expected_cac / contribution)
        metrics["cac_to_contribution_ratio"] = ratio

        # Strict checks against thresholds
        if ratio > MARKETING_CAC_RATIO_FAIL:
            findings.append(
                Finding(
                    code="MARKETING_CAC_EXCEEDS_CONTRIBUTION",
                    severity=Severity.CRITICAL,
                    message=f"CAC to contribution ratio {ratio} exceeds failure threshold {MARKETING_CAC_RATIO_FAIL}; acquisition cost exceeds unit margin.",
                    field="marketing.expected_cac",
                )
            )
            status = Status.FAILED
        elif ratio > MARKETING_CAC_RATIO_WARN:
            findings.append(
                Finding(
                    code="MARKETING_CAC_RATIO_HIGH",
                    severity=Severity.WARNING,
                    message=f"CAC to contribution ratio {ratio} exceeds warning threshold {MARKETING_CAC_RATIO_WARN}; acquisition cost consumes high fraction of margin.",
                    field="marketing.expected_cac",
                )
            )
            status = Status.WARNING
        else:
            status = Status.PASSED

        return StageResult(
            stage=self.name,
            status=status,
            score=score_from(status, findings),
            metrics=metrics,
            findings=findings,
            inputs_used=inputs_used,
            upstream_stages_used=upstream_stages_used,
        )

