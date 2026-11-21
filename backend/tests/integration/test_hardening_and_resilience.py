"""Hardening, resilience, performance, and security tests for LaunchTwin AI."""

import json
import time
from decimal import Decimal
import uuid

import pytest
from starlette.testclient import TestClient
from sqlalchemy import event

from backend.app.core.config import settings
from backend.app.models.product import Product
from backend.app.models.version import ProductVersion


def test_request_id_header_and_error_propagation(client: TestClient):
    """X-Request-ID is echoed back on both successful responses and errors."""
    custom_req_id = "test-req-id-12345"

    # 1. Successful endpoint echoes custom request ID
    resp = client.get("/health", headers={"X-Request-ID": custom_req_id})
    assert resp.status_code == 200
    assert resp.headers.get("X-Request-ID") == custom_req_id

    # 2. Error endpoint includes request ID in headers and JSON error envelope
    bad_uuid = str(uuid.uuid4())
    resp_err = client.get(f"/api/v1/products/{bad_uuid}", headers={"X-Request-ID": custom_req_id})
    assert resp_err.status_code == 404
    assert resp_err.headers.get("X-Request-ID") == custom_req_id
    err_body = resp_err.json()
    assert "error" in err_body
    assert err_body["error"]["request_id"] == custom_req_id

    # 3. Request without X-Request-ID generates a valid UUID
    resp_gen = client.get("/health")
    assert resp_gen.status_code == 200
    gen_id = resp_gen.headers.get("X-Request-ID")
    assert gen_id is not None
    # Verify valid UUID format
    assert uuid.UUID(gen_id)


def test_health_endpoints_db_check(client: TestClient):
    """Both /health and /api/v1/health check DB connectivity."""
    for path in ("/health", "/api/v1/health"):
        resp = client.get(path)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"
        assert "version" in data


def test_request_body_size_limit(client: TestClient):
    """Requests exceeding MAX_REQUEST_BODY_BYTES return 413 with standard envelope."""
    oversized_length = str(settings.MAX_REQUEST_BODY_BYTES + 5000)
    resp = client.post(
        "/api/v1/products",
        content=b"{}",
        headers={"Content-Length": oversized_length, "Content-Type": "application/json"},
    )
    assert resp.status_code == 413
    data = resp.json()
    assert data["error"]["code"] == "PAYLOAD_TOO_LARGE"
    assert "exceeds maximum allowed size" in data["error"]["message"]
    assert resp.headers.get("X-Request-ID") is not None


def test_money_validation_limits(client: TestClient, db_session):
    """Rejects absurd money numbers (> 10^9), negative values, and non-numeric inputs."""
    prod = Product(
        id=uuid.uuid4(),
        name="Hardening Product",
        status="active",
    )
    db_session.add(prod)
    v = ProductVersion(
        id=uuid.uuid4(),
        product_id=prod.id,
        version_number=1,
        assumptions={
            "pricing": {"selling_price": 500.00},
            "costs": {"cogs_per_unit": 150.00},
        },
    )
    db_session.add(v)
    db_session.commit()

    # 1. Reject > 10^9 magnitude in patch
    patch_huge = {
        "patch": {"pricing": {"selling_price": 9999999999.0}},
    }
    resp = client.patch(f"/api/v1/products/{prod.id}/assumptions", json=patch_huge)
    assert resp.status_code == 422
    assert "exceeds maximum allowed value" in resp.text

    # 2. Reject negative price in simulation
    sim_neg = {
        "overrides": {"selling_price": -50.0},
    }
    resp_sim = client.post(f"/api/v1/products/{prod.id}/simulate", json=sim_neg)
    assert resp_sim.status_code == 422

    # 3. Reject > 10^9 magnitude in simulation
    sim_huge = {
        "overrides": {"selling_price": "5000000000.0"},
    }
    resp_sim_huge = client.post(f"/api/v1/products/{prod.id}/simulate", json=sim_huge)
    assert resp_sim_huge.status_code == 422


def test_no_n_plus_one_queries_product_list(client: TestClient, db_session):
    """Listing 20 products must execute in a small constant number of SQL queries (<= 5)."""
    # Seed 10 products
    for i in range(10):
        p = Product(
            id=uuid.uuid4(),
            name=f"Query Test Prod {i}",
            category="Test",
            status="active",
        )
        db_session.add(p)
    db_session.commit()

    queries_executed = []

    def count_queries(conn, cursor, statement, parameters, context, executemany):
        # Exclude savepoint queries and metadata queries
        if "PRAGMA" not in statement and "SAVEPOINT" not in statement:
            queries_executed.append(statement)

    engine = db_session.get_bind()
    event.listen(engine, "before_cursor_execute", count_queries)

    try:
        resp = client.get("/api/v1/products?limit=20")
        assert resp.status_code == 200
        assert len(resp.json()["items"]) >= 10

        # Assert constant query bound (must be <= 5 queries, typically 2: count + select)
        query_count = len(queries_executed)
        assert query_count <= 5, f"Expected <= 5 queries, but observed {query_count} queries (N+1 regression!)"
    finally:
        event.remove(engine, "before_cursor_execute", count_queries)


def test_db_sessions_no_leaks(client: TestClient):
    """Executing repeated requests in sequence does not leak DB sessions."""
    for _ in range(25):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"


def test_performance_benchmarks(client: TestClient, db_session):
    """Verifies that validate, simulate, list, and report endpoints complete well under 1 second."""
    # Create product with version and assumptions
    prod = Product(
        id=uuid.uuid4(),
        name="Performance Benchmark Tumbler",
        category="Drinkware",
        status="active",
    )
    db_session.add(prod)
    v = ProductVersion(
        id=uuid.uuid4(),
        product_id=prod.id,
        version_number=1,
        assumptions={
            "customer": {"customer_interviews_count": 12, "target_customer": "Commuters", "problem_statement": "Leaks"},
            "product": {"differentiation_vs_competitors": "Ceramic liner"},
            "packaging": {"packaging_cost": 30.00},
            "pricing": {"selling_price": 500.00, "target_margin_fraction": 0.40},
            "costs": {"cogs_per_unit": 150.00, "shipping_cost_per_unit": 40.00, "packaging_cost": 30.00, "fixed_costs_total": 50000.00},
            "marketing": {"expected_cac": 60.00},
        },
    )
    db_session.add(v)
    db_session.commit()

    # 1. Product List Benchmark
    t0 = time.perf_counter()
    resp_list = client.get("/api/v1/products?limit=20")
    t_list = time.perf_counter() - t0
    assert resp_list.status_code == 200
    assert t_list < 1.0, f"Product list took {t_list:.3f}s (> 1.0s limit)"

    # 2. Validate Benchmark
    t0 = time.perf_counter()
    resp_val = client.post(f"/api/v1/products/{prod.id}/validate")
    t_val = time.perf_counter() - t0
    assert resp_val.status_code == 200
    assert t_val < 1.0, f"Validate took {t_val:.3f}s (> 1.0s limit)"

    # 3. Simulate Benchmark
    t0 = time.perf_counter()
    resp_sim = client.post(f"/api/v1/products/{prod.id}/simulate", json={"overrides": {"selling_price": 550.00}})
    t_sim = time.perf_counter() - t0
    assert resp_sim.status_code == 200
    assert t_sim < 1.0, f"Simulate took {t_sim:.3f}s (> 1.0s limit)"

    # 4. Report Creation Benchmark
    t0 = time.perf_counter()
    resp_rep = client.post(f"/api/v1/products/{prod.id}/reports")
    t_rep = time.perf_counter() - t0
    assert resp_rep.status_code == 201
    assert t_rep < 1.0, f"Report creation took {t_rep:.3f}s (> 1.0s limit)"

    print(f"\n[PERFORMANCE TIMINGS] List: {t_list*1000:.1f}ms | Validate: {t_val*1000:.1f}ms | Simulate: {t_sim*1000:.1f}ms | Report: {t_rep*1000:.1f}ms")
