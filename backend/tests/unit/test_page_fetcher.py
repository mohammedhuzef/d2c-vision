import httpx
import pytest

from backend.app.services.page_fetcher import (
    FetchResult,
    extract_clean_text_from_html,
    fetch_page,
    is_safe_ip,
    validate_url_safety,
)


# ==============================================================================
# 1. Fetcher Tests with Fake Transport
# ==============================================================================

def test_page_fetcher_normal_page_text_extracted():
    html_content = """
    <!DOCTYPE html>
    <html>
      <head><title>Product X</title></head>
      <body>
        <h1>Brand Alpha Flagship</h1>
        <p>This is the standard model with premium materials.</p>
        <p>Price: ₹ 1,499 with free delivery.</p>
      </body>
    </html>
    """

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/robots.txt":
            return httpx.Response(404)
        return httpx.Response(
            200,
            headers={"Content-Type": "text/html; charset=utf-8"},
            text=html_content,
        )

    # Fake DNS resolver that maps example.com to a public IP
    def fake_dns(host: str, port: int):
        return [(2, 1, 6, "", ("93.184.216.34", port))]

    transport = httpx.MockTransport(handler)
    res = fetch_page(
        "https://example.com/products/x",
        transport=transport,
        dns_resolver=fake_dns,
    )

    assert res.ok is True
    assert res.error_code is None
    assert "Brand Alpha Flagship" in res.text
    assert "Price: ₹ 1,499 with free delivery." in res.text
    assert res.final_url == "https://example.com/products/x"


def test_page_fetcher_script_style_nav_footer_stripped():
    html_content = """
    <html>
      <head>
        <style>body { background: #000; color: #fff; }</style>
        <script>function trackUser() { window.location = '/track'; }</script>
      </head>
      <body>
        <nav><a href="/home">Home</a> | <a href="/about">About</a></nav>
        <main>
          <h1>Actual Main Product</h1>
          <p>Important description text that should be kept.</p>
        </main>
        <footer>
          <p>Copyright 2026 Acme Corp. All rights reserved.</p>
        </footer>
      </body>
    </html>
    """

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/robots.txt":
            return httpx.Response(404)
        return httpx.Response(
            200,
            headers={"Content-Type": "text/html"},
            text=html_content,
        )

    def fake_dns(host: str, port: int):
        return [(2, 1, 6, "", ("93.184.216.34", port))]

    transport = httpx.MockTransport(handler)
    res = fetch_page(
        "https://example.com/item",
        transport=transport,
        dns_resolver=fake_dns,
    )

    assert res.ok is True
    assert "Actual Main Product" in res.text
    assert "Important description text that should be kept." in res.text

    # Verify stripped elements
    assert "background: #000" not in res.text
    assert "trackUser" not in res.text
    assert "Home | About" not in res.text
    assert "Copyright 2026 Acme Corp" not in res.text


def test_page_fetcher_oversize_body_rejected():
    # 1.2 MB of data (exceeds 1 MB cap)
    large_html = "<html><body>" + ("A" * 1_200_000) + "</body></html>"

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/robots.txt":
            return httpx.Response(404)
        return httpx.Response(
            200,
            headers={"Content-Type": "text/html", "Content-Length": str(len(large_html))},
            text=large_html,
        )

    def fake_dns(host: str, port: int):
        return [(2, 1, 6, "", ("93.184.216.34", port))]

    transport = httpx.MockTransport(handler)
    res = fetch_page(
        "https://example.com/large",
        transport=transport,
        dns_resolver=fake_dns,
    )

    assert res.ok is False
    assert res.error_code == "BODY_TOO_LARGE"
    assert res.text == ""


def test_page_fetcher_wrong_content_type_rejected():
    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/robots.txt":
            return httpx.Response(404)
        return httpx.Response(
            200,
            headers={"Content-Type": "application/pdf"},
            content=b"%PDF-1.4 ...",
        )

    def fake_dns(host: str, port: int):
        return [(2, 1, 6, "", ("93.184.216.34", port))]

    transport = httpx.MockTransport(handler)
    res = fetch_page(
        "https://example.com/spec.pdf",
        transport=transport,
        dns_resolver=fake_dns,
    )

    assert res.ok is False
    assert res.error_code == "UNSUPPORTED_CONTENT_TYPE"
    assert res.text == ""


def test_page_fetcher_robots_txt_disallow_respected():
    calls = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(str(request.url))
        if request.url.path == "/robots.txt":
            return httpx.Response(
                200,
                headers={"Content-Type": "text/plain"},
                text="User-agent: *\nDisallow: /secret/\n",
            )
        return httpx.Response(200, headers={"Content-Type": "text/html"}, text="<p>Secret page</p>")

    def fake_dns(host: str, port: int):
        return [(2, 1, 6, "", ("93.184.216.34", port))]

    transport = httpx.MockTransport(handler)
    res = fetch_page(
        "https://example.com/secret/item",
        transport=transport,
        dns_resolver=fake_dns,
    )

    assert res.ok is False
    assert res.error_code == "ROBOTS_DISALLOWED"
    # Ensure robots.txt was fetched, but /secret/item was never fetched
    assert any("/robots.txt" in c for c in calls)
    assert not any("/secret/item" in c for c in calls)


# ==============================================================================
# 2. SSRF Tests: No Request Made to Private / Reserved Addresses
# ==============================================================================

def test_ssrf_reject_localhost():
    calls = []
    transport = httpx.MockTransport(lambda req: calls.append(req) or httpx.Response(200))
    res = fetch_page("http://localhost", transport=transport)
    assert res.ok is False
    assert res.error_code == "SSRF_BLOCKED"
    assert len(calls) == 0


def test_ssrf_reject_127_0_0_1():
    calls = []
    transport = httpx.MockTransport(lambda req: calls.append(req) or httpx.Response(200))
    res = fetch_page("http://127.0.0.1", transport=transport)
    assert res.ok is False
    assert res.error_code == "SSRF_BLOCKED"
    assert len(calls) == 0


def test_ssrf_reject_10_0_0_5():
    calls = []
    transport = httpx.MockTransport(lambda req: calls.append(req) or httpx.Response(200))
    res = fetch_page("http://10.0.0.5", transport=transport)
    assert res.ok is False
    assert res.error_code == "SSRF_BLOCKED"
    assert len(calls) == 0


def test_ssrf_reject_192_168_1_1():
    calls = []
    transport = httpx.MockTransport(lambda req: calls.append(req) or httpx.Response(200))
    res = fetch_page("http://192.168.1.1", transport=transport)
    assert res.ok is False
    assert res.error_code == "SSRF_BLOCKED"
    assert len(calls) == 0


def test_ssrf_reject_169_254_169_254():
    calls = []
    transport = httpx.MockTransport(lambda req: calls.append(req) or httpx.Response(200))
    res = fetch_page("http://169.254.169.254", transport=transport)
    assert res.ok is False
    assert res.error_code == "SSRF_BLOCKED"
    assert len(calls) == 0


def test_ssrf_reject_ipv6_bracket_loopback():
    calls = []
    transport = httpx.MockTransport(lambda req: calls.append(req) or httpx.Response(200))
    res = fetch_page("http://[::1]", transport=transport)
    assert res.ok is False
    assert res.error_code == "SSRF_BLOCKED"
    assert len(calls) == 0


def test_ssrf_reject_file_scheme():
    calls = []
    transport = httpx.MockTransport(lambda req: calls.append(req) or httpx.Response(200))
    res = fetch_page("file:///etc/passwd", transport=transport)
    assert res.ok is False
    assert res.error_code == "INVALID_SCHEME"
    assert len(calls) == 0


def test_ssrf_reject_ftp_scheme():
    calls = []
    transport = httpx.MockTransport(lambda req: calls.append(req) or httpx.Response(200))
    res = fetch_page("ftp://ftp.example.com", transport=transport)
    assert res.ok is False
    assert res.error_code == "INVALID_SCHEME"
    assert len(calls) == 0


def test_ssrf_reject_url_with_credentials():
    calls = []
    transport = httpx.MockTransport(lambda req: calls.append(req) or httpx.Response(200))
    res = fetch_page("http://user:password@example.com", transport=transport)
    assert res.ok is False
    assert res.error_code == "CREDENTIALS_NOT_ALLOWED"
    assert len(calls) == 0


def test_ssrf_reject_hostname_resolving_to_private_ip():
    calls = []
    transport = httpx.MockTransport(lambda req: calls.append(req) or httpx.Response(200))

    # Hostname looks public, but DNS resolves to 10.0.0.5 (private RFC 1918)
    def private_dns(host: str, port: int):
        return [(2, 1, 6, "", ("10.0.0.5", port))]

    res = fetch_page(
        "https://internal-portal.example.com",
        transport=transport,
        dns_resolver=private_dns,
    )
    assert res.ok is False
    assert res.error_code == "SSRF_BLOCKED"
    assert len(calls) == 0


def test_ssrf_reject_redirect_to_private_ip():
    calls = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(str(request.url))
        if request.url.path == "/robots.txt":
            return httpx.Response(404)
        if request.url.path == "/start":
            # Redirects to local loopback
            return httpx.Response(
                302,
                headers={"Location": "http://127.0.0.1/admin"},
            )
        return httpx.Response(200, text="Admin private area")

    def initial_dns(host: str, port: int):
        return [(2, 1, 6, "", ("93.184.216.34", port))]

    transport = httpx.MockTransport(handler)
    res = fetch_page(
        "https://public.example.com/start",
        transport=transport,
        dns_resolver=initial_dns,
    )

    assert res.ok is False
    assert res.error_code == "SSRF_BLOCKED"
    # Ensure NO request was ever sent to 127.0.0.1
    assert not any("127.0.0.1" in c for c in calls)


def test_ssrf_reject_ipv6_mapped_ipv4():
    calls = []
    transport = httpx.MockTransport(lambda req: calls.append(req) or httpx.Response(200))
    res = fetch_page("http://[::ffff:127.0.0.1]", transport=transport)
    assert res.ok is False
    assert res.error_code == "SSRF_BLOCKED"
    assert len(calls) == 0


def test_ssrf_reject_decimal_ip():
    calls = []
    transport = httpx.MockTransport(lambda req: calls.append(req) or httpx.Response(200))
    res = fetch_page("http://2130706433", transport=transport)  # 2130706433 == 127.0.0.1
    assert res.ok is False
    assert res.error_code == "SSRF_BLOCKED"
    assert len(calls) == 0


def test_ssrf_reject_hex_ip():
    calls = []
    transport = httpx.MockTransport(lambda req: calls.append(req) or httpx.Response(200))
    res = fetch_page("http://0x7f000001", transport=transport)  # 0x7f000001 == 127.0.0.1
    assert res.ok is False
    assert res.error_code == "SSRF_BLOCKED"
    assert len(calls) == 0


def test_ssrf_reject_multi_hop_redirect_to_private_ip():
    calls = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(str(request.url))
        if request.url.path == "/robots.txt":
            return httpx.Response(404)
        if request.url.path == "/hop1":
            return httpx.Response(302, headers={"Location": "https://public.example.com/hop2"})
        if request.url.path == "/hop2":
            return httpx.Response(302, headers={"Location": "http://169.254.169.254/latest/meta-data/"})
        return httpx.Response(200, text="Metadata content")

    def public_dns(host: str, port: int):
        return [(2, 1, 6, "", ("93.184.216.34", port))]

    transport = httpx.MockTransport(handler)
    res = fetch_page(
        "https://public.example.com/hop1",
        transport=transport,
        dns_resolver=public_dns,
    )

    assert res.ok is False
    assert res.error_code == "SSRF_BLOCKED"
    # Hop 1 and Hop 2 requested, but metadata endpoint NEVER requested
    assert not any("169.254.169.254" in c for c in calls)

