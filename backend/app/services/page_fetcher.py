import html
from html.parser import HTMLParser
import ipaddress
import logging
import re
import socket
from dataclasses import dataclass
from typing import Callable, Dict, List, Optional, Tuple, Union
import urllib.parse
import urllib.robotparser
import httpx

from backend.app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class FetchResult:
    ok: bool
    text: str
    final_url: Optional[str] = None
    error_code: Optional[str] = None


class HTMLTextExtractor(HTMLParser):
    """HTML parser that discards script, style, nav, footer, noscript, and svg tags."""

    IGNORABLE_TAGS = {"script", "style", "nav", "footer", "noscript", "svg", "head"}
    BLOCK_TAGS = {
        "p", "div", "h1", "h2", "h3", "h4", "h5", "h6",
        "li", "ul", "ol", "tr", "section", "article", "header", "br", "table"
    }

    def __init__(self):
        super().__init__()
        self.ignore_depth = 0
        self.chunks: List[str] = []

    def handle_starttag(self, tag: str, attrs: list):
        tag_lower = tag.lower()
        if tag_lower in self.IGNORABLE_TAGS:
            self.ignore_depth += 1
        elif tag_lower in self.BLOCK_TAGS:
            self.chunks.append(" ")

    def handle_endtag(self, tag: str):
        tag_lower = tag.lower()
        if tag_lower in self.IGNORABLE_TAGS:
            if self.ignore_depth > 0:
                self.ignore_depth -= 1
        elif tag_lower in self.BLOCK_TAGS:
            self.chunks.append(" ")

    def handle_data(self, data: str):
        if self.ignore_depth == 0:
            self.chunks.append(data)


def extract_clean_text_from_html(html_content: str) -> str:
    """Strips script, style, nav, footer, unescapes entities, and collapses whitespace."""
    parser = HTMLTextExtractor()
    try:
        parser.feed(html_content)
        raw_text = " ".join(parser.chunks)
    except Exception:
        # Fallback regex strip if HTML parsing errors
        clean = re.sub(r"<(script|style|nav|footer|noscript|svg)[^>]*>.*?</\1>", " ", html_content, flags=re.DOTALL | re.IGNORECASE)
        clean = re.sub(r"<[^>]+>", " ", clean)
        raw_text = clean

    unescaped = html.unescape(raw_text)
    collapsed = re.sub(r"\s+", " ", unescaped).strip()
    return collapsed


def is_safe_ip(ip: Union[ipaddress.IPv4Address, ipaddress.IPv6Address]) -> bool:
    """Verifies that an IP address is not loopback, private, link-local, multicast, or reserved."""
    if ip.is_loopback:
        return False
    if ip.is_private:
        return False
    if ip.is_link_local:
        return False
    if ip.is_multicast:
        return False
    if ip.is_reserved:
        return False
    if ip.is_unspecified:
        return False
    if str(ip) == "169.254.169.254":
        return False
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
        return is_safe_ip(ip.ipv4_mapped)
    return True


DNSResolver = Callable[[str, int], List[Tuple[int, int, int, str, tuple]]]


def default_dns_resolver(host: str, port: int) -> List[Tuple[int, int, int, str, tuple]]:
    return socket.getaddrinfo(host, port, family=socket.AF_UNSPEC, type=socket.SOCK_STREAM)


def validate_url_safety(
    url: str,
    dns_resolver: Optional[DNSResolver] = None,
) -> Tuple[bool, Optional[str]]:
    """
    Validates scheme (http/https only), rejects credentials,
    and resolves hostnames to reject loopback, private, link-local, multicast,
    and reserved IPs without sending requests.
    """
    try:
        parsed = urllib.parse.urlsplit(url)
    except Exception:
        return False, "INVALID_URL"

    scheme = (parsed.scheme or "").lower()
    if scheme not in ("http", "https"):
        return False, "INVALID_SCHEME"

    if parsed.username or parsed.password:
        return False, "CREDENTIALS_NOT_ALLOWED"

    raw_host = parsed.hostname
    if not raw_host:
        return False, "INVALID_URL"

    host = raw_host.strip("[]").lower()
    if host in ("localhost", "localhost.localdomain") or host.endswith(".localhost"):
        return False, "SSRF_BLOCKED"

    # Check if host is an explicit IP literal (standard, integer, or hex representation)
    try:
        ip = ipaddress.ip_address(host)
        if not is_safe_ip(ip):
            return False, "SSRF_BLOCKED"
        return True, None
    except ValueError:
        pass

    try:
        if host.isdigit():
            int_val = int(host)
            if 0 <= int_val <= 0xFFFFFFFF:
                ip_from_int = ipaddress.IPv4Address(int_val)
                if not is_safe_ip(ip_from_int):
                    return False, "SSRF_BLOCKED"
        elif host.startswith("0x") or host.startswith("0X"):
            int_val = int(host, 16)
            if 0 <= int_val <= 0xFFFFFFFF:
                ip_from_int = ipaddress.IPv4Address(int_val)
                if not is_safe_ip(ip_from_int):
                    return False, "SSRF_BLOCKED"
    except Exception:
        pass

    # Resolve hostname to check IPs
    resolver = dns_resolver or default_dns_resolver
    port = parsed.port or (443 if scheme == "https" else 80)
    try:
        addr_info = resolver(host, port)
        if not addr_info:
            return False, "DNS_RESOLUTION_FAILED"
        for item in addr_info:
            sockaddr = item[4]
            ip_str = sockaddr[0]
            ip_obj = ipaddress.ip_address(ip_str)
            if not is_safe_ip(ip_obj):
                return False, "SSRF_BLOCKED"
    except socket.gaierror:
        return False, "DNS_RESOLUTION_FAILED"
    except Exception as exc:
        logger.warning(f"Error during DNS resolution of {host}: {exc}")
        return False, "SSRF_BLOCKED"

    return True, None


def fetch_page(
    url: str,
    timeout_seconds: Optional[int] = None,
    max_bytes: Optional[int] = None,
    max_text_length: Optional[int] = None,
    max_redirects: Optional[int] = None,
    user_agent: Optional[str] = None,
    transport: Optional[httpx.BaseTransport] = None,
    dns_resolver: Optional[DNSResolver] = None,
) -> FetchResult:
    """
    Safely fetches a web page, enforcing SSRF protections, redirect limits,
    content-type filtering, robots.txt compliance, and HTML sanitization.
    Never raises an exception.
    """
    timeout = timeout_seconds or settings.RESEARCH_FETCH_TIMEOUT_SECONDS
    limit_bytes = max_bytes or settings.RESEARCH_MAX_PAGE_BYTES
    limit_text = max_text_length or settings.RESEARCH_MAX_TEXT_LENGTH
    redirect_limit = max_redirects or settings.RESEARCH_MAX_REDIRECTS
    ua = user_agent or settings.RESEARCH_USER_AGENT

    headers = {
        "User-Agent": ua,
        "Accept": "text/html,text/plain;q=0.9,*/*;q=0.1",
    }

    current_url = url
    robots_cache: Dict[str, Optional[urllib.robotparser.RobotFileParser]] = {}

    try:
        with httpx.Client(
            timeout=timeout,
            transport=transport,
            follow_redirects=False,
        ) as client:
            for hop in range(redirect_limit + 1):
                # 1. SSRF and URL validation before any request
                is_safe, err_code = validate_url_safety(current_url, dns_resolver=dns_resolver)
                if not is_safe:
                    return FetchResult(ok=False, text="", final_url=current_url, error_code=err_code)

                # 2. Robots.txt check per host
                parsed_cur = urllib.parse.urlsplit(current_url)
                origin = f"{parsed_cur.scheme}://{parsed_cur.netloc}"
                if origin not in robots_cache:
                    robots_url = f"{origin}/robots.txt"
                    rp = None
                    try:
                        robots_resp = client.get(robots_url, headers=headers)
                        if robots_resp.status_code == 200:
                            rp = urllib.robotparser.RobotFileParser()
                            rp.parse(robots_resp.text.splitlines())
                    except Exception:
                        rp = None
                    robots_cache[origin] = rp

                rp = robots_cache.get(origin)
                if rp is not None:
                    try:
                        if not rp.can_fetch(ua, current_url):
                            return FetchResult(
                                ok=False,
                                text="",
                                final_url=current_url,
                                error_code="ROBOTS_DISALLOWED",
                            )
                    except Exception:
                        pass

                # 3. Request page
                try:
                    resp = client.get(current_url, headers=headers)
                except httpx.TimeoutException:
                    return FetchResult(ok=False, text="", final_url=current_url, error_code="TIMEOUT")
                except httpx.RequestError as exc:
                    return FetchResult(ok=False, text="", final_url=current_url, error_code="NETWORK_ERROR")

                # 4. Handle Redirects manually to validate target IP on each hop
                if resp.status_code in (301, 302, 303, 307, 308):
                    if hop >= redirect_limit:
                        return FetchResult(
                            ok=False,
                            text="",
                            final_url=current_url,
                            error_code="TOO_MANY_REDIRECTS",
                        )
                    location = resp.headers.get("Location")
                    if not location:
                        return FetchResult(
                            ok=False,
                            text="",
                            final_url=current_url,
                            error_code="INVALID_REDIRECT",
                        )
                    current_url = urllib.parse.urljoin(current_url, location)
                    continue

                # 5. Check response status code
                if resp.status_code != 200:
                    return FetchResult(
                        ok=False,
                        text="",
                        final_url=current_url,
                        error_code=f"HTTP_{resp.status_code}",
                    )

                # 6. Verify Content-Type
                ct_hdr = resp.headers.get("content-type", "").lower()
                media_type = ct_hdr.split(";")[0].strip()
                if media_type not in ("text/html", "text/plain"):
                    return FetchResult(
                        ok=False,
                        text="",
                        final_url=current_url,
                        error_code="UNSUPPORTED_CONTENT_TYPE",
                    )

                # 7. Verify body size
                cl_hdr = resp.headers.get("content-length")
                if cl_hdr and cl_hdr.isdigit() and int(cl_hdr) > limit_bytes:
                    return FetchResult(
                        ok=False,
                        text="",
                        final_url=current_url,
                        error_code="BODY_TOO_LARGE",
                    )

                raw_bytes = resp.content
                if len(raw_bytes) > limit_bytes:
                    return FetchResult(
                        ok=False,
                        text="",
                        final_url=current_url,
                        error_code="BODY_TOO_LARGE",
                    )

                # 8. Extract text
                if media_type == "text/plain":
                    text = re.sub(r"\s+", " ", resp.text).strip()
                else:
                    text = extract_clean_text_from_html(resp.text)

                if len(text) > limit_text:
                    text = text[:limit_text]

                return FetchResult(ok=True, text=text, final_url=current_url, error_code=None)

            return FetchResult(
                ok=False,
                text="",
                final_url=current_url,
                error_code="TOO_MANY_REDIRECTS",
            )
    except Exception as exc:
        logger.error(f"Unexpected error fetching {url}: {exc}")
        return FetchResult(ok=False, text="", final_url=url, error_code="FETCH_ERROR")
