"""Competitor validation stage.

Evaluates competitor landscape, differentiation, and price band:
- >= 2 competitors each with >= 1 evidence item required, else INSUFFICIENT_EVIDENCE
- Empty product.differentiation_vs_competitors -> WARNING (UNDIFFERENTIATED_PRODUCT)
- Price band min/median/max from observed prices (ROUND_HALF_UP to 2 dp)
- No prices -> warning (NO_PRICE_DATA)
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Any, List, Optional, Set
from backend.app.services.finance import to_decimal
from backend.app.services.validation.base import Finding, Severity, Stage, StageContext, StageResult, Status
from backend.app.services.validation.rules_config import (
    COMPETITOR_MIN_COUNT,
    COMPETITOR_MIN_EVIDENCE_PER_COMPETITOR,
    DEMO_EVIDENCE_SOURCE_TYPES,
    TRUSTED_EVIDENCE_SOURCE_TYPES,
)
from backend.app.services.validation.scoring import score_from

CENTS: Decimal = Decimal("0.01")
TWO: Decimal = Decimal("2")

EMITTED_CODES: frozenset[str] = frozenset({
    "MISSING_INPUT",
    "COMPETITORS_INSUFFICIENT",
    "COMPETITOR_EVIDENCE_MISSING",
    "COMPETITOR_EVIDENCE_MOCK_ONLY",
    "UNDIFFERENTIATED_PRODUCT",
    "NO_PRICE_DATA",
    "CURRENCY_MISMATCH",
})


class CompetitorStage(Stage):
    @property
    def name(self) -> str:
        return "competitor"

    def run(self, ctx: StageContext) -> StageResult:
        inputs_used = ["product.differentiation_vs_competitors"]
        findings: List[Finding] = []

        assumptions = ctx.assumptions or {}
        prod = assumptions.get("product") if isinstance(assumptions, dict) else getattr(assumptions, "product", None)

        prod_name = ""
        if prod is not None:
            if isinstance(prod, dict):
                prod_name = str(prod.get("name") or "")
            else:
                prod_name = str(getattr(prod, "name", "") or "")

        is_demo = (
            bool(assumptions.get("is_demo"))
            or (bool(prod.get("is_demo")) if isinstance(prod, dict) else bool(getattr(prod, "is_demo", False)))
            or prod_name.upper().startswith("SAMPLE ")
        )

        differentiation = None
        if prod is not None:
            if isinstance(prod, dict):
                differentiation = prod.get("differentiation_vs_competitors")
            else:
                differentiation = getattr(prod, "differentiation_vs_competitors", None)

        # Collect evidence and map by competitor
        all_evidence_ids: List[str] = []
        evidence_by_competitor: dict[str, List[Any]] = {}
        evidence_obj_by_id: dict[str, Any] = {}
        has_trusted_evidence = False
        has_mock_or_seed_evidence = False

        for ev in ctx.evidence:
            eid = getattr(ev, "id", None) if not isinstance(ev, dict) else ev.get("id")
            s_type = getattr(ev, "source_type", None) if not isinstance(ev, dict) else ev.get("source_type")
            s_type = str(s_type or "other")

            if eid:
                eid_str = str(eid)
                all_evidence_ids.append(eid_str)
                evidence_obj_by_id[eid_str] = ev

            if s_type in DEMO_EVIDENCE_SOURCE_TYPES:
                has_mock_or_seed_evidence = True
            elif s_type in TRUSTED_EVIDENCE_SOURCE_TYPES or s_type not in DEMO_EVIDENCE_SOURCE_TYPES:
                has_trusted_evidence = True

            # If not a demo product, mock/sample_seed evidence does not count as verified evidence
            if not is_demo and s_type in DEMO_EVIDENCE_SOURCE_TYPES:
                continue

            cid = getattr(ev, "competitor_id", None) if not isinstance(ev, dict) else ev.get("competitor_id")
            if cid:
                evidence_by_competitor.setdefault(str(cid), []).append(ev)

        # Extract product currency from assumptions
        pricing = assumptions.get("pricing") if isinstance(assumptions, dict) else getattr(assumptions, "pricing", None)
        product_currency = "USD"
        if pricing is not None:
            if isinstance(pricing, dict):
                product_currency = pricing.get("currency") or "USD"
            else:
                product_currency = getattr(pricing, "currency", "USD") or "USD"
        product_currency = str(product_currency).upper().strip()

        # Collect competitors from analyses and evidence
        competitor_map: dict[str, str] = {}  # id -> name
        observed_prices: List[Decimal] = []

        for analysis in ctx.competitor_analyses:
            cid = getattr(analysis, "competitor_id", None) if not isinstance(analysis, dict) else analysis.get("competitor_id")
            aid = getattr(analysis, "id", None) if not isinstance(analysis, dict) else analysis.get("id")
            comp_id = str(cid) if cid else (str(aid) if aid else None)

            name = getattr(analysis, "name", None) if not isinstance(analysis, dict) else analysis.get("name")
            if not name:
                comp_obj = getattr(analysis, "competitor", None)
                if comp_obj:
                    name = getattr(comp_obj, "name", None)

            if comp_id:
                competitor_map[comp_id] = str(name) if name else comp_id

            # Evidence IDs from analysis
            ev_ids = getattr(analysis, "evidence_ids", None) if not isinstance(analysis, dict) else analysis.get("evidence_ids")
            if ev_ids:
                for eid in ev_ids:
                    all_evidence_ids.append(str(eid))
                    if comp_id:
                        # Only count if demo or trusted
                        ev_item = evidence_obj_by_id.get(str(eid))
                        ev_st = getattr(ev_item, "source_type", None) if not isinstance(ev_item, dict) else (ev_item.get("source_type") if ev_item else None)
                        if is_demo or not ev_st or ev_st not in DEMO_EVIDENCE_SOURCE_TYPES:
                            evidence_by_competitor.setdefault(comp_id, []).append(eid)

            # Check competitor currency
            comp_currency = None
            if isinstance(analysis, dict):
                comp_currency = analysis.get("currency")
            else:
                comp_currency = getattr(analysis, "currency", None)

            # Check linked evidence for currency in data dictionary
            if not comp_currency and ev_ids:
                for eid in ev_ids:
                    ev_obj = evidence_obj_by_id.get(str(eid))
                    if ev_obj:
                        data_dict = getattr(ev_obj, "data", None) if not isinstance(ev_obj, dict) else ev_obj.get("data")
                        if isinstance(data_dict, dict) and "currency" in data_dict:
                            comp_currency = data_dict.get("currency")
                            break

            # Observed price
            p_raw = getattr(analysis, "price_observed", None) if not isinstance(analysis, dict) else analysis.get("price_observed")
            p_dec = to_decimal(p_raw)
            if p_dec is not None and p_dec > Decimal("0"):
                if comp_currency and str(comp_currency).upper().strip() != product_currency:
                    # Currency mismatch: exclude from price band, emit warning finding
                    findings.append(
                        Finding(
                            code="CURRENCY_MISMATCH",
                            severity=Severity.WARNING,
                            message=(
                                f"Competitor '{name or comp_id}' price ({comp_currency} {p_dec}) is in a different "
                                f"currency from product currency ({product_currency}). Excluded from market price band."
                            ),
                            field="pricing.currency",
                            evidence_ids=tuple(dict.fromkeys(all_evidence_ids)),
                        )
                    )
                else:
                    observed_prices.append(p_dec)

        # If competitors list also exists on ctx, include them
        extra_competitors = getattr(ctx, "competitors", ())
        for c in extra_competitors:
            cid = getattr(c, "id", None) if not isinstance(c, dict) else c.get("id")
            cname = getattr(c, "name", None) if not isinstance(c, dict) else c.get("name")
            if cid:
                competitor_map[str(cid)] = str(cname) if cname else str(cid)

        # Also account for any competitor IDs found in evidence
        for cid in evidence_by_competitor:
            if cid not in competitor_map:
                competitor_map[cid] = cid

        competitors_count = len(competitor_map)
        evidence_tuple = tuple(dict.fromkeys(all_evidence_ids))

        # Check for mock-only evidence on real product
        is_insufficient = False
        if not is_demo and has_mock_or_seed_evidence and not has_trusted_evidence:
            is_insufficient = True
            findings.append(
                Finding(
                    code="COMPETITOR_EVIDENCE_MOCK_ONLY",
                    severity=Severity.CRITICAL,
                    message="Competitor research contains only mock or sample seed evidence. Real founder validation requires verified market research evidence.",
                    evidence_ids=evidence_tuple,
                )
            )

        # Check 1: Minimum competitor count
        if competitors_count < COMPETITOR_MIN_COUNT:
            is_insufficient = True
            findings.append(
                Finding(
                    code="COMPETITORS_INSUFFICIENT",
                    severity=Severity.CRITICAL,
                    message=(
                        f"Found {competitors_count} competitors. "
                        f"At least {COMPETITOR_MIN_COUNT} competitors are required for analysis."
                    ),
                    evidence_ids=evidence_tuple,
                )
            )

        # Check 2: Each competitor must have >= 1 evidence item
        under_researched: List[str] = []
        for cid, cname in competitor_map.items():
            ev_count = len(evidence_by_competitor.get(cid, []))
            if ev_count < COMPETITOR_MIN_EVIDENCE_PER_COMPETITOR:
                under_researched.append(cname)

        if under_researched:
            is_insufficient = True
            findings.append(
                Finding(
                    code="COMPETITOR_EVIDENCE_MISSING",
                    severity=Severity.CRITICAL,
                    message=f"Competitors lacking research evidence: {', '.join(under_researched)}.",
                    evidence_ids=evidence_tuple,
                )
            )

        # Check 3: Differentiation
        if not differentiation or not str(differentiation).strip():
            findings.append(
                Finding(
                    code="UNDIFFERENTIATED_PRODUCT",
                    severity=Severity.WARNING,
                    message="Product differentiation vs competitors is empty.",
                    field="product.differentiation_vs_competitors",
                    evidence_ids=evidence_tuple,
                )
            )

        # Check 4: Price band calculation
        price_min: Optional[Decimal] = None
        price_median: Optional[Decimal] = None
        price_max: Optional[Decimal] = None

        if not observed_prices:
            findings.append(
                Finding(
                    code="NO_PRICE_DATA",
                    severity=Severity.WARNING,
                    message="No competitor pricing data observed in competitor analyses.",
                    evidence_ids=evidence_tuple,
                )
            )
        else:
            observed_prices.sort()
            price_min = observed_prices[0]
            price_max = observed_prices[-1]
            n = len(observed_prices)
            if n % 2 == 1:
                price_median = observed_prices[n // 2]
            else:
                mid_sum = observed_prices[n // 2 - 1] + observed_prices[n // 2]
                price_median = (mid_sum / TWO).quantize(CENTS, rounding=ROUND_HALF_UP)

        metrics: dict[str, Any] = {
            "competitors_count": competitors_count,
            "competitor_price_min": price_min,
            "competitor_price_median": price_median,
            "competitor_price_max": price_max,
        }

        # Status determination: worst of FAILED > WARNING > PASSED
        if is_insufficient:
            status = Status.INSUFFICIENT_EVIDENCE
        else:
            has_critical = any(f.severity == Severity.CRITICAL for f in findings)
            has_warning = any(f.severity == Severity.WARNING for f in findings)
            if has_critical:
                status = Status.FAILED
            elif has_warning:
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


__all__ = ["CompetitorStage"]

