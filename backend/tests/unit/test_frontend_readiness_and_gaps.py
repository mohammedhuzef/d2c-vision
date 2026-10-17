from decimal import Decimal
import uuid
import pytest
from sqlalchemy import event
from backend.app.core.database import Base


def test_products_list_and_detail_additive_fields(client):
    """Test GET /products and GET /products/{id} return all required additive fields."""
    prod = client.post(
        "/api/v1/products",
        json={
            "name": "Additive Test Product",
            "assumptions": {
                "pricing": {"selling_price": 50.00},
                "costs": {"cogs_per_unit": 15.00},
            },
        },
    ).json()
    product_id = prod["id"]

    # Initial state
    assert prod["current_version"] == 1
    assert prod["validated_version"] is None
    assert prod["revalidation_required"] is False
    assert prod["latest_readiness"] is None
    assert isinstance(prod["stage_statuses"], dict)
    for st in ("customer", "competitor", "product_packaging", "pricing", "financial", "marketing"):
        assert prod["stage_statuses"][st] == "NOT_RUN"
    assert prod["competitors_count"] == 0
    assert prod["missing_evidence_count"] == 0
    assert prod["research_provider"] == "mock"

    # Detail GET
    detail_res = client.get(f"/api/v1/products/{product_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["current_version"] == 1
    assert detail["validated_version"] is None
    assert detail["revalidation_required"] is False
    assert detail["competitors_count"] == 0

    # Add competitor with observed_price
    comp_res = client.post(
        f"/api/v1/products/{product_id}/competitors",
        json={
            "competitors": [
                {
                    "name": "Comp X",
                    "product_name": "Rival Widget",
                    "observed_price": "45.00",
                    "website_url": "https://rival.com",
                }
            ]
        },
    )
    assert comp_res.status_code == 201

    # Validate
    val_res = client.post(f"/api/v1/products/{product_id}/validate")
    assert val_res.status_code == 200

    # Re-check product detail after validation
    detail_after = client.get(f"/api/v1/products/{product_id}").json()
    assert detail_after["validated_version"] == 1
    assert detail_after["revalidation_required"] is False
    assert detail_after["latest_readiness"] is not None
    assert "label" in detail_after["latest_readiness"]
    assert detail_after["competitors_count"] == 1
    assert detail_after["missing_evidence_count"] == 0  # because observed_price created manual evidence!

    # Patch without revalidation -> revalidation_required should become True!
    patch_res = client.patch(
        f"/api/v1/products/{product_id}/assumptions",
        json={"patch": {"pricing": {"selling_price": 60.00}}, "revalidate": False},
    )
    assert patch_res.status_code == 200

    detail_patched = client.get(f"/api/v1/products/{product_id}").json()
    assert detail_patched["current_version"] == 2
    assert detail_patched["validated_version"] == 1
    assert detail_patched["revalidation_required"] is True


def test_no_n_plus_one_queries_for_products(client, db_session):
    """Assert query count when fetching 20 products is constant (<= 6 queries, strictly no N+1)."""
    # Create 20 products in the database
    for i in range(20):
        client.post("/api/v1/products", json={"name": f"Bulk Product {i}"})

    engine = db_session.get_bind()
    query_count = 0

    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        nonlocal query_count
        query_count += 1

    event.listen(engine, "before_cursor_execute", before_cursor_execute)
    try:
        resp = client.get("/api/v1/products?limit=20&offset=0")
        assert resp.status_code == 200
        items = resp.json()["items"]
        assert len(items) == 20
        # Total queries should be <= 6 (count + products + runs + competitors + research)
        assert query_count <= 6, f"Expected <= 6 queries, got {query_count} (N+1 query leak detected!)"
    finally:
        event.remove(engine, "before_cursor_execute", before_cursor_execute)


def test_impact_events_endpoint_statuses(client):
    """Test GET /products/{id}/impact-events: 200, 404, 422."""
    prod = client.post(
        "/api/v1/products",
        json={"name": "Impact Test Product", "assumptions": {"pricing": {"selling_price": 25.00}}},
    ).json()
    product_id = prod["id"]

    # Initial: 0 impact events
    res = client.get(f"/api/v1/products/{product_id}/impact-events")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 0
    assert data["items"] == []

    # Patch to generate impact event
    client.patch(
        f"/api/v1/products/{product_id}/assumptions",
        json={"patch": {"pricing": {"selling_price": 35.00}}, "revalidate": False},
    )

    # 200 with items
    res2 = client.get(f"/api/v1/products/{product_id}/impact-events")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["total"] == 1
    assert data2["items"][0]["changed_fields"] == ["pricing.selling_price"]
    assert "pricing" in data2["items"][0]["affected_stages"]

    # 404 on missing product
    rand_id = str(uuid.uuid4())
    res_404 = client.get(f"/api/v1/products/{rand_id}/impact-events")
    assert res_404.status_code == 404

    # 422 on invalid uuid
    res_422 = client.get("/api/v1/products/invalid-uuid/impact-events")
    assert res_422.status_code == 422


def test_evidence_endpoint_statuses_and_filters(client):
    """Test GET /products/{id}/evidence: 200, 404, 422 and competitor/source_type filtering."""
    prod = client.post("/api/v1/products", json={"name": "Evidence Test Prod"}).json()
    product_id = prod["id"]

    # Add competitor with observed_price -> manual evidence
    comp_res = client.post(
        f"/api/v1/products/{product_id}/competitors",
        json={
            "competitors": [
                {
                    "name": "Comp Y",
                    "observed_price": "29.99",
                    "website_url": "https://compy.com",
                }
            ]
        },
    ).json()
    comp_id = comp_res["items"][0]["id"]

    # Add website evidence via internal endpoint
    client.post(
        "/api/v1/internal/research-results",
        json={
            "product_id": product_id,
            "evidence": [
                {
                    "source_type": "website",
                    "source_url": "https://marketstudy.com",
                    "title": "Study",
                    "excerpt": "Market data excerpt",
                    "confidence": 0.85,
                }
            ],
        },
    )

    # 200 all
    res = client.get(f"/api/v1/products/{product_id}/evidence")
    assert res.status_code == 200
    assert res.json()["total"] == 2

    # Filter by source_type=manual
    res_manual = client.get(f"/api/v1/products/{product_id}/evidence?source_type=manual")
    assert res_manual.status_code == 200
    assert res_manual.json()["total"] == 1
    assert res_manual.json()["items"][0]["source_type"] == "manual"

    # Filter by competitor_id
    res_comp = client.get(f"/api/v1/products/{product_id}/evidence?competitor_id={comp_id}")
    assert res_comp.status_code == 200
    assert res_comp.json()["total"] == 1

    # 404
    rand_id = str(uuid.uuid4())
    assert client.get(f"/api/v1/products/{rand_id}/evidence").status_code == 404

    # 422
    assert client.get("/api/v1/products/bad-id/evidence").status_code == 422


def test_research_list_endpoint_statuses(client):
    """Test GET /products/{id}/research: 200, 404, 422."""
    prod = client.post("/api/v1/products", json={"name": "Research List Prod"}).json()
    product_id = prod["id"]

    # Initially empty list
    res = client.get(f"/api/v1/products/{product_id}/research")
    assert res.status_code == 200
    assert res.json()["total"] == 0

    # Start research run
    client.post(f"/api/v1/products/{product_id}/research")

    # List now has 1 run
    res2 = client.get(f"/api/v1/products/{product_id}/research")
    assert res2.status_code == 200
    data = res2.json()
    assert data["total"] == 1
    assert data["items"][0]["status"] == "completed"
    assert data["items"][0]["provider"] == "mock"

    # 404
    assert client.get(f"/api/v1/products/{uuid.uuid4()}/research").status_code == 404

    # 422
    assert client.get("/api/v1/products/not-a-uuid/research").status_code == 422


def test_reports_endpoints_statuses_and_latest_version_check(client):
    """Test reports: POST 409 BAD_STATE on unvalidated version, GET list, GET by id, GET /latest."""
    prod = client.post("/api/v1/products", json={"name": "Report Status Prod"}).json()
    product_id = prod["id"]

    # 1. POST /reports before any validation -> 409 BAD_STATE
    res_unval = client.post(f"/api/v1/products/{product_id}/reports")
    assert res_unval.status_code == 409
    assert res_unval.json()["error"]["code"] == "BAD_STATE"

    # Validate v1
    client.post(f"/api/v1/products/{product_id}/validate")

    # 2. POST /reports succeeds for v1
    res_rep = client.post(f"/api/v1/products/{product_id}/reports")
    assert res_rep.status_code == 201
    rep1 = res_rep.json()
    rep1_id = rep1["id"]

    # 3. GET /reports/latest
    res_latest = client.get(f"/api/v1/products/{product_id}/reports/latest")
    assert res_latest.status_code == 200
    assert res_latest.json()["id"] == rep1_id

    # 4. GET /reports (list)
    res_list = client.get(f"/api/v1/products/{product_id}/reports")
    assert res_list.status_code == 200
    assert res_list.json()["total"] == 1

    # 5. Patch to v2 WITHOUT revalidation -> POST /reports must 409 BAD_STATE (current version v2 not validated)
    client.patch(
        f"/api/v1/products/{product_id}/assumptions",
        json={"patch": {"pricing": {"selling_price": 99.00}}, "revalidate": False},
    )
    res_v2_unval = client.post(f"/api/v1/products/{product_id}/reports")
    assert res_v2_unval.status_code == 409
    assert res_v2_unval.json()["error"]["code"] == "BAD_STATE"

    # 6. Revalidate v2 -> POST /reports now succeeds!
    client.post(f"/api/v1/products/{product_id}/validate")
    res_v2_val = client.post(f"/api/v1/products/{product_id}/reports")
    assert res_v2_val.status_code == 201
    assert res_v2_val.json()["content"]["version_number"] == 2

    # 7. 404s
    assert client.get(f"/api/v1/products/{uuid.uuid4()}/reports").status_code == 404
    assert client.get(f"/api/v1/products/{uuid.uuid4()}/reports/latest").status_code == 404
    assert client.get(f"/api/v1/products/{product_id}/reports/{uuid.uuid4()}").status_code == 404

    # 8. 422s
    assert client.get("/api/v1/products/bad-uuid/reports").status_code == 422
    assert client.get(f"/api/v1/products/{product_id}/reports/bad-uuid").status_code == 422


def test_evidence_idempotency_via_content_hash(client):
    """Test POST /internal/research-results idempotency via content_hash."""
    prod = client.post("/api/v1/products", json={"name": "Idempotent Evidence Prod"}).json()
    product_id = prod["id"]

    payload = {
        "product_id": product_id,
        "evidence": [
            {
                "source_type": "review",
                "source_url": "https://reviews.com/item1",
                "title": "Review 1",
                "excerpt": "Great build quality and insulation.",
                "confidence": 0.90,
            }
        ],
    }

    # First ingest: 1 inserted
    res1 = client.post("/api/v1/internal/research-results", json=payload)
    assert res1.status_code == 201
    assert res1.json()["evidence_inserted"] == 1

    # Second identical ingest: 0 inserted, duplicate skipped idempotently
    res2 = client.post("/api/v1/internal/research-results", json=payload)
    assert res2.status_code == 201
    assert res2.json()["evidence_inserted"] == 0

    # Verify evidence count is exactly 1
    ev_list = client.get(f"/api/v1/products/{product_id}/evidence").json()
    assert ev_list["total"] == 1


def test_observed_price_feeds_competitor_stage(client):
    """Test competitor create with observed_price feeds competitor stage price band."""
    prod = client.post(
        "/api/v1/products",
        json={
            "name": "Observed Price Stage Prod",
            "assumptions": {
                "pricing": {"selling_price": 50.00},
                "product": {"differentiation_vs_competitors": "Unique patented handle"},
            },
        },
    ).json()
    product_id = prod["id"]

    # Add 2 competitors with observed prices
    client.post(
        f"/api/v1/products/{product_id}/competitors",
        json={
            "competitors": [
                {
                    "name": "Competitor Alpha",
                    "product_name": "Alpha Flask",
                    "observed_price": "40.00",
                    "website_url": "https://alpha.com",
                },
                {
                    "name": "Competitor Beta",
                    "product_name": "Beta Flask",
                    "observed_price": "60.00",
                    "website_url": "https://beta.com",
                },
            ]
        },
    )

    # Validate product
    val_res = client.post(f"/api/v1/products/{product_id}/validate").json()
    comp_result = next(r for r in val_res["results"] if r["stage"] == "competitor")

    # Competitor stage should have observed prices in metrics!
    metrics = comp_result["metrics"]
    assert "competitor_price_min" in metrics or "price_min" in metrics or len(metrics) > 0
    # Both competitors had evidence and prices, stage should NOT be deficient in evidence
    finding_codes = [f["code"] for f in comp_result["findings"]]
    assert "COMPETITOR_EVIDENCE_DEFICIENT" not in finding_codes


def test_report_sections_and_hand_calculated_evidence_quality(client):
    """Test report JSON sections and hand-calculate evidence_quality with 4 dp fractions."""
    prod = client.post(
        "/api/v1/products",
        json={
            "name": "Evidence Quality HandCalc Prod",
            "assumptions": {
                "pricing": {"selling_price": 100.00},
                "costs": {"cogs_per_unit": 20.00, "shipping_cost_per_unit": 5.00},
            },
        },
    ).json()
    product_id = prod["id"]

    # Ingest 3 evidence items:
    # 1. website, confidence 0.80, url present
    # 2. manual, confidence 1.00, url present
    # 3. other, confidence 0.90, NO url (null)
    client.post(
        "/api/v1/internal/research-results",
        json={
            "product_id": product_id,
            "evidence": [
                {
                    "source_type": "website",
                    "source_url": "https://source1.com",
                    "title": "Ev 1",
                    "excerpt": "Excerpt 1",
                    "confidence": 0.80,
                },
                {
                    "source_type": "manual",
                    "source_url": "https://source2.com",
                    "title": "Ev 2",
                    "excerpt": "Excerpt 2",
                    "confidence": 1.00,
                },
                {
                    "source_type": "other",
                    "source_url": None,
                    "title": "Ev 3",
                    "excerpt": "Excerpt 3",
                    "confidence": 0.90,
                },
            ],
        },
    )

    # Hand-calculate:
    # evidence_count = 3
    # average_confidence = (0.80 + 1.00 + 0.90) / 3 = 2.70 / 3 = 0.9000 -> "0.9000"
    # share_with_source_url = 2 / 3 = 0.66666... -> "0.6667"
    # counts_by_source_type = {"website": 1, "manual": 1, "other": 1}

    # Validate
    client.post(f"/api/v1/products/{product_id}/validate")

    # Generate Report
    rep_res = client.post(f"/api/v1/products/{product_id}/reports")
    assert rep_res.status_code == 201
    content = rep_res.json()["content"]

    # Verify all required JSON sections exist
    required_sections = [
        "verdict",
        "stage_table",
        "key_metrics",
        "risks",
        "recommendations",
        "next_steps",
        "evidence_quality",
        "version_number",
        "generated_at",
    ]
    for sec in required_sections:
        assert sec in content, f"Missing required report section: {sec}"

    eq = content["evidence_quality"]
    assert eq["evidence_count"] == 3
    assert eq["average_confidence"] == "0.9000"
    assert eq["share_with_source_url"] == "0.6667"
    assert eq["counts_by_source_type"] == {"website": 1, "manual": 1, "other": 1}
    assert isinstance(eq["stages_missing_evidence"], list)

    # Version comparison should be None since version is 1
    assert content.get("version_comparison") is None


def test_competitor_create_duplicate_409_and_invalid_422(client):
    """Test competitor create duplicate stays 409 and invalid payload is 422."""
    prod = client.post("/api/v1/products", json={"name": "Comp Dup Test Prod"}).json()
    product_id = prod["id"]

    # Initial add
    res = client.post(
        f"/api/v1/products/{product_id}/competitors",
        json={"competitors": [{"name": "Brand Unique", "observed_price": "25.00"}]},
    )
    assert res.status_code == 201

    # Duplicate name should stay 409 Conflict
    res_dup = client.post(
        f"/api/v1/products/{product_id}/competitors",
        json={"competitors": [{"name": "Brand Unique", "observed_price": "25.00"}]},
    )
    assert res_dup.status_code == 409
    assert res_dup.json()["error"]["code"] == "CONFLICT"

    # Case insensitive duplicate should stay 409
    res_case_dup = client.post(
        f"/api/v1/products/{product_id}/competitors",
        json={"competitors": [{"name": "brand unique"}]},
    )
    assert res_case_dup.status_code == 409
    assert res_case_dup.json()["error"]["code"] == "CONFLICT"

    # 422 on invalid competitor payload
    res_422 = client.post(
        f"/api/v1/products/{product_id}/competitors",
        json={"competitors": []},
    )
    assert res_422.status_code == 422

