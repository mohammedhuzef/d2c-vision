import json
import uuid
from decimal import Decimal
import jsonschema
import pytest
from fastapi.testclient import TestClient

from backend.app.core.database import SessionLocal
from backend.app.main import app
from backend.app.models.evidence import ResearchEvidence
from backend.app.models.product import Product
from backend.app.models.version import ProductVersion


from scripts.run_stages_vector_a import get_vector_a_assumptions


@pytest.fixture
def openapi_schema():
    with open("contracts/openapi.json", "r", encoding="utf-8") as f:
        return json.load(f)


def _validate_schema(spec: dict, schema_name: str, instance: dict):
    target_schema = spec["components"]["schemas"][schema_name]
    resolver = jsonschema.RefResolver.from_schema(spec)
    jsonschema.validate(instance=instance, schema=target_schema, resolver=resolver)


@pytest.fixture
def vector_a_product(client):
    res = client.post(
        "/api/v1/products",
        json={"name": "Vector A Demo Tumbler", "assumptions": get_vector_a_assumptions()},
    )
    assert res.status_code == 201
    return res.json()["id"]


def test_ingest_research_results_and_idempotency(client, openapi_schema, vector_a_product):
    payload = {
        "product_id": vector_a_product,
        "evidence": [
            {
                "source_type": "pricing_page",
                "source_url": "https://example.com/item1",
                "title": "Item 1",
                "excerpt": "Observed price 450 USD",
                "confidence": 0.75,
                "data": {"price": 450.0},
            }
        ],
        "analyses": [
            {
                "summary": "Alpha competitor analysis",
                "strengths": ["Brand loyalty"],
                "weaknesses": ["High price"],
                "price_observed": 450.0,
                "produced_by": "ai-test",
            }
        ],
    }

    # 1. First ingest
    res1 = client.post("/api/v1/internal/research-results", json=payload)
    assert res1.status_code == 201
    data1 = res1.json()
    _validate_schema(openapi_schema, "ResearchIngestResponse", data1)
    assert data1["status"] == "success"
    assert data1["evidence_inserted"] == 1
    assert data1["analyses_inserted"] == 1

    # 2. Re-post same payload (idempotent: evidence_inserted == 0)
    res2 = client.post("/api/v1/internal/research-results", json=payload)
    assert res2.status_code == 201
    data2 = res2.json()
    assert data2["evidence_inserted"] == 0

    # 3. Test alias route /api/v1/internal/research/results
    res3 = client.post("/api/v1/internal/research/results", json=payload)
    assert res3.status_code == 201


def test_ingest_confidence_capping(client, db_session, vector_a_product):
    payload = {
        "product_id": vector_a_product,
        "evidence": [
            {
                "source_type": "manual",
                "source_url": "https://example.com/manual",
                "title": "Manual Evidence",
                "excerpt": "Manual entry excerpt",
                "confidence": 0.50,  # Manual entries are forced to 1.00
            },
            {
                "source_type": "website",
                "source_url": "https://example.com/ai",
                "title": "AI Evidence",
                "excerpt": "AI extracted excerpt",
                "confidence": 0.99,  # AI entries are capped at 0.80
            },
        ],
    }
    res = client.post("/api/v1/internal/research-results", json=payload)
    assert res.status_code == 201

    p_uuid = uuid.UUID(vector_a_product)
    ev_manual = db_session.execute(
        ResearchEvidence.__table__.select().where(
            ResearchEvidence.product_id == p_uuid,
            ResearchEvidence.source_type == "manual",
        )
    ).mappings().first()
    assert Decimal(str(ev_manual["confidence"])) == Decimal("1.00")

    ev_ai = db_session.execute(
        ResearchEvidence.__table__.select().where(
            ResearchEvidence.product_id == p_uuid,
            ResearchEvidence.source_type == "website",
        )
    ).mappings().first()
    assert Decimal(str(ev_ai["confidence"])) == Decimal("0.80")


def test_research_run_endpoints(client, openapi_schema, vector_a_product):
    # Add a competitor first
    client.post(
        f"/api/v1/products/{vector_a_product}/competitors",
        json={"competitors": [{"name": "Mock Competitor A", "observed_price": "450.00"}]},
    )

    # POST start research run
    res = client.post(f"/api/v1/products/{vector_a_product}/research")
    assert res.status_code == 202
    data = res.json()
    _validate_schema(openapi_schema, "ResearchStartResponse", data)
    assert data["status"] == "completed"
    assert data["evidence_count"] >= 2
    run_id = data["research_id"]

    # GET research run status
    res_status = client.get(f"/api/v1/products/{vector_a_product}/research/{run_id}")
    assert res_status.status_code == 200
    status_data = res_status.json()
    _validate_schema(openapi_schema, "ResearchStatusResponse", status_data)
    assert status_data["research_id"] == run_id
    assert status_data["status"] == "completed"
    assert status_data["competitor_count"] >= 1

    # GET research runs list
    res_list = client.get(f"/api/v1/products/{vector_a_product}/research")
    assert res_list.status_code == 200
    list_data = res_list.json()
    _validate_schema(openapi_schema, "ResearchRunListResponse", list_data)
    assert list_data["total"] >= 1


def test_reports_engine(client, openapi_schema, vector_a_product):
    # 1. 409 before validation run
    res_early = client.post(f"/api/v1/products/{vector_a_product}/reports")
    assert res_early.status_code == 409
    assert "no validation run" in res_early.json()["error"]["message"].lower()

    # 2. Run validation first
    client.post(f"/api/v1/products/{vector_a_product}/validate")

    # 3. POST create report
    res_report = client.post(f"/api/v1/products/{vector_a_product}/reports")
    assert res_report.status_code == 201
    report_data = res_report.json()
    _validate_schema(openapi_schema, "ReportResponse", report_data)

    rep_id = report_data["id"]
    assert report_data["product_id"] == vector_a_product
    assert "# Launch-Readiness Report:" in report_data["markdown"]
    assert "### Stage Summary Table" in report_data["markdown"]

    # 4. GET report by id
    res_get = client.get(f"/api/v1/products/{vector_a_product}/reports/{rep_id}")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == rep_id

    # 5. GET latest report
    res_latest = client.get(f"/api/v1/products/{vector_a_product}/reports/latest")
    assert res_latest.status_code == 200
    assert res_latest.json()["id"] == rep_id

    # 6. GET list reports
    res_list = client.get(f"/api/v1/products/{vector_a_product}/reports")
    assert res_list.status_code == 200
    _validate_schema(openapi_schema, "ReportListResponse", res_list.json())
    assert res_list.json()["total"] >= 1


def test_full_flow_day2(client, openapi_schema):
    """Full Day 2 flow: Create product -> Add competitors -> Research -> Validate -> Generate Report."""
    # 1. Create product with full Vector A assumptions
    create_payload = {
        "name": "Vector A Organic Water Bottle",
        "assumptions": get_vector_a_assumptions(),
    }
    p_res = client.post("/api/v1/products", json=create_payload)
    assert p_res.status_code == 201
    prod_id = p_res.json()["id"]

    # 2. Add 2 competitors
    comp_res = client.post(
        f"/api/v1/products/{prod_id}/competitors",
        json={
            "competitors": [
                {"name": "Competitor Klean", "website_url": "https://klean.local", "observed_price": "450.00"},
                {"name": "Competitor Hydro", "website_url": "https://hydro.local", "observed_price": "550.00"},
            ]
        },
    )
    assert comp_res.status_code == 201

    # 3. Run mock research
    r_res = client.post(f"/api/v1/products/{prod_id}/research")
    assert r_res.status_code == 202

    # 4. Validate
    v_res = client.post(f"/api/v1/products/{prod_id}/validate")
    assert v_res.status_code == 200
    v_data = v_res.json()
    assert v_data["verdict"] == "READY"
    assert v_data["readiness_score"] == 100.0

    # 5. Generate report
    rep_res = client.post(f"/api/v1/products/{prod_id}/reports")
    assert rep_res.status_code == 201
    rep_data = rep_res.json()
    assert rep_data["content"]["verdict"] == "READY"
    assert "Vector A Organic Water Bottle" in rep_data["markdown"]
    assert "READY" in rep_data["markdown"]
    assert "$500" in rep_data["markdown"]
