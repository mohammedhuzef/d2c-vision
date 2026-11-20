from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class ExtractedEvidence:
    source_type: str
    source_url: Optional[str]
    title: str
    excerpt: str
    confidence: Decimal
    data: Dict[str, Any] = field(default_factory=dict)
    competitor_id: Optional[str] = None


@dataclass(frozen=True)
class ExtractedAnalysis:
    competitor_id: str
    summary: str
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    price_observed: Optional[Decimal] = None
    produced_by: str = "mock"


@dataclass(frozen=True)
class ProviderCompetitorOutcome:
    competitor_id: str
    status: str
    error_code: Optional[str] = None
    evidence_count: int = 0


@dataclass(frozen=True)
class ResearchResult:
    provider: str
    evidence: List[ExtractedEvidence]
    analyses: List[ExtractedAnalysis]
    competitor_outcomes: List[ProviderCompetitorOutcome]
    errors: Optional[Dict[str, Any]] = None


class ResearchProvider(ABC):
    @abstractmethod
    def research(
        self, product_data: Dict[str, Any], competitors_data: List[Dict[str, Any]]
    ) -> ResearchResult:
        """Run research on product and its competitors."""
        pass


class MockResearchProvider(ResearchProvider):
    """Deterministic research provider that operates without network or AI."""

    def research(
        self, product_data: Dict[str, Any], competitors_data: List[Dict[str, Any]]
    ) -> ResearchResult:
        evidence_list: List[ExtractedEvidence] = []
        analyses_list: List[ExtractedAnalysis] = []
        outcomes: List[ProviderCompetitorOutcome] = []

        # If no competitors, produce general product evidence
        if not competitors_data:
            p_name = product_data.get("name", "Product")
            ev = ExtractedEvidence(
                source_type="website",
                source_url=f"https://mock-market-research.local/{p_name.lower().replace(' ', '-')}",
                title=f"MOCK Market Study: {p_name}",
                excerpt=f"Initial mock market indicators show baseline demand for {p_name}.",
                confidence=Decimal("0.48"),
                data={"market_segment": "D2C Direct"},
                competitor_id=None,
            )
            evidence_list.append(ev)

        # For each competitor, generate deterministic mock evidence and analysis
        for idx, comp in enumerate(competitors_data):
            c_id = comp.get("id")
            c_name = comp.get("name", f"Competitor {idx + 1}")
            c_url = comp.get("website_url") or f"https://mock-{c_name.lower().replace(' ', '-')}.local"

            # Mock price between 400.00 and 600.00 deterministically
            mock_price = Decimal("450.00") if idx % 2 == 0 else Decimal("550.00")

            ev_pricing = ExtractedEvidence(
                source_type="pricing_page",
                source_url=f"{c_url}/pricing",
                title=f"MOCK Pricing Page: {c_name}",
                excerpt=f"Official retail price observed at {mock_price:.2f} USD for {c_name}.",
                confidence=Decimal("0.48"),
                data={"price": str(mock_price)},
                competitor_id=c_id,
            )

            ev_feature = ExtractedEvidence(
                source_type="website",
                source_url=f"{c_url}/about",
                title=f"MOCK Company Profile: {c_name}",
                excerpt=f"Mock profile overview and feature positioning for {c_name}.",
                confidence=Decimal("0.45"),
                data={"established": 2020},
                competitor_id=c_id,
            )

            evidence_list.extend([ev_pricing, ev_feature])

            analysis = ExtractedAnalysis(
                competitor_id=c_id,
                summary=f"MOCK Analysis: {c_name} maintains steady market presence with standard positioning.",
                strengths=[f"Strong mock distribution network for {c_name}", "Established category presence"],
                weaknesses=[f"Higher price point than entry-level alternatives for {c_name}"],
                price_observed=mock_price,
                produced_by="mock",
            )
            analyses_list.append(analysis)

            outcomes.append(
                ProviderCompetitorOutcome(
                    competitor_id=c_id,
                    status="completed",
                    error_code=None,
                    evidence_count=2,
                )
            )

        return ResearchResult(
            provider="mock",
            evidence=evidence_list,
            analyses=analyses_list,
            competitor_outcomes=outcomes,
            errors=None,
        )


def get_research_provider(
    provider_name: Optional[str] = None, api_key: Optional[str] = None
) -> ResearchProvider:
    """Select appropriate research provider with fallback to mock."""
    from backend.app.core.config import settings

    target_provider = provider_name or getattr(settings, "RESEARCH_PROVIDER", "mock")
    target_key = api_key if api_key is not None else getattr(settings, "LLM_API_KEY", None)

    if target_provider == "ai":
        if not target_key or not target_key.strip():
            return MockResearchProvider()
        from backend.app.services.ai_research_provider import AIResearchProvider
        from backend.app.services.llm_client import LLMClient
        from backend.app.services.page_fetcher import PageFetcher

        return AIResearchProvider(
            page_fetcher=PageFetcher(),
            llm_client=LLMClient(api_key=target_key),
        )

    return MockResearchProvider()
