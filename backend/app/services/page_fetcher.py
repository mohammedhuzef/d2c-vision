"""
Anti-SSRF Page Fetcher Service.

Fetches real competitor web pages safely.
Enforces strict anti-SSRF protections, redirects tracking, byte limits,
and extracts clean visible text without JavaScript execution.

LIMITATION:
This fetcher does NOT execute client-side JavaScript (SPA / hydration).
Pages that require client-side JS rendering will only yield static HTML shell.
"""

from dataclasses import dataclass
import ipaddress
import re
import socket
from typing import List, Optional, Set, Tuple
import urllib.parse
from bs4 import BeautifulSoup
import httpx

from backend.app.core.config import settings


class SSRFError(ValueError):
    """Raised when a URL or resolved destination violates SSRF safety rules."""
    pass


class PageFetchError(Exception):
    """Raised when fetching or parsing a web page fails."""
    pass


@dataclass
class FetchedPage:
    url: str
    status_code: int
    title: str
    text: str
    content_type: str
    content_length: int


def _is_numeric_token(token: str) -> bool:
    """Check if token is decimal, hex (0x...), or octal."""
    t = token.strip().lower()
    if not t:
        return False
    if t.startswith("0x"):
        try:
            int(t, 16)
            return True
        except ValueError:
            return False
    if t.isdigit():
        return True
    return False


def check_host_spelling(hostname: str) -> None:
    """
    Detect non-standard IPv4 representations:
    - Pure decimal integers (e.g. 2130706433)
    - Hex representations (e.g. 0x7f000001)
    - Octal representations (e.g. 0177.0.0.1)
    - Short forms (e.g. 127.1, 10.1)
    """
    clean_host = hostname.strip().strip("[]").lower()
    if not clean_host:
        raise SSRFError("Empty hostname")

    # Pure integer or hex literal
    if clean_host.isdigit():
        raise SSRFError(f"Non-standard decimal IPv4 spelling rejected: {hostname}")
    if clean_host.startswith("0x"):
        raise SSRFError(f"Non-standard hex IPv4 spelling rejected: {hostname}")

    parts = clean_host.split(".")
    # If all parts look numeric, check for non-standard IPv4 spellings
    if len(parts) > 1 and all(_is_numeric_token(p) for p in parts):
        if len(parts) != 4:
            raise SSRFError(f"Non-standard short-form IPv4 rejected: {hostname}")
        for p in parts:
            if p.startswith("0x"):
                raise SSRFError(f"Hex component in IPv4 rejected: {hostname}")
            if len(p) > 1 and p.startswith("0") and p.isdigit():
                raise SSRFError(f"Octal component in IPv4 rejected: {hostname}")


def validate_ip_address(ip_str: str) -> None:
    """
    Inspects an IP address against forbidden ranges:
    - Loopback (127.0.0.0/8, ::1)
    - Private (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, fc00::/7)
    - Link-local (169.254.0.0/16 including 169.254.169.254, fe80::/10)
    - Unspecified (0.0.0.0, ::)
    - Multicast (224.0.0.0/4, ff00::/8)
    - Reserved (240.0.0.0/4)
    - IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
    """
    try:
        ip = ipaddress.ip_address(ip_str)
    except ValueError as exc:
        raise SSRFError(f"Invalid IP address representation '{ip_str}': {exc}")

    # If IPv4-mapped IPv6, validate the mapped IPv4 representation
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
        validate_ip_address(str(ip.ipv4_mapped))

    if ip.is_unspecified:
        raise SSRFError(f"SSRF blocked: Unspecified address '{ip_str}' is forbidden")

    if ip.is_loopback:
        raise SSRFError(f"SSRF blocked: Loopback address '{ip_str}' is forbidden")

    if ip.is_link_local:
        raise SSRFError(f"SSRF blocked: Link-local address '{ip_str}' is forbidden")

    if ip.is_multicast:
        raise SSRFError(f"SSRF blocked: Multicast address '{ip_str}' is forbidden")

    if ip.is_reserved:
        raise SSRFError(f"SSRF blocked: Reserved address '{ip_str}' is forbidden")

    if ip.is_private:
        raise SSRFError(f"SSRF blocked: Private address '{ip_str}' is forbidden")

    # Extra safeguards for IPv4 and IPv6
    if isinstance(ip, ipaddress.IPv4Address):
        if ip in ipaddress.ip_network("0.0.0.0/8") or ip in ipaddress.ip_network("127.0.0.0/8"):
            raise SSRFError(f"SSRF blocked: Zero or loopback network '{ip_str}'")
        if ip in ipaddress.ip_network("169.254.0.0/16"):
            raise SSRFError(f"SSRF blocked: Link-local cloud metadata '{ip_str}'")
    elif isinstance(ip, ipaddress.IPv6Address):
        if ip == ipaddress.IPv6Address("::1") or ip in ipaddress.ip_network("fc00::/7"):
            raise SSRFError(f"SSRF blocked: IPv6 loopback or unique-local '{ip_str}'")


def resolve_and_validate_target(url_str: str) -> Tuple[urllib.parse.ParseResult, List[str]]:
    """
    Parses URL, rejects credentials, checks non-standard IP spellings,
    resolves hostname via DNS, and verifies that EVERY resolved address is safe.
    """
    try:
        parsed = urllib.parse.urlsplit(url_str)
    except Exception as e:
        raise SSRFError(f"Malformed URL: {e}")

    if parsed.scheme.lower() not in ("http", "https"):
        raise SSRFError(f"Disallowed scheme '{parsed.scheme}'. Only http and https allowed.")

    if parsed.username or parsed.password or ("@" in (parsed.netloc or "")):
        raise SSRFError("URLs with credentials are not allowed")

    hostname = parsed.hostname
    if not hostname:
        raise SSRFError("URL is missing hostname")

    # Check for non-standard IPv4 spellings before resolution
    check_host_spelling(hostname)

    port = parsed.port or (443 if parsed.scheme.lower() == "https" else 80)

    # Check if host is already an explicit IP
    clean_host = hostname.strip("[]")
    is_raw_ip = False
    try:
        ipaddress.ip_address(clean_host)
        is_raw_ip = True
    except ValueError:
        is_raw_ip = False

    if is_raw_ip:
        validate_ip_address(clean_host)
        return parsed, [clean_host]

    # Resolve all addresses
    try:
        addr_infos = socket.getaddrinfo(hostname, port, type=socket.SOCK_STREAM)
    except socket.gaierror as e:
        raise PageFetchError(f"DNS resolution failed for '{hostname}': {e}")
    except Exception as e:
        raise PageFetchError(f"Socket resolution error for '{hostname}': {e}")

    if not addr_infos:
        raise PageFetchError(f"No IP addresses resolved for '{hostname}'")

    resolved_ips: List[str] = []
    for info in addr_infos:
        sockaddr = info[4]
        ip_str = sockaddr[0]
        # Inspect EVERY resolved address
        validate_ip_address(ip_str)
        if ip_str not in resolved_ips:
            resolved_ips.append(ip_str)

    return parsed, resolved_ips


def extract_visible_text(html_content: str, title_fallback: str = "") -> Tuple[str, str]:
    """
    Extract clean visible text and page title from HTML.
    Strips scripts, styles, noscript, svg, navigation, and hidden elements.
    """
    soup = BeautifulSoup(html_content, "html.parser")

    # Extract title
    title = title_fallback
    if soup.title and soup.title.string:
        title = soup.title.string.strip()

    # Remove non-content and hidden tags
    for tag in soup(["script", "style", "noscript", "svg", "header", "footer", "nav"]):
        tag.decompose()

    for hidden_tag in soup.find_all(attrs={"hidden": True}):
        hidden_tag.decompose()

    for style_hidden in soup.find_all(style=re.compile(r"display\s*:\s*none", re.IGNORECASE)):
        style_hidden.decompose()

    # Extract clean text
    text = soup.get_text(separator=" ", strip=True)
    # Collapse extra whitespace
    text = re.sub(r"\s+", " ", text).strip()

    return title, text


class PageFetcher:
    """
    SSRF-hardened HTTP page fetcher.
    Uses httpx to stream pages up to 1 MB with strict IP checking and manual redirect tracking.
    """

    def __init__(
        self,
        timeout_seconds: Optional[int] = None,
        max_page_bytes: Optional[int] = None,
        max_redirects: Optional[int] = None,
        user_agent: Optional[str] = None,
    ):
        self.timeout_seconds = timeout_seconds or settings.RESEARCH_FETCH_TIMEOUT_SECONDS
        self.max_page_bytes = max_page_bytes or settings.RESEARCH_MAX_PAGE_BYTES
        self.max_redirects = max_redirects or settings.RESEARCH_MAX_REDIRECTS
        self.user_agent = user_agent or settings.RESEARCH_USER_AGENT

    def fetch(self, initial_url: str) -> FetchedPage:
        """
        Fetches the web page at initial_url, validating each redirect hop against SSRF rules.
        """
        current_url = initial_url
        redirect_count = 0

        headers = {
            "User-Agent": self.user_agent,
            "Accept": "text/html, text/plain;q=0.9",
            "Accept-Encoding": "gzip, deflate",
        }

        # Do not allow automatic redirect following; inspect every hop manually
        client = httpx.Client(
            follow_redirects=False,
            timeout=self.timeout_seconds,
            cookies=None,
        )

        try:
            while True:
                # 1. SSRF & DNS inspection for current URL
                parsed, resolved_ips = resolve_and_validate_target(current_url)

                try:
                    with client.stream("GET", current_url, headers=headers) as response:
                        # 2. Check for redirect responses
                        if response.status_code in (301, 302, 303, 307, 308):
                            redirect_count += 1
                            if redirect_count > self.max_redirects:
                                raise PageFetchError(
                                    f"Too many redirects (exceeded maximum of {self.max_redirects})"
                                )

                            location = response.headers.get("Location")
                            if not location:
                                raise PageFetchError("Redirect response missing Location header")

                            # Resolve relative redirect URLs
                            current_url = urllib.parse.urljoin(current_url, location)
                            continue

                        # 3. Check status code
                        if response.status_code >= 400:
                            raise PageFetchError(f"HTTP request failed with status {response.status_code}")

                        # 4. Check Content-Type
                        content_type_raw = response.headers.get("content-type", "text/html")
                        mime_type = content_type_raw.split(";")[0].strip().lower()
                        if mime_type not in ("text/html", "text/plain"):
                            raise PageFetchError(
                                f"Disallowed content type '{mime_type}'. Only text/html and text/plain are supported."
                            )

                        # 5. Stream up to max_page_bytes (stop reading at the cap)
                        chunks: List[bytes] = []
                        total_bytes = 0
                        for chunk in response.iter_bytes(chunk_size=8192):
                            remaining = self.max_page_bytes - total_bytes
                            if remaining <= 0:
                                break
                            if len(chunk) > remaining:
                                chunks.append(chunk[:remaining])
                                total_bytes += remaining
                                break
                            chunks.append(chunk)
                            total_bytes += len(chunk)

                        raw_content = b"".join(chunks)

                        # Decode text
                        encoding = response.encoding or "utf-8"
                        try:
                            decoded_str = raw_content.decode(encoding, errors="replace")
                        except Exception:
                            decoded_str = raw_content.decode("utf-8", errors="replace")

                        # Extract visible text and title
                        if mime_type == "text/html":
                            title, visible_text = extract_visible_text(decoded_str, title_fallback=parsed.hostname or "")
                        else:
                            title = parsed.hostname or ""
                            visible_text = decoded_str.strip()

                        # Enforce max text length from settings
                        if len(visible_text) > settings.RESEARCH_MAX_TEXT_LENGTH:
                            visible_text = visible_text[: settings.RESEARCH_MAX_TEXT_LENGTH]

                        return FetchedPage(
                            url=current_url,
                            status_code=response.status_code,
                            title=title,
                            text=visible_text,
                            content_type=mime_type,
                            content_length=len(raw_content),
                        )

                except httpx.TimeoutException as e:
                    raise PageFetchError(f"Connection timed out after {self.timeout_seconds}s: {e}")
                except httpx.RequestError as e:
                    raise PageFetchError(f"HTTP network request error: {e}")

        finally:
            client.close()
