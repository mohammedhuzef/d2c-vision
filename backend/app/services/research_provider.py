import re
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any, Dict, List, Optional, Protocol
from uuid import UUID

from backend.app.core.config import settings
from backend.app.schemas.evidence import EvidenceIn
from backend.app.schemas.research import ResearchOutput
from backend.app.schemas.analysis import AnalysisIn


@dataclass
class ProductSummary:
    id: UUID
    name: str
    category: Optional[str] = None
    target_market: Optional[str] = None


@dataclass
class CompetitorSummary:
    id: UUID
    name: str
    website_url: Optional[str] = None
    notes: Optional[str] = None


class ResearchProvider(Protocol):
    def research(
        self,
        product: ProductSummary,
        competitors: List[CompetitorSummary],
    ) -> ResearchOutput:
        """Collects research evidence and competitor analyses."""
        ...


import logging

logger = logging.getLogger(__name__)


class MockResearchProvider:
    """
    Deterministic canned evidence provider.
    Runs completely offline with no network and no AI keys.
    """

    def __init__(self, reported_provider: str = "mock"):
        self.provider_name = reported_provider

    def research(
        self,
        product: ProductSummary,
        competitors: List[CompetitorSummary],
    ) -> ResearchOutput:
        from backend.app.schemas.research import CompetitorOutcome

        evidence_list: List[EvidenceIn] = []
        analyses_list: List[AnalysisIn] = []
        outcomes: List[CompetitorOutcome] = []

        base_prices = [29.95, 34.50, 39.00, 44.99, 49.95]

        for idx, comp in enumerate(competitors):
            domain = re.sub(r"[^a-zA-Z0-9]", "", comp.name.lower()) + ".com"
            observed_price = base_prices[idx % len(base_prices)]

            # 1. Pricing Page Evidence
            pricing_ev = EvidenceIn(
                source_type="pricing_page",
                source_url=f"https://www.{domain}/products/flagship",
                title=f"{comp.name} Flagship Product & Pricing",
                excerpt=f"{comp.name} standard model is listed at ${observed_price:.2f} retail with free domestic shipping.",
                confidence=Decimal("0.80"),
                data={"price": f"{observed_price:.2f}", "currency": "USD"},
            )
            evidence_list.append(pricing_ev)

            # 2. Customer Review Evidence
            review_ev = EvidenceIn(
                source_type="review",
                source_url=f"https://www.reviews.example.com/{domain}",
                title=f"{comp.name} Verified Buyer Reviews",
                excerpt=f"Buyers praise {comp.name} build quality and materials, though some note premium price point.",
                confidence=Decimal("0.80"),
                data={"average_rating": 4.4, "review_count": 320},
            )
            evidence_list.append(review_ev)

            # 3. Competitor Analysis
            analysis = AnalysisIn(
                competitor_id=comp.id,
                summary=f"{comp.name} represents a major category benchmark with strong brand presence in {product.category or 'the sector'}.",
                strengths=["High consumer trust", "Robust product durability", "Established retailer presence"],
                weaknesses=["Premium price resistance", "Heavier standard packaging"],
                price_observed=Decimal(str(observed_price)),
                evidence_ids=[],
                produced_by="mock",
            )
            analyses_list.append(analysis)

            outcomes.append(
                CompetitorOutcome(
                    competitor_id=comp.id,
                    status="completed",
                    error_code=None,
                    evidence_count=2,
                )
            )

        return ResearchOutput(
            evidence=evidence_list,
            analyses=analyses_list,
            competitor_outcomes=outcomes,
            run_status="completed",
        )


def get_research_provider() -> ResearchProvider:
    """FastAPI dependency injecting the configured ResearchProvider."""
    provider_type = settings.RESEARCH_PROVIDER
    if provider_type == "ai":
        if not settings.LLM_API_KEY:
            logger.warning(
                "RESEARCH_PROVIDER is 'ai' but LLM_API_KEY is not configured. Falling back to MockResearchProvider."
            )
            return MockResearchProvider(reported_provider="mock")
        from backend.app.services.ai_research_provider import AIResearchProvider
        return AIResearchProvider()
    return MockResearchProvider(reported_provider="mock")

