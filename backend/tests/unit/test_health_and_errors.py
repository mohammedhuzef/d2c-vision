import uuid
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.errors import AppError, NotFoundError, ConflictError, BadStateError, ValidationError

client = TestClient(app, raise_server_exceptions=False)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "database" in data
    assert "version" in data
    assert "X-Request-ID" in response.headers


def test_request_id_header_propagation():
    custom_id = "test-request-id-12345"
    response = client.get("/health", headers={"X-Request-ID": custom_id})
    assert response.status_code == 200
    assert response.headers.get("X-Request-ID") == custom_id


def test_request_id_generation():
    response = client.get("/health")
    req_id = response.headers.get("X-Request-ID")
    assert req_id is not None
    # Validate UUID
    parsed = uuid.UUID(req_id)
    assert str(parsed) == req_id


def test_404_error_format():
    response = client.get("/non-existent-endpoint-xyz")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    err = data["error"]
    assert err["code"] == "NOT_FOUND"
    assert "message" in err
    assert "request_id" in err


def test_app_error_format():
    # Dynamically mount a temporary route to test custom AppErrors
    @app.get("/test-custom-error")
    def trigger_error(err_type: str):
        if err_type == "conflict":
            raise ConflictError("Competitor already exists", details=[{"field": "name", "issue": "duplicate"}])
        elif err_type == "bad_state":
            raise BadStateError("Validation must be run before generating reports")
        elif err_type == "validation":
            raise ValidationError("Invalid input", details=[{"field": "assumptions.pricing.selling_price", "issue": "must be > 0"}])
        raise RuntimeError("Crash unexpected")

    resp_conflict = client.get("/test-custom-error?err_type=conflict")
    assert resp_conflict.status_code == 409
    err = resp_conflict.json()["error"]
    assert err["code"] == "CONFLICT"
    assert err["details"] == [{"field": "name", "issue": "duplicate"}]

    resp_state = client.get("/test-custom-error?err_type=bad_state")
    assert resp_state.status_code == 409
    err = resp_state.json()["error"]
    assert err["code"] == "BAD_STATE"
    assert "Validation must be run" in err["message"]

    resp_val = client.get("/test-custom-error?err_type=validation")
    assert resp_val.status_code == 422
    err = resp_val.json()["error"]
    assert err["code"] == "VALIDATION_ERROR"
    assert err["details"][0]["field"] == "assumptions.pricing.selling_price"

    resp_crash = client.get("/test-custom-error?err_type=crash")
    assert resp_crash.status_code == 500
    err = resp_crash.json()["error"]
    assert err["code"] == "INTERNAL"
    assert "Traceback" not in resp_crash.text
