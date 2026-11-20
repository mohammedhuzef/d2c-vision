"""
Unit tests for SSRF-hardened PageFetcher.
Hermetic only: mocks all socket and HTTP calls; zero real network traffic.
"""

import io
from unittest.mock import MagicMock, patch
import pytest

from backend.app.services.page_fetcher import (
    PageFetcher,
    PageFetchError,
    SSRFError,
    check_host_spelling,
    extract_visible_text,
    resolve_and_validate_target,
    validate_ip_address,
)


def test_ip_validation_blocks_forbidden_ranges():
    # Loopback
    with pytest.raises(SSRFError, match="Loopback"):
        validate_ip_address("127.0.0.1")
    with pytest.raises(SSRFError, match="Loopback"):
        validate_ip_address("127.0.1.1")

    # Private
    with pytest.raises(SSRFError, match="Private"):
        validate_ip_address("10.0.0.1")
    with pytest.raises(SSRFError, match="Private"):
        validate_ip_address("172.16.0.1")
    with pytest.raises(SSRFError, match="Private"):
        validate_ip_address("192.168.1.1")

    # Link-local / metadata
    with pytest.raises(SSRFError, match="Link-local"):
        validate_ip_address("169.254.169.254")

    # Unspecified
    with pytest.raises(SSRFError, match="Unspecified"):
        validate_ip_address("0.0.0.0")

    # IPv6 loopback and unique-local
    with pytest.raises(SSRFError):
        validate_ip_address("::1")
    with pytest.raises(SSRFError):
        validate_ip_address("fc00::1")
    with pytest.raises(SSRFError):
        validate_ip_address("fd12:3456:789a::1")

    # IPv4-mapped IPv6
    with pytest.raises(SSRFError, match="Loopback"):
        validate_ip_address("::ffff:127.0.0.1")
    with pytest.raises(SSRFError, match="Private"):
        validate_ip_address("::ffff:10.0.0.1")


def test_non_standard_ipv4_spellings_blocked():
    with pytest.raises(SSRFError, match="decimal"):
        check_host_spelling("2130706433")

    with pytest.raises(SSRFError, match="hex"):
        check_host_spelling("0x7f000001")

    with pytest.raises(SSRFError, match="Octal"):
        check_host_spelling("0177.0.0.1")

    with pytest.raises(SSRFError, match="short-form"):
        check_host_spelling("127.1")

    with pytest.raises(SSRFError, match="short-form"):
        check_host_spelling("10.1")


def test_url_credentials_and_schemes_blocked():
    with pytest.raises(SSRFError, match="credentials"):
        resolve_and_validate_target("http://user:pass@example.com/page")

    with pytest.raises(SSRFError, match="credentials"):
        resolve_and_validate_target("http://admin@example.com/page")

    with pytest.raises(SSRFError, match="Disallowed scheme"):
        resolve_and_validate_target("ftp://example.com/resource")

    with pytest.raises(SSRFError, match="Disallowed scheme"):
        resolve_and_validate_target("file:///etc/passwd")


@patch("socket.getaddrinfo")
def test_dns_resolution_to_private_ip_blocked(mock_getaddrinfo):
    mock_getaddrinfo.return_value = [
        (2, 1, 6, "", ("127.0.0.1", 80)),
    ]
    with pytest.raises(SSRFError, match="Loopback"):
        resolve_and_validate_target("http://legit-looking-domain.com")


@patch("socket.getaddrinfo")
def test_dns_resolution_mixed_ips_blocked_if_any_is_private(mock_getaddrinfo):
    # If DNS returns multiple IPs and one is private, the entire request must fail
    mock_getaddrinfo.return_value = [
        (2, 1, 6, "", ("93.184.216.34", 80)),
        (2, 1, 6, "", ("10.0.0.2", 80)),
    ]
    with pytest.raises(SSRFError, match="Private"):
        resolve_and_validate_target("http://dual-homed-attack.com")


class FakeStreamResponse:
    def __init__(self, status_code=200, headers=None, body_chunks=None, encoding="utf-8"):
        self.status_code = status_code
        self.headers = headers or {"content-type": "text/html; charset=utf-8"}
        self.body_chunks = body_chunks or [b"<html><head><title>Test</title></head><body>Hello world</body></html>"]
        self.encoding = encoding

    def iter_bytes(self, chunk_size=8192):
        for chunk in self.body_chunks:
            yield chunk

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass


@patch("socket.getaddrinfo")
@patch("httpx.Client.stream")
def test_page_fetcher_redirect_to_private_ip_blocked(mock_stream, mock_getaddrinfo):
    # Hop 1: public IP -> returns 302 redirect to http://192.168.1.100
    # Hop 2: target is 192.168.1.100 -> must be rejected by SSRF check!
    mock_getaddrinfo.return_value = [(2, 1, 6, "", ("93.184.216.34", 80))]

    redirect_resp = FakeStreamResponse(
        status_code=302,
        headers={"Location": "http://192.168.1.100/admin"},
        body_chunks=[]
    )
    mock_stream.return_value = redirect_resp

    fetcher = PageFetcher()
    with pytest.raises(SSRFError, match="Private address"):
        fetcher.fetch("http://example.com/initial")


@patch("socket.getaddrinfo")
@patch("httpx.Client.stream")
def test_page_fetcher_too_many_redirects(mock_stream, mock_getaddrinfo):
    mock_getaddrinfo.return_value = [(2, 1, 6, "", ("93.184.216.34", 80))]

    # Infinite redirects
    mock_stream.return_value = FakeStreamResponse(
        status_code=301,
        headers={"Location": "http://example.com/next"},
        body_chunks=[]
    )

    fetcher = PageFetcher(max_redirects=3)
    with pytest.raises(PageFetchError, match="Too many redirects"):
        fetcher.fetch("http://example.com/start")


@patch("socket.getaddrinfo")
@patch("httpx.Client.stream")
def test_page_fetcher_disallowed_content_type(mock_stream, mock_getaddrinfo):
    mock_getaddrinfo.return_value = [(2, 1, 6, "", ("93.184.216.34", 80))]

    mock_stream.return_value = FakeStreamResponse(
        status_code=200,
        headers={"content-type": "application/pdf"},
        body_chunks=[b"%PDF-1.4 ..."]
    )

    fetcher = PageFetcher()
    with pytest.raises(PageFetchError, match="Disallowed content type 'application/pdf'"):
        fetcher.fetch("http://example.com/document.pdf")


@patch("socket.getaddrinfo")
@patch("httpx.Client.stream")
def test_page_fetcher_oversized_body_capped(mock_stream, mock_getaddrinfo):
    mock_getaddrinfo.return_value = [(2, 1, 6, "", ("93.184.216.34", 80))]

    # Provide 1.5 MB of chunks
    chunk_1mb = b"A" * 1048576
    chunk_extra = b"B" * 500000
    mock_stream.return_value = FakeStreamResponse(
        status_code=200,
        headers={"content-type": "text/plain"},
        body_chunks=[chunk_1mb, chunk_extra]
    )

    fetcher = PageFetcher(max_page_bytes=1048576)
    result = fetcher.fetch("http://example.com/large")
    assert result.content_length == 1048576
    assert len(result.text) <= 50000  # Capped by text length


@patch("socket.getaddrinfo")
@patch("httpx.Client.stream")
def test_page_fetcher_timeout(mock_stream, mock_getaddrinfo):
    import httpx
    mock_getaddrinfo.return_value = [(2, 1, 6, "", ("93.184.216.34", 80))]
    mock_stream.side_effect = httpx.TimeoutException("Read timed out")

    fetcher = PageFetcher()
    with pytest.raises(PageFetchError, match="Connection timed out"):
        fetcher.fetch("http://example.com/slow")


def test_extract_visible_text_strips_scripts_and_hidden():
    html = """
    <html>
      <head>
        <title>Competitor Brand - Premium Serum</title>
        <script>var secret = 'do not show';</script>
        <style>.hide { display: none; }</style>
      </head>
      <body>
        <nav><a href="/">Home</a><a href="/shop">Shop</a></nav>
        <header>Header Banner</header>
        <div class="product">
          <h1>Hydra Glow Serum</h1>
          <p class="price">Observed Price: $45.00</p>
          <p>Contains 10% pure hyaluronic acid.</p>
          <div hidden>Hidden discount code SAVE50</div>
          <div style="display: none;">Invisible marketing tracking tag</div>
        </div>
        <footer>Copyright 2026</footer>
      </body>
    </html>
    """
    title, text = extract_visible_text(html)
    assert title == "Competitor Brand - Premium Serum"
    assert "Hydra Glow Serum" in text
    assert "$45.00" in text
    assert "hyaluronic acid" in text
    # Verify stripped elements
    assert "secret" not in text
    assert "display: none" not in text
    assert "Hidden discount code" not in text
    assert "Invisible marketing" not in text
    assert "Header Banner" not in text
    assert "Copyright 2026" not in text
