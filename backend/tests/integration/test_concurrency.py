"""Concurrency tests for simultaneous patch operations."""

import concurrent.futures
import pytest
from starlette.testclient import TestClient

from scripts.run_stages_vector_a import get_vector_a_assumptions


def test_concurrent_patches_same_product(client: TestClient):
    """Two simultaneous patches against the same product must succeed,

    yielding versions N+1 and N+2 with no lost updates and no duplicate key errors.
    """
    assumptions = get_vector_a_assumptions()
    create_resp = client.post(
        "/api/v1/products",
        json={"name": "ConcurrencyTestProduct", "assumptions": assumptions},
    )
    assert create_resp.status_code == 201
    product_id = create_resp.json()["id"]

    patch1 = {
        "patch": {
            "customer": {
                "customer_interviews_count": 15,
            }
        }
    }
    patch2 = {
        "patch": {
            "marketing": {
                "expected_cac": 45.00,
            }
        }
    }

    results = []

    def run_patch(payload):
        resp = client.patch(f"/api/v1/products/{product_id}/assumptions", json=payload)
        return resp.status_code, resp.json()

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        f1 = executor.submit(run_patch, patch1)
        f2 = executor.submit(run_patch, patch2)
        results = [f1.result(), f2.result()]

    status1, body1 = results[0]
    status2, body2 = results[1]

    assert status1 == 200, f"Thread 1 failed with {status1}: {body1}"
    assert status2 == 200, f"Thread 2 failed with {status2}: {body2}"

    # Verify versions are 2 and 3 in some order
    versions_created = {body1["new_version"], body2["new_version"]}
    assert versions_created == {2, 3}, f"Expected versions 2 and 3, got: {versions_created}"

    # Fetch product detail to check latest state
    detail_resp = client.get(f"/api/v1/products/{product_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["current_version"] == 3

    # Check that both changes are present in latest assumptions (no lost update)
    latest_assumptions = detail["assumptions"]
    assert latest_assumptions["customer"]["customer_interviews_count"] == 15
    assert float(latest_assumptions["marketing"]["expected_cac"]) == 45.0

    # Fetch versions list
    versions_resp = client.get(f"/api/v1/products/{product_id}/versions")
    assert versions_resp.status_code == 200
    versions_data = versions_resp.json()
    assert len(versions_data["items"]) == 3
    version_numbers = [v["version_number"] for v in versions_data["items"]]
    assert sorted(version_numbers) == [1, 2, 3]

    # Fetch impact events list
    impact_resp = client.get(f"/api/v1/products/{product_id}/impact-events")
    assert impact_resp.status_code == 200
    impact_data = impact_resp.json()
    assert impact_data["total"] == 2
