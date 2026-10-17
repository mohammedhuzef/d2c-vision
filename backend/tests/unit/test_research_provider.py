import uuid
from decimal import Decimal
import pytest

from backend.app.services.research_provider import (
    MockResearchProvider,
    ProductSummary,
    CompetitorSummary,
)


def test_mock_research_provider_offline():
    provider = MockResearchProvider()
    prod = ProductSummary(id=uuid.uuid4(), name="Smart Flask", category="Drinkware")
    comps = [
        CompetitorSummary(id=uuid.uuid4(), name="Klean Kanteen"),
        CompetitorSummary(id=uuid.uuid4(), name="Hydro Flask"),
    ]

    output = provider.research(prod, comps)
    assert len(output.evidence) == 4  # 2 items per competitor
    assert len(output.analyses) == 2

    # Check evidence structure
    ev = output.evidence[0]
    assert ev.source_type in ("pricing_page", "review")
    assert ev.confidence >= Decimal("0.80")
    assert ev.data is not None

    # Check analysis structure
    an = output.analyses[0]
    assert an.price_observed is not None
    assert len(an.strengths) > 0
    assert len(an.weaknesses) > 0
    assert an.produced_by == "mock"


def test_research_endpoints_and_idempotency(client):
    prod_res = client.post("/api/v1/products", json={"name": "Tumbler X"})
    product_id = prod_res.json()["id"]

    # Add competitors
    comp_res = client.post(
        f"/api/v1/products/{product_id}/competitors",
        json={"competitors": [{"name": "Brand Alpha"}, {"name": "Brand Beta"}]}
    )
    assert comp_res.status_code == 201

    # Trigger research
    res_start = client.post(f"/api/v1/products/{product_id}/research")
    assert res_start.status_code == 202
    data = res_start.json()
    assert data["status"] == "completed"
    assert data["evidence_count"] == 4
    research_id = data["research_id"]

    # Poll research status
    res_poll = client.get(f"/api/v1/products/{product_id}/research/{research_id}")
    assert res_poll.status_code == 200
    poll_data = res_poll.json()
    assert poll_data["evidence_count"] >= 4
    assert poll_data["competitor_count"] == 2
    assert "competitor_outcomes" in poll_data
    assert len(poll_data["competitor_outcomes"]) == 2
    assert poll_data["competitor_outcomes"][0]["status"] == "completed"

    # Check competitors list now has evidence count and analyses
    comps_get = client.get(f"/api/v1/products/{product_id}/competitors")
    assert comps_get.status_code == 200
    c_items = comps_get.json()["items"]
    assert any(c["evidence_count"] > 0 for c in c_items)

    # Ingest research via /internal/research-results (Test Idempotency)
    ingest_payload = {
        "product_id": product_id,
        "evidence": [
            {
                "source_type": "review",
                "source_url": "https://reviews.test/alpha",
                "title": "Alpha Review",
                "excerpt": "Great design and high quality.",
                "confidence": 0.88
            }
        ],
        "analyses": []
    }
    # First ingest
    r1 = client.post("/api/v1/internal/research-results", json=ingest_payload)
    assert r1.status_code == 201
    assert r1.json()["evidence_inserted"] == 1

    # Second ingest with same URL + excerpt -> 0 inserted (idempotent)
    r2 = client.post("/api/v1/internal/research-results", json=ingest_payload)
    assert r2.status_code == 201
    assert r2.json()["evidence_inserted"] == 0


def test_concurrent_research_conflict_409(client, db_session):
    from backend.app.models.research_run import ResearchRun

    prod_res = client.post("/api/v1/products", json={"name": "Tumbler Active Research"})
    product_id = prod_res.json()["id"]

    # Manually insert an active running research run
    active_run = ResearchRun(
        id=uuid.uuid4(),
        product_id=uuid.UUID(product_id),
        status="running",
        provider="mock",
    )
    db_session.add(active_run)
    db_session.commit()

    # Attempting to start a second research run while one is running returns 409 CONFLICT
    res = client.post(f"/api/v1/products/{product_id}/research")
    assert res.status_code == 409
    err = res.json()["error"]
    assert err["code"] == "CONFLICT"
    assert "already in progress" in err["message"]

