def test_404_error_format(client):
    response = client.get("/api/v1/nonexistent-route-for-testing-123")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    error = data["error"]
    assert "code" in error
    assert "message" in error
    assert "details" in error
    assert "request_id" in error
    assert error["code"] == "NOT_FOUND"
    assert isinstance(error["details"], list)
    assert len(error["request_id"]) > 0
    # Ensure no stack trace in response
    assert "traceback" not in data
    assert "stack" not in data

