import hashlib
import json
import logging
import re
import sys
import urllib.parse
from decimal import Decimal
from pathlib import Path
from uuid import uuid4

# Ensure project root is in sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(root_dir / "backend"))

from backend.app.core.config import settings
from backend.app.services.ai_research_provider import (
    AIResearchProvider,
    _get_registrable_domain,
    _parse_and_verify_price,
)
from backend.app.services.page_fetcher import fetch_page
from backend.app.services.research_provider import CompetitorSummary, ProductSummary


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/try_ai_research.py <url>")
        sys.exit(1)

    target_url = sys.argv[1].strip()

    if not settings.LLM_API_KEY:
        print("ERROR: LLM_API_KEY is not configured in environment or .env file.")
        print("Please set LLM_API_KEY=<your_api_key> to test real AI research extraction.")
        sys.exit(1)

    print(f"=== Running AI Research on: {target_url} ===")
    print(f"LLM Provider: {settings.LLM_PROVIDER} | Model: {settings.LLM_MODEL}")

    # 1. Fetching page
    print("\n--- 1. Fetching Webpage ---")
    fetch_res = fetch_page(target_url)
    if not fetch_res.ok:
        print(f"FETCH FAILED: error_code={fetch_res.error_code}")
        sys.exit(1)

    print(f"Fetch Success: {len(fetch_res.text)} characters extracted")
    print(f"Final URL: {fetch_res.final_url}")
    page_sha256 = hashlib.sha256(fetch_res.text.encode("utf-8")).hexdigest()
    print(f"Page SHA256: {page_sha256}")

    # 2. Running Provider
    print("\n--- 2. Invoking AI Research Provider & Anti-Hallucination Guards ---")
    provider = AIResearchProvider()
    prod = ProductSummary(id=uuid4(), name="Sample Product")
    comps = [CompetitorSummary(id=uuid4(), name="Target Brand", website_url=target_url)]

    output = provider.research(prod, comps)

    print(f"\nRun Status: {output.run_status}")
    if output.competitor_outcomes:
        for oc in output.competitor_outcomes:
            print(f"Competitor Outcome: status={oc.status}, error_code={oc.error_code}, evidence_count={oc.evidence_count}")

    print(f"\n--- 3. Evidence Evaluation Summary ({len(output.evidence)} Kept) ---")
    for i, ev in enumerate(output.evidence, 1):
        print(f"[{i}] KEPT: {ev.title}")
        print(f"    Excerpt: \"{ev.excerpt}\"")
        print(f"    Confidence: {ev.confidence} | Source Type: {ev.source_type}")
        print(f"    Data: {ev.data}")

    if output.analyses:
        an = output.analyses[0]
        print("\n--- 4. Qualitative Competitor Analysis ---")
        print(f"Observed Price: {an.price_observed}")
        print("Strengths:")
        for s in an.strengths:
            print(f"  + {s}")
        print("Weaknesses:")
        for w in an.weaknesses:
            print(f"  - {w}")
    else:
        print("\nNo competitor analysis produced (no usable evidence survived anti-hallucination guards).")


if __name__ == "__main__":
    main()
