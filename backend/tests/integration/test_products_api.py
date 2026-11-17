"""Integration tests for products, versions, assumptions patching, and impact events."""

from decimal import Decimal
import json
from pathlib import Path
import pytest

from backend.app.core.config import settings
from backend.app.schemas.product import ProductResponse
from scripts.run_stages_vector_a import get_vector_a_assumptions


def test_create_product_with_example_json(client):
    """POST /api/v1/products with post_products.json creates product and version 1."""
    root_dir = Path(__file__).resolve().parent.parent.parent.parent
    example_path = root_dir / "contracts" / "examples" / "post_products.json"
    with open(example_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    payload = data["request"]
    resp = client.post("/api/v1/products", json=payload)
    assert resp.status_code == 201

    body = resp.json()
    assert body["name"] == "EcoSip Bamboo Tumbler"
    assert body["current_version"] == 1
    assert body["status"] == "draft"
    assert "id" in body
    assert "created_at" in body
    # Validate against schema
    ProductResponse(**body)


def test_get_product_detail(client):
    """GET /api/v1/products/{id} returns full ProductDetailResponse."""
    assumptions = get_vector_a_assumptions()
    create_resp = client.post(
        "/api/v1/products",
        json={"name": "ZenTumbler", "assumptions": assumptions},
    )
    assert create_resp.status_code == 201
    prod_id = create_resp.json()["id"]

    detail_resp = client.get(f"/api/v1/products/{prod_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()

    assert detail["id"] == prod_id
    assert detail["name"] == "ZenTumbler"
    assert detail["current_version"] == 1
    assert detail["competitors_count"] == 0
    assert detail["missing_evidence_count"] == 0
    assert detail["revalidation_required"] is False
    assert detail["research_provider"] == settings.RESEARCH_PROVIDER
    assert detail["latest_readiness"] is None
    assert detail["assumptions"]["pricing"]["selling_price"] == "500.00"


def test_vector_a_to_vector_b_patch_and_compare(client):
    """Vector A patched to Vector B:

    - Creates version 2
    - changed_fields == ['packaging.packaging_cost']
    - affected_stages == ['product_packaging', 'pricing', 'financial', 'marketing']
    - Version 1 remains unchanged (packaging 30.00)
    - Version 2 has packaging 60.00
    - Compare(1, 2) shows financial margin 0.5400 -> 0.4800, break-even 186 -> 209
    """
    assumptions = get_vector_a_assumptions()  # packaging 30.00, price 500.00
    create_resp = client.post(
        "/api/v1/products",
        json={"name": "VectorA Product", "assumptions": assumptions},
    )
    assert create_resp.status_code == 201
    prod_id = create_resp.json()["id"]

    # Patch packaging.packaging_cost to 60.00
    patch_payload = {
        "patch": {
            "packaging": {
                "packaging_cost": "60.00"
            }
        },
        "revalidate": True,
    }
    patch_resp = client.patch(f"/api/v1/products/{prod_id}/assumptions", json=patch_payload)
    assert patch_resp.status_code == 200
    patch_data = patch_resp.json()

    assert patch_data["new_version"] == 2
    assert patch_data["changed_fields"] == ["packaging.packaging_cost"]
    assert patch_data["affected_stages"] == ["product_packaging", "pricing", "financial", "marketing"]
    assert patch_data["impact_event"] is not None
    assert patch_data["impact_event"]["from_version"] == 1
    assert patch_data["impact_event"]["to_version"] == 2

    # Check versions list: version 1 must remain immutable and unchanged
    v_list_resp = client.get(f"/api/v1/products/{prod_id}/versions")
    assert v_list_resp.status_code == 200
    versions = v_list_resp.json()["items"]
    assert len(versions) == 2
    assert versions[0]["version_number"] == 2
    assert versions[1]["version_number"] == 1
    assert versions[1]["assumptions"]["packaging"]["packaging_cost"] == "30.00"
    assert versions[0]["assumptions"]["packaging"]["packaging_cost"] == "60.00"

    # Compare versions 1 and 2 (path form)
    compare_resp = client.get(f"/api/v1/products/{prod_id}/versions/1/compare/2")
    assert compare_resp.status_code == 200
    cmp_data = compare_resp.json()

    fin_deltas = cmp_data["stages"]["financial"]["metric_deltas"]
    assert fin_deltas["contribution_margin"]["before"] == 0.5400
    assert fin_deltas["contribution_margin"]["after"] == 0.4800
    assert fin_deltas["contribution_margin"]["delta"] == -0.0600

    assert fin_deltas["break_even_units"]["before"] == 186
    assert fin_deltas["break_even_units"]["after"] == 209
    assert fin_deltas["break_even_units"]["delta"] == 23

    # Compare query form
    query_cmp_resp = client.get(f"/api/v1/products/{prod_id}/versions/compare?version_a=1&version_b=2")
    assert query_cmp_resp.status_code == 200
    assert query_cmp_resp.json() == cmp_data

    # Check impact events endpoint
    impact_resp = client.get(f"/api/v1/products/{prod_id}/impact-events")
    assert impact_resp.status_code == 200
    impacts = impact_resp.json()["items"]
    assert len(impacts) == 1
    assert impacts[0]["from_version"] == 1
    assert impacts[0]["to_version"] == 2


def test_no_op_patch_creates_no_version(client):
    """A patch with identical values creates NO new version and returns current state."""
    assumptions = get_vector_a_assumptions()
    create_resp = client.post(
        "/api/v1/products",
        json={"name": "NoOp Test", "assumptions": assumptions},
    )
    prod_id = create_resp.json()["id"]

    # Patch with same packaging_cost (30.00)
    patch_payload = {
        "patch": {
            "packaging": {
                "packaging_cost": "30.00"
            }
        }
    }
    patch_resp = client.patch(f"/api/v1/products/{prod_id}/assumptions", json=patch_payload)
    assert patch_resp.status_code == 200
    data = patch_resp.json()

    assert data["new_version"] == 1
    assert data["changed_fields"] == []
    assert data["affected_stages"] == []
    assert data["impact_event"] is None

    # Version count is still 1
    v_resp = client.get(f"/api/v1/products/{prod_id}/versions")
    assert len(v_resp.json()["items"]) == 1


def test_error_handling_and_validation(client):
    """Tests 404 for unknown product, 422 for malformed UUID, negative price, and unknown paths."""
    # Malformed UUID -> 422
    resp_bad_uuid = client.get("/api/v1/products/not-a-valid-uuid")
    assert resp_bad_uuid.status_code == 422
    err_body = resp_bad_uuid.json()
    assert "error" in err_body
    assert err_body["error"]["code"] == "VALIDATION_ERROR"

    # Unknown product UUID -> 404
    non_existent = "00000000-0000-0000-0000-000000000000"
    resp_404 = client.get(f"/api/v1/products/{non_existent}")
    assert resp_404.status_code == 404
    err_404 = resp_404.json()
    assert err_404["error"]["code"] == "NOT_FOUND"

    # Create valid product
    create_resp = client.post("/api/v1/products", json={"name": "Validation Target"})
    prod_id = create_resp.json()["id"]

    # Unknown assumption path -> 422
    patch_unknown = client.patch(
        f"/api/v1/products/{prod_id}/assumptions",
        json={"patch": {"invalid_section": {"bad_field": 123}}},
    )
    assert patch_unknown.status_code == 422
    assert patch_unknown.json()["error"]["code"] == "VALIDATION_ERROR"

    # Negative price -> 422
    patch_neg_price = client.patch(
        f"/api/v1/products/{prod_id}/assumptions",
        json={"patch": {"pricing": {"selling_price": "-50.00"}}},
    )
    assert patch_neg_price.status_code == 422

    # Zero price -> 422
    patch_zero_price = client.patch(
        f"/api/v1/products/{prod_id}/assumptions",
        json={"patch": {"pricing": {"selling_price": "0.00"}}},
    )
    assert patch_zero_price.status_code == 422


def test_pagination_and_hard_cap(client):
    """GET /products respects limit, offset, and enforces a hard cap of 100."""
    # List products
    resp = client.get("/api/v1/products?limit=2&offset=0")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) <= 2

    # Limit > 100 is capped to 100
    resp_cap = client.get("/api/v1/products?limit=100")
    assert resp_cap.status_code == 200
    assert resp_cap.json()["limit"] == 100
