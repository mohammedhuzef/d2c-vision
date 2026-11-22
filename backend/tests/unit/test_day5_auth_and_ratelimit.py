"""Unit tests for Day 5 Authentication and Rate Limiting Guards.

Verifies:
1. When AUTH_ENABLED=False (default), requests succeed without X-API-Key
2. When AUTH_ENABLED=True, missing X-API-Key returns 401
3. Wrong key returns 403
4. Correct key returns 200/201/202
5. Reads (GET) and /health stay open even when AUTH_ENABLED=True
6. Rate limiting triggers 429 when threshold exceeded
"""

import uuid
import pytest
from fastapi.testclient import TestClient

from backend.app.core.config import settings
from backend.app.core.auth_guard import reset_rate_limits
from backend.app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_auth_disabled_by_default(client):
    """When AUTH_ENABLED is False, mutating endpoints do not require X-API-Key."""
    settings.AUTH_ENABLED = False
    reset_rate_limits()

    # GET /health is open
    res = client.get("/health")
    assert res.status_code == 200

    # Create product
    p_res = client.post(
        "/api/v1/products",
        json={"name": "Day 5 Auth Test Product", "category": "Test"},
    )
    assert p_res.status_code == 201
    prod_id = p_res.json()["id"]

    # POST simulate without key is permitted by auth middleware
    sim_res = client.post(
        f"/api/v1/products/{prod_id}/validation/simulate",
        json={
            "assumptions": {
                "pricing": {"selling_price": "500.00"},
                "financial": {
                    "cogs": "150.00",
                    "packaging_cost": "30.00",
                    "shipping_cost": "40.00",
                    "fixed_costs": "50000.00",
                },
            }
        },
    )
    assert sim_res.status_code == 200


def test_auth_enabled_missing_key_returns_401(client):
    """When AUTH_ENABLED is True, missing X-API-Key on protected POST returns 401."""
    settings.AUTH_ENABLED = True
    settings.APP_API_KEY = "test-secret-key-123"
    reset_rate_limits()

    try:
        # GET stays open
        assert client.get("/health").status_code == 200

        fake_id = uuid.uuid4()
        # Protected POST without header returns 401
        res = client.post(
            f"/api/v1/products/{fake_id}/validation/simulate",
            json={"assumptions": {}},
        )
        assert res.status_code == 401
        data = res.json()
        assert data["error"]["code"] == "UNAUTHORIZED"
        assert "X-API-Key" in data["error"]["message"]
        assert "request_id" in data["error"]
    finally:
        settings.AUTH_ENABLED = False


def test_auth_enabled_invalid_key_returns_403(client):
    """When AUTH_ENABLED is True, incorrect X-API-Key returns 403."""
    settings.AUTH_ENABLED = True
    settings.APP_API_KEY = "correct-api-key-999"
    reset_rate_limits()

    try:
        fake_id = uuid.uuid4()
        res = client.post(
            f"/api/v1/products/{fake_id}/validation/simulate",
            json={"assumptions": {}},
            headers={"X-API-Key": "wrong-key-000"},
        )
        assert res.status_code == 403
        data = res.json()
        assert data["error"]["code"] == "FORBIDDEN"
        assert "Invalid API key" in data["error"]["message"]
    finally:
        settings.AUTH_ENABLED = False


def test_auth_enabled_correct_key_succeeds(client):
    """When AUTH_ENABLED is True, valid X-API-Key succeeds."""
    settings.AUTH_ENABLED = True
    settings.APP_API_KEY = "valid-secret-token-777"
    reset_rate_limits()

    try:
        p_res = client.post(
            "/api/v1/products",
            json={"name": "Day 5 Auth Test 2", "category": "Test"},
            headers={"X-API-Key": "valid-secret-token-777"},
        )
        assert p_res.status_code == 201
        prod_id = p_res.json()["id"]

        res = client.post(
            f"/api/v1/products/{prod_id}/validation/simulate",
            json={
                "assumptions": {
                    "pricing": {"selling_price": "500.00"},
                    "financial": {
                        "cogs": "150.00",
                        "packaging_cost": "30.00",
                        "shipping_cost": "40.00",
                        "fixed_costs": "50000.00",
                    },
                }
            },
            headers={"X-API-Key": "valid-secret-token-777"},
        )
        assert res.status_code == 200
    finally:
        settings.AUTH_ENABLED = False


def test_rate_limiting_enforcement(client):
    """Exceeding configured rate limit returns 429 in standard envelope."""
    settings.AUTH_ENABLED = False
    reset_rate_limits()
    original_limit = settings.RATE_LIMIT_VALIDATE_PER_MINUTE
    settings.RATE_LIMIT_VALIDATE_PER_MINUTE = 3  # Low limit for testing

    try:
        p_res = client.post(
            "/api/v1/products",
            json={"name": "Day 5 Rate Limit Test", "category": "Test"},
        )
        assert p_res.status_code == 201
        prod_id = p_res.json()["id"]

        url = f"/api/v1/products/{prod_id}/validation/simulate"
        payload = {
            "assumptions": {
                "pricing": {"selling_price": "500.00"},
                "financial": {
                    "cogs": "150.00",
                    "packaging_cost": "30.00",
                    "shipping_cost": "40.00",
                    "fixed_costs": "50000.00",
                },
            }
        }

        # 3 requests should pass
        for _ in range(3):
            r = client.post(url, json=payload)
            assert r.status_code == 200

        # 4th request must be rate limited
        blocked = client.post(url, json=payload)
        assert blocked.status_code == 429
        err = blocked.json()["error"]
        assert err["code"] == "RATE_LIMIT_EXCEEDED"
        assert "Rate limit" in err["message"]
    finally:
        settings.RATE_LIMIT_VALIDATE_PER_MINUTE = original_limit
        reset_rate_limits()
