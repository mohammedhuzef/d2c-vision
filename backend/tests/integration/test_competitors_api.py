import json
import uuid
from decimal import Decimal
import jsonschema
import pytest
from fastapi.testclient import TestClient

from backend.app.core.database import SessionLocal
from backend.app.main import app
from backend.app.models.evidence import ResearchEvidence, compute_evidence_content_hash
from backend.app.models.product import Product
from backend.app.models.version import ProductVersion


@pytest.fixture
def openapi_schema():
    with open("contracts/openapi.json", "r", encoding="utf-8") as f:
        return json.load(f)


def _validate_response_schema(spec: dict, schema_name: str, instance: dict):
    target_schema = spec["components"]["schemas"][schema_name]
    resolver = jsonschema.RefResolver.from_schema(spec)
    jsonschema.validate(instance=instance, schema=target_schema, resolver=resolver)


@pytest.fixture
def sample_product(db_session):
    p_id = uuid.uuid4()
    p = Product(id=p_id, name="Competitor Test Bottle", status="draft")
    db_session.add(p)
    v = ProductVersion(
        id=uuid.uuid4(),
        product_id=p_id,
        version_number=1,
        assumptions={"pricing": {"selling_price": "500.00"}},
    )
    db_session.add(v)
    db_session.commit()
    return str(p_id)


def test_post_competitors_success(client, openapi_schema, sample_product):
    payload = {
        "competitors": [
            {
                "name": "Klean Kanteen",
                "website_url": "https://www.kleankanteen.com",
                "notes": "Premium brand",
                "observed_price": "450.00",
            },
            {
                "name": "Hydro Flask",
                "website_url": "https://www.hydroflask.com",
                "notes": "Market leader",
                "observed_price": "550.00",
            },
        ]
    }
    res = client.post(f"/api/v1/products/{sample_product}/competitors", json=payload)
    assert res.status_code == 201
    data = res.json()
    _validate_response_schema(openapi_schema, "CompetitorListResponse", data)
    assert len(data["items"]) == 2
    names = [c["name"] for c in data["items"]]
    assert "Klean Kanteen" in names
    assert "Hydro Flask" in names

    # Verify analyses created for observed price
    for c in data["items"]:
        assert len(c["analyses"]) == 1
        assert c["analyses"][0]["price_observed"] in (450.0, 550.0)


def test_post_competitors_duplicate_in_payload(client, sample_product):
    payload = {
        "competitors": [
            {"name": "Brand Alpha", "observed_price": "100.00"},
            {"name": "brand alpha", "observed_price": "120.00"},
        ]
    }
    res = client.post(f"/api/v1/products/{sample_product}/competitors", json=payload)
    assert res.status_code == 409
    assert "Duplicate competitor" in res.json()["error"]["message"]


def test_post_competitors_duplicate_in_db(client, sample_product):
    payload1 = {
        "competitors": [{"name": "Unique Brand", "observed_price": "200.00"}]
    }
    res1 = client.post(f"/api/v1/products/{sample_product}/competitors", json=payload1)
    assert res1.status_code == 201

    payload2 = {
        "competitors": [{"name": "unique brand", "observed_price": "250.00"}]
    }
    res2 = client.post(f"/api/v1/products/{sample_product}/competitors", json=payload2)
    assert res2.status_code == 409


def test_get_competitors(client, openapi_schema, sample_product):
    client.post(
        f"/api/v1/products/{sample_product}/competitors",
        json={"competitors": [{"name": "Fetch Brand", "observed_price": "300.00"}]},
    )
    res = client.get(f"/api/v1/products/{sample_product}/competitors")
    assert res.status_code == 200
    data = res.json()
    _validate_response_schema(openapi_schema, "CompetitorListResponse", data)
    assert len(data["items"]) >= 1


def test_get_competitor_summary(client, openapi_schema, sample_product):
    payload = {
        "competitors": [
            {"name": "Summary A", "observed_price": "450.00"},
            {"name": "Summary B", "observed_price": "550.00"},
            {"name": "Summary C", "observed_price": "500.00"},
        ]
    }
    client.post(f"/api/v1/products/{sample_product}/competitors", json=payload)

    res = client.get(f"/api/v1/products/{sample_product}/competitors/summary")
    assert res.status_code == 200
    data = res.json()
    _validate_response_schema(openapi_schema, "CompetitorPriceSummary", data)
    assert data["competitor_price_min"] == "450.00"
    assert data["competitor_price_median"] == "500.00"
    assert data["competitor_price_max"] == "550.00"
    assert data["competitors_count"] == 3


def test_get_evidence(client, db_session, openapi_schema, sample_product):
    p_uuid = uuid.UUID(sample_product)
    ev1 = ResearchEvidence(
        id=uuid.uuid4(),
        product_id=p_uuid,
        competitor_id=None,
        source_type="website",
        source_url="https://example.com/item1",
        title="Item 1 Title",
        excerpt="Item 1 excerpt",
        confidence=Decimal("0.90"),
        content_hash=compute_evidence_content_hash("https://example.com/item1", "Item 1 excerpt"),
    )
    ev2 = ResearchEvidence(
        id=uuid.uuid4(),
        product_id=p_uuid,
        competitor_id=None,
        source_type="review",
        source_url="https://example.com/rev",
        title="Review Title",
        excerpt="Review excerpt",
        confidence=Decimal("0.85"),
        content_hash=compute_evidence_content_hash("https://example.com/rev", "Review excerpt"),
    )
    db_session.add_all([ev1, ev2])
    db_session.commit()

    res = client.get(f"/api/v1/products/{sample_product}/evidence")
    assert res.status_code == 200
    data = res.json()
    _validate_response_schema(openapi_schema, "EvidenceListResponse", data)
    assert data["total"] == 2
    assert len(data["items"]) == 2

    # Filter by source_type
    res_filtered = client.get(
        f"/api/v1/products/{sample_product}/evidence?source_type=review"
    )
    assert res_filtered.status_code == 200
    data_filtered = res_filtered.json()
    assert data_filtered["total"] == 1
    assert data_filtered["items"][0]["source_type"] == "review"


def test_competitors_errors(client):
    unknown_id = str(uuid.uuid4())
    res_404 = client.get(f"/api/v1/products/{unknown_id}/competitors")
    assert res_404.status_code == 404

    res_422 = client.get("/api/v1/products/bad-uuid-string/competitors")
    assert res_422.status_code == 422
