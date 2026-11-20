"""
Manual Live Research Smoke Test Tool.

Takes ONE URL from the command line, runs the SSRF-hardened PageFetcher
and real Google Gemini inference, then prints extracted evidence
(verbatim excerpts, observed price, confidence).

SECURITY & COMPLIANCE:
- Refuses to run without LLM_API_KEY.
- Never runs in an automated loop.
- Does NOT store output as seed data.
- Masks any secret keys.
"""

from decimal import Decimal
import os
from pathlib import Path
import sys

# Ensure repository root is on sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app.core.config import Settings
from backend.app.services.ai_research_provider import (
    GEMINI_RESEARCH_SCHEMA,
    SYSTEM_INSTRUCTION,
    is_verbatim_in_text,
    verify_price_in_excerpt,
)
from backend.app.services.llm_client import LLMClient, LLMError
from backend.app.services.page_fetcher import PageFetcher, PageFetchError, SSRFError


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/live_research_smoke.py <URL>")
        sys.exit(1)

    url = sys.argv[1].strip()
    settings = Settings()

    if not settings.LLM_API_KEY or not settings.LLM_API_KEY.strip():
        print("ERROR: LLM_API_KEY is not configured in environment or .env. Refusing to run.")
        sys.exit(1)

    print(f"=== LaunchTwin Live Research Smoke Test ===")
    print(f"Target URL: {url}")
    print(f"Configured Model: {settings.LLM_MODEL}")

    # 1. Fetch page safely
    print("\n[1/3] Fetching page with SSRF-hardened PageFetcher...")
    fetcher = PageFetcher()
    try:
        page = fetcher.fetch(url)
        print(f"  HTTP Status: {page.status_code}")
        print(f"  Title: {page.title}")
        print(f"  Content Length: {page.content_length} bytes")
        print(f"  Extracted Text Length: {len(page.text)} characters")
    except (SSRFError, PageFetchError) as fe:
        print(f"Fetch failed: {fe}")
        sys.exit(1)

    # 2. Call Gemini
    print("\n[2/3] Calling Google Gemini for structured evidence extraction...")
    llm = LLMClient(api_key=settings.LLM_API_KEY, model=settings.LLM_MODEL)
    user_prompt = f"""Target Competitor Page: {page.title}
Page URL: {page.url}

<UNTRUSTED_WEBSITE_TEXT>
{page.text}
</UNTRUSTED_WEBSITE_TEXT>

Extract observed retail price, competitor claims, strengths, and weaknesses.
Comply strictly with the schema."""

    try:
        raw_response = llm.generate_json(
            prompt=user_prompt,
            schema=GEMINI_RESEARCH_SCHEMA,
            system_instruction=SYSTEM_INSTRUCTION,
        )
        print("  Gemini generation succeeded.")
    except LLMError as le:
        print(f"LLM extraction failed: {le}")
        sys.exit(1)

    # 3. Post-process & verify
    print("\n[3/3] Anti-Hallucination Post-Processing...")
    raw_price = raw_response.get("observed_price")
    price_excerpt = raw_response.get("price_excerpt") or ""

    verified_price = None
    if raw_price:
        try:
            p_dec = Decimal(str(raw_price))
            if is_verbatim_in_text(price_excerpt, page.text) and verify_price_in_excerpt(p_dec, price_excerpt):
                verified_price = p_dec
                print(f"  [ACCEPTED PRICE] Observed: {verified_price} | Excerpt: '{price_excerpt}'")
            else:
                print(f"  [DROPPED PRICE] {raw_price} rejected (not verbatim in text or missing from excerpt)")
        except Exception:
            print(f"  [DROPPED PRICE] Invalid decimal format: {raw_price}")
    else:
        print("  No observed price reported.")

    claims = raw_response.get("claims", [])
    print(f"\nExtracted Claims ({len(claims)} found):")
    for idx, c in enumerate(claims, 1):
        c_text = c.get("text", "")
        c_excerpt = c.get("excerpt", "")
        verbatim = is_verbatim_in_text(c_excerpt, page.text)
        status_tag = "VERIFIED" if verbatim else "HALLUCINATED (DROPPED)"
        conf = "0.75" if verbatim else "0.00"
        print(f"  {idx}. [{status_tag}] (Conf: {conf})")
        print(f"     Claim: {c_text}")
        print(f"     Excerpt: \"{c_excerpt}\"")

    strengths = raw_response.get("strengths", [])
    print(f"\nExtracted Strengths ({len(strengths)} found):")
    for idx, s in enumerate(strengths, 1):
        if isinstance(s, dict):
            s_text = s.get("text", "")
            s_excerpt = s.get("excerpt", "")
            verbatim = is_verbatim_in_text(s_excerpt, page.text)
            status_tag = "VERIFIED" if verbatim else "HALLUCINATED (DROPPED)"
            print(f"  {idx}. [{status_tag}] {s_text} | Excerpt: \"{s_excerpt}\"")
        else:
            print(f"  {idx}. {s}")

    weaknesses = raw_response.get("weaknesses", [])
    print(f"\nExtracted Weaknesses ({len(weaknesses)} found):")
    for idx, w in enumerate(weaknesses, 1):
        if isinstance(w, dict):
            w_text = w.get("text", "")
            w_excerpt = w.get("excerpt", "")
            verbatim = is_verbatim_in_text(w_excerpt, page.text)
            status_tag = "VERIFIED" if verbatim else "HALLUCINATED (DROPPED)"
            print(f"  {idx}. [{status_tag}] {w_text} | Excerpt: \"{w_excerpt}\"")
        else:
            print(f"  {idx}. {w}")

    print("\nSmoke test complete.")


if __name__ == "__main__":
    main()
