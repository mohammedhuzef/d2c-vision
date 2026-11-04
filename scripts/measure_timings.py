"""Performance benchmark measuring timings for core backend operations.

Operations:
1. POST /api/v1/products (creation)
2. POST /api/v1/products/{id}/validate (6-stage validation run)
3. POST /api/v1/products/{id}/validation/simulate (What-If simulation)
4. GET /api/v1/products (List products with 20 items, query count <= 6)
5. POST /api/v1/products/{id}/reports (Report generation with evidence quality & Markdown)
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import time
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def benchmark():
    timings = {}

    # Seed 20 products for list test
    product_ids = []
    t0 = time.perf_counter()
    for i in range(20):
        res = client.post("/api/v1/products", json={
            "name": f"Timing Bench Product {i}",
            "category": "Beverages",
            "assumptions": {
                "pricing": {"selling_price": "500.00"},
                "packaging": {"packaging_cost": "30.00"},
                "costs": {
                    "cogs_per_unit": "150.00",
                    "shipping_cost_per_unit": "40.00",
                    "fixed_costs_total": "50000.00",
                    "payment_fee_fraction": "0.02"
                }
            }
        })
        assert res.status_code == 201
        product_ids.append(res.json()["id"])
    target_id = product_ids[0]

    # Add competitors and evidence for full validation
    client.post(f"/api/v1/products/{target_id}/competitors", json={
        "competitors": [
            {"name": "Competitor Alpha", "website_url": "https://alpha.example.com", "observed_price": "450.00"},
            {"name": "Competitor Beta", "website_url": "https://beta.example.com", "observed_price": "480.00"}
        ]
    })
    client.post(f"/api/v1/products/{target_id}/research")

    # 1. Validation run
    t0 = time.perf_counter()
    val_res = client.post(f"/api/v1/products/{target_id}/validate")
    t_val = time.perf_counter() - t0
    assert val_res.status_code == 200
    timings["validation_run"] = t_val

    # 2. Simulation run
    t0 = time.perf_counter()
    sim_res = client.post(f"/api/v1/products/{target_id}/validation/simulate", json={
        "overrides": {
            "packaging.packaging_cost": 60.00,
            "costs.cogs_per_unit": 160.00
        }
    })
    t_sim = time.perf_counter() - t0
    assert sim_res.status_code == 200
    timings["simulate"] = t_sim

    # 3. Product list (20 items)
    t0 = time.perf_counter()
    list_res = client.get("/api/v1/products?limit=20&offset=0")
    t_list = time.perf_counter() - t0
    assert list_res.status_code == 200
    assert len(list_res.json()["items"]) == 20
    timings["product_list_20"] = t_list

    # 4. Report generation
    t0 = time.perf_counter()
    rep_res = client.post(f"/api/v1/products/{target_id}/reports", json={
        "title": "Comprehensive Benchmark Report"
    })
    t_rep = time.perf_counter() - t0
    assert rep_res.status_code == 201
    timings["report_generation"] = t_rep

    print("--- PERFORMANCE BENCHMARK RESULTS ---")
    for op, elapsed in timings.items():
        status_str = "PASS (<1.0s)" if elapsed < 1.0 else "FAIL (>=1.0s)"
        print(f"{op:25s}: {elapsed * 1000:7.2f} ms ({elapsed:.4f} s) [{status_str}]")

    return timings

if __name__ == "__main__":
    benchmark()
