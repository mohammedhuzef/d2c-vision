from decimal import Decimal, ROUND_HALF_UP
from typing import Any, List
from uuid import UUID
from backend.app.services.validation.base import Finding, Stage, StageContext, StageResult, Status
from backend.app.services.validation import rules_config
from backend.app.services.finance import money_to_str


class CompetitorStage(Stage):
    name = "competitor"

    def run(self, ctx: StageContext) -> StageResult:
        inputs_used = ["product.differentiation_vs_competitors"]
        findings: List[Finding] = []
        competitors = getattr(ctx, "competitors", [])
        evidence = getattr(ctx, "evidence", [])
        analyses = getattr(ctx, "competitor_analyses", [])
        prod = getattr(ctx.assumptions, "product", None) if ctx.assumptions else None
        differentiation = getattr(prod, "differentiation_vs_competitors", None) if prod else None

        # Map evidence items to competitors
        evidence_by_competitor = {}
        all_evidence_ids: List[UUID] = []
        for ev in evidence:
            eid = getattr(ev, "id", None)
            if eid:
                all_evidence_ids.append(eid)
            cid = getattr(ev, "competitor_id", None)
            if cid:
                evidence_by_competitor.setdefault(str(cid), []).append(ev)

        # If competitors list was empty, infer from analyses & evidence
        effective_competitors = list(competitors)
        if not effective_competitors:
            comp_ids = set()
            for a in analyses:
                cid = getattr(a, "competitor_id", None)
                if cid:
                    comp_ids.add(str(cid))
            for ev in evidence:
                cid = getattr(ev, "competitor_id", None)
                if cid:
                    comp_ids.add(str(cid))
            effective_competitors = [{"id": cid, "name": cid} for cid in comp_ids]

        comp_count = len(effective_competitors)

        # 1. Competitor count and evidence check
        is_insufficient = False
        if comp_count < rules_config.COMPETITOR_MIN_COUNT:
            is_insufficient = True
            findings.append(
                Finding(
                    code="COMPETITOR_COUNT_DEFICIENT",
                    severity="critical",
                    message=f"Found {comp_count} competitors. At least {rules_config.COMPETITOR_MIN_COUNT} competitors are required for landscape analysis.",
                    evidence_ids=all_evidence_ids,
                )
            )

        under_researched = []
        for c in effective_competitors:
            cid_str = str(getattr(c, "id", c.get("id") if isinstance(c, dict) else c))
            ev_count = len(evidence_by_competitor.get(cid_str, []))
            if ev_count < rules_config.COMPETITOR_MIN_EVIDENCE_PER_COMPETITOR:
                name = getattr(c, "name", c.get("name") if isinstance(c, dict) else cid_str)
                under_researched.append(name)

        if under_researched:
            is_insufficient = True
            findings.append(
                Finding(
                    code="COMPETITOR_EVIDENCE_DEFICIENT",
                    severity="critical",
                    message=f"Competitors lacking research evidence: {', '.join(under_researched)}.",
                    evidence_ids=all_evidence_ids,
                )
            )

        # 2. Differentiation check
        if not differentiation or not differentiation.strip():
            findings.append(
                Finding(
                    code="UNDIFFERENTIATED_PRODUCT",
                    severity="warning",
                    message="Product differentiation against competitors is empty. Clear unique value proposition is required.",
                    field="product.differentiation_vs_competitors",
                    evidence_ids=all_evidence_ids,
                )
            )

        # 3. Price Band Calculation (Decimal only, ROUND_HALF_UP)
        observed_prices: List[Decimal] = []
        for a in analyses:
            p = getattr(a, "price_observed", None)
            if p is not None:
                try:
                    observed_prices.append(Decimal(str(p)))
                except Exception:
                    pass

        if not observed_prices:
            price_min = None
            price_median = None
            price_max = None
            findings.append(
                Finding(
                    code="NO_PRICE_DATA",
                    severity="warning",
                    message="No competitor pricing data observed in competitor analyses.",
                    evidence_ids=all_evidence_ids,
                )
            )
        else:
            observed_prices.sort()
            price_min = observed_prices[0]
            price_max = observed_prices[-1]
            n = len(observed_prices)
            divisor = Decimal(str(rules_config.COMPETITOR_MIN_COUNT))
            if n % rules_config.COMPETITOR_MIN_COUNT == rules_config.COMPETITOR_MIN_EVIDENCE_PER_COMPETITOR:
                price_median = observed_prices[n // rules_config.COMPETITOR_MIN_COUNT]
            else:
                price_median = ((observed_prices[n // rules_config.COMPETITOR_MIN_COUNT - rules_config.COMPETITOR_MIN_EVIDENCE_PER_COMPETITOR] + observed_prices[n // rules_config.COMPETITOR_MIN_COUNT]) / divisor).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )

        metrics = {
            "competitors_count": comp_count,
            "competitor_price_min": money_to_str(price_min),
            "competitor_price_median": money_to_str(price_median),
            "competitor_price_max": money_to_str(price_max),
        }

        # Status determination: worst of FAILED > WARNING > PASSED
        if is_insufficient:
            status = Status.INSUFFICIENT_EVIDENCE
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
            upstream_stages_used=[],
        )
