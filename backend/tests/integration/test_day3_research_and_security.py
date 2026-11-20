"""
Integration tests for Day 3: Gemini Research and Security Flow.
100% Hermetic with fake LLM and fake page fetcher.
"""

from decimal import Decimal
from pathlib import Path
from unittest.mock import MagicMock, patch
import pytest

from backend.app.core.config import settings
from backend.app.models.evidence import ResearchEvidence
from backend.app.services.page_fetcher import FetchedPage
from scripts.run_stages_vector_a import get_vector_a_assumptions


def test_full_vector_a_flow_with_ai_research_and_validation(client, db_session):
    """
    1. Create Vector A product (price 500.00, cogs 150.00, packaging 30.00, shipping 40.00).
    2. Add two competitors: C1 (website https://comp1.test), C2 (website https://comp2.test).
    3. Run AI research with mocked page fetcher & LLM client:
       - C1 page text contains price $450.00
       - C2 page text contains price $550.00
    4. Verify research run completed, produced_by 'ai:gemini', evidence inserted.
    5. Verify GET /api/v1/products/{id} reflects revalidation_required = True (or draft).
    6. Run validation: competitor stage PASSED, price band min 450.00, max 550.00.
    7. Verify GET /api/v1/products/{id} now reflects revalidation_required = False.
    """
    # 1. Create Vector A product
    assumptions = get_vector_a_assumptions()
    prod_payload = {
        "name": "Vector A Tumbler",
        "category": "Drinkware",
        "assumptions": assumptions,
    }
    p_resp = client.post("/api/v1/products", json=prod_payload)
    assert p_resp.status_code == 201
    prod_id = p_resp.json()["id"]

    # 2. Add two competitors
    comp_resp = client.post(
        f"/api/v1/products/{prod_id}/competitors",
        json={
            "competitors": [
                {"name": "Competitor Alpha", "website_url": "https://alpha.example.com"},
                {"name": "Competitor Beta", "website_url": "https://beta.example.com"},
            ]
        },
    )
    assert comp_resp.status_code == 201

    # 3. Mock fetcher and LLM client for AI research
    page_alpha = (
        "Alpha Tumbler is double-insulated. Official price is $450.00 with free delivery. "
        "Built with 304 food-grade stainless steel."
    )
    page_beta = (
        "Beta Flask offers thermo-shield locking. Official price is $550.00 for the 1L edition. "
        "Ergonomic handle and scratch-proof coating."
    )

    def fake_fetch(url):
        if "alpha" in url:
            return FetchedPage(
                url=url,
                status_code=200,
                title="Alpha Store",
                text=page_alpha,
                content_type="text/html",
                content_length=len(page_alpha),
            )
        else:
            return FetchedPage(
                url=url,
                status_code=200,
                title="Beta Store",
                text=page_beta,
                content_type="text/html",
                content_length=len(page_beta),
            )

    def fake_generate_json(prompt, schema=None, system_instruction=None):
        if "alpha" in prompt.lower() or "alpha store" in prompt.lower():
            return {
                "observed_price": "450.00",
                "price_excerpt": "Official price is $450.00 with free delivery.",
                "currency": "USD",
                "claims": [
                    {
                        "text": "304 food-grade steel",
                        "excerpt": "Built with 304 food-grade stainless steel.",
                    }
                ],
                "strengths": [
                    {
                        "text": "Double insulation",
                        "excerpt": "Alpha Tumbler is double-insulated.",
                    }
                ],
                "weaknesses": [],
            }
        else:
            return {
                "observed_price": "550.00",
                "price_excerpt": "Official price is $550.00 for the 1L edition.",
                "currency": "USD",
                "claims": [
                    {
                        "text": "Scratch proof",
                        "excerpt": "Ergonomic handle and scratch-proof coating.",
                    }
                ],
                "strengths": [
                    {
                        "text": "Thermo-shield locking",
                        "excerpt": "Beta Flask offers thermo-shield locking.",
                    }
                ],
                "weaknesses": [],
            }

    with patch("backend.app.services.page_fetcher.PageFetcher.fetch", side_effect=fake_fetch), \
         patch("backend.app.services.llm_client.LLMClient.generate_json", side_effect=fake_generate_json):

        # Set provider to "ai" with a mock key
        with patch.object(settings, "RESEARCH_PROVIDER", "ai"), \
             patch.object(settings, "LLM_API_KEY", "test-key-valid"):

            r_resp = client.post(f"/api/v1/products/{prod_id}/research")
            assert r_resp.status_code == 202
            r_data = r_resp.json()
            assert r_data["evidence_count"] >= 2
            run_id = r_data["research_id"]

            # Verify research run status
            run_status_resp = client.get(f"/api/v1/products/{prod_id}/research/{run_id}")
            assert run_status_resp.status_code == 200
            run_status_data = run_status_resp.json()
            assert run_status_data["provider"] == "ai:gemini"
            assert run_status_data["status"] == "completed"

    # 4. Check Product Detail
    detail_resp = client.get(f"/api/v1/products/{prod_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["competitors_count"] == 2

    # 5. Execute Validation
    val_resp = client.post(f"/api/v1/products/{prod_id}/validate")
    assert val_resp.status_code == 200
    val_data = val_resp.json()

    # Check competitor stage
    results_map = {r["stage"]: r for r in val_data["results"]}
    comp_stage = results_map["competitor"]
    assert comp_stage["status"] == "PASSED"

    # Price band metrics: min 450.00, median 500.00, max 550.00
    metrics = comp_stage["metrics"]
    assert float(metrics["competitor_price_min"]) == 450.00
    assert float(metrics["competitor_price_max"]) == 550.00
    assert float(metrics["competitor_price_median"]) == 500.00

    # 6. Verify Product Detail revalidation_required is now False
    detail_after = client.get(f"/api/v1/products/{prod_id}").json()
    assert detail_after["revalidation_required"] is False
    assert detail_after["validated_version"] == 1


def test_source_scans_pure_services_isolation():
    """services/validation and finance have no import of llm_client, ai_research_provider, page_fetcher or httpx."""
    base_dir = Path(__file__).resolve().parent.parent.parent / "app" / "services"
    pure_targets = [
        base_dir / "finance.py",
        base_dir / "readiness.py",
        base_dir / "simulation.py",
        base_dir / "recommendations.py",
    ]
    pure_targets.extend((base_dir / "validation").glob("*.py"))

    forbidden_tokens = ["llm_client", "ai_research_provider", "page_fetcher", "httpx"]

    violations = []
    for target in pure_targets:
        if not target.exists():
            continue
        text = target.read_text(encoding="utf-8")
        for line_num, line in enumerate(text.splitlines(), start=1):
            stripped = line.strip()
            if stripped.startswith("#"):
                continue
            for token in forbidden_tokens:
                if f"import {token}" in stripped or f"from {token}" in stripped or f"{token}." in stripped:
                    violations.append(f"{target.name}:{line_num}: {line}")

    assert not violations, f"Forbidden non-pure imports found in pure services: {violations}"
