"""Tests validating products route responses against OpenAPI contract schemas."""

import json
from pathlib import Path
import jsonschema
import pytest

from scripts.run_stages_vector_a import get_vector_a_assumptions


@pytest.fixture(scope="module")
def openapi_spec():
    root_dir = Path(__file__).resolve().parent.parent.parent.parent
    spec_path = root_dir / "contracts" / "openapi.json"
    with open(spec_path, "r", encoding="utf-8") as f:
        return json.load(f)


def validate_against_schema(data, schema_name: str, spec: dict):
    resolver = jsonschema.RefResolver.from_schema(spec)
    ref_schema = {"$ref": f"#/components/schemas/{schema_name}"}
    jsonschema.validate(instance=data, schema=ref_schema, resolver=resolver)


def test_products_routes_openapi_conformance(client, openapi_spec):
    """Hits all 7 products routes and validates each JSON response against openapi.json."""
    root_dir = Path(__file__).resolve().parent.parent.parent.parent
    example_path = root_dir / "contracts" / "examples" / "post_products.json"
    with open(example_path, "r", encoding="utf-8") as f:
        post_payload = json.load(f)["request"]

    # OpenAPI contract specifies PackagingAssumptions-Output.unit_weight_grams as string
    if "packaging" in post_payload.get("assumptions", {}):
        post_payload["assumptions"]["packaging"]["unit_weight_grams"] = str(
            post_payload["assumptions"]["packaging"]["unit_weight_grams"]
        )

    # 1. POST /api/v1/products -> ProductResponse
    post_resp = client.post("/api/v1/products", json=post_payload)
    assert post_resp.status_code == 201
    prod_data = post_resp.json()
    validate_against_schema(prod_data, "ProductResponse", openapi_spec)
    prod_id = prod_data["id"]

    # 2. GET /api/v1/products -> ProductListResponse
    list_resp = client.get("/api/v1/products?limit=10&offset=0")
    assert list_resp.status_code == 200
    validate_against_schema(list_resp.json(), "ProductListResponse", openapi_spec)

    # 3. GET /api/v1/products/{id} -> ProductDetailResponse
    detail_resp = client.get(f"/api/v1/products/{prod_id}")
    assert detail_resp.status_code == 200
    validate_against_schema(detail_resp.json(), "ProductDetailResponse", openapi_spec)

    # 4. PATCH /api/v1/products/{id}/assumptions -> AssumptionsPatchResponse
    patch_payload = {
        "patch": {
            "packaging": {
                "packaging_cost": 60.00
            }
        },
        "revalidate": True
    }
    patch_resp = client.patch(f"/api/v1/products/{prod_id}/assumptions", json=patch_payload)
    assert patch_resp.status_code == 200
    validate_against_schema(patch_resp.json(), "AssumptionsPatchResponse", openapi_spec)

    # 5. GET /api/v1/products/{id}/versions -> ProductVersionListResponse
    versions_resp = client.get(f"/api/v1/products/{prod_id}/versions")
    assert versions_resp.status_code == 200
    validate_against_schema(versions_resp.json(), "ProductVersionListResponse", openapi_spec)

    # 6. GET /api/v1/products/{id}/versions/compare -> VersionCompareResponse
    compare_resp = client.get(f"/api/v1/products/{prod_id}/versions/1/compare/2")
    assert compare_resp.status_code == 200
    validate_against_schema(compare_resp.json(), "VersionCompareResponse", openapi_spec)

    # 7. GET /api/v1/products/{id}/impact-events -> ImpactEventListResponse
    impact_resp = client.get(f"/api/v1/products/{prod_id}/impact-events")
    assert impact_resp.status_code == 200
    validate_against_schema(impact_resp.json(), "ImpactEventListResponse", openapi_spec)
