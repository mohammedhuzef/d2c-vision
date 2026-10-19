def test_cors_allowed_origin(client):
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "GET",
    }
    resp = client.options("/health", headers=headers)
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:5173"

    # Regular GET with allowed origin
    resp_get = client.get("/health", headers={"Origin": "http://localhost:5173"})
    assert resp_get.status_code == 200
    assert resp_get.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert "X-Request-ID" in resp_get.headers.get("access-control-expose-headers", "")


def test_cors_second_allowed_origin(client):
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
    }
    resp = client.options("/health", headers=headers)
    assert resp.status_code == 200
    assert resp.headers.get("access-control-allow-origin") == "http://localhost:3000"


def test_cors_unknown_origin_rejected(client):
    headers = {
        "Origin": "http://malicious.evil.com",
        "Access-Control-Request-Method": "GET",
    }
    resp = client.options("/health", headers=headers)
    # Preflight from disallowed origin should NOT include Access-Control-Allow-Origin
    assert resp.headers.get("access-control-allow-origin") is None

    resp_get = client.get("/health", headers={"Origin": "http://malicious.evil.com"})
    assert resp_get.status_code == 200
    assert resp_get.headers.get("access-control-allow-origin") is None
