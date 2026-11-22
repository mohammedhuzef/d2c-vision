"""LaunchTwin AI Real-World Founder Trial Execution Script.

Runs real evidence extraction from founder-supplied competitor URLs using
the SSRF-hardened PageFetcher and Google Gemini LLM, followed by the pure
deterministic validation pipeline in memory.

Rules & Invariants:
- Refuses to run without LLM_API_KEY
- Operates in-memory; stores nothing unless --save is passed
- Validates trial input and prints detailed evidence provenance
- Evaluates unit economics and 6 stages via pure Python rules
"""

import argparse
import json
import os
import sys
import uuid
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict, List

# Add repository root to python path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(root_dir / "backend"))

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal
from backend.app.models.product import Product
from backend.app.models.version import ProductVersion
from backend.app.models.competitor import Competitor
from backend.app.models.evidence import ResearchEvidence, compute_evidence_content_hash
from backend.app.models.analysis import CompetitorAnalysis
from backend.app.usecases.run_validation import run_validation_use_case
from backend.app.services.page_fetcher import PageFetcher
from backend.app.services.llm_client import LLMClient
from backend.app.services.ai_research_provider import AIResearchProvider
from backend.app.services.validation.pipeline import run_pipeline
from backend.app.services.readiness import calculate_readiness
from backend.app.services.validation.recommendations.generator import generate as generate_recommendations


def parse_args():
    parser = argparse.ArgumentParser(description="Run LaunchTwin real-world founder trial.")
    parser.add_argument(
        "--input",
        type=str,
        default="data/trial_template.json",
        help="Path to trial input JSON file with product assumptions and competitor URLs.",
    )
    parser.add_argument(
        "--save",
        action="store_true",
        help="Persist trial product, evidence, and run to the database (default: in-memory dry run).",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    input_path = Path(args.input)
    if not input_path.is_absolute():
        input_path = root_dir / input_path

    print("=" * 70)
    print("LaunchTwin AI — Real-World Founder Trial Runner")
    print("=" * 70)

    # 1. API Key Guard
    api_key = os.environ.get("LLM_API_KEY") or settings.LLM_API_KEY
    if not api_key or not str(api_key).strip():
        print("\n[REFUSAL] LLM_API_KEY is not set in environment or configuration.")
        print("Real-world trial requires a valid Google Gemini API key to extract live evidence.")
        print("Please configure LLM_API_KEY in your .env file or environment.")
        sys.exit(1)

    # 2. Input File Check
    if not input_path.exists():
        print(f"\n[FATAL] Input file not found: {input_path}")
        sys.exit(1)

    with open(input_path, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError as jde:
            print(f"\n[FATAL] Invalid JSON in input file: {jde}")
            sys.exit(1)

    # 3. Validate Non-Empty Inputs
    prod = data.get("product", {})
    prod_name = prod.get("name", "").strip()
    competitors = data.get("competitors", [])

    empty_issues = []
    if not prod_name:
        empty_issues.append("Product name ('product.name') is empty.")

    valid_competitors = [
        c for c in competitors if c.get("name", "").strip() and c.get("website_url", "").strip()
    ]
    if len(valid_competitors) < 2:
        empty_issues.append(
            f"Requires at least 2 competitors with non-empty 'name' and 'website_url' (found {len(valid_competitors)})."
        )

    if empty_issues:
        print("\n[INPUT VALIDATION REFUSAL] Trial template contains empty placeholders:")
        for issue in empty_issues:
            print(f"  • {issue}")
        print("\nPlease populate data/trial_template.json with your actual product assumptions")
        print("and at least 2 real competitor URLs before executing a live trial.")
        sys.exit(2)

    print(f"\nTarget Product: {prod_name}")
    print(f"Competitors to Research: {len(valid_competitors)}")
    for idx, c in enumerate(valid_competitors, 1):
        print(f"  {idx}. {c.get('name')} -> {c.get('website_url')}")

    # 4. Execute Real AI Evidence Extraction
    print("\n--- Phase 1: Live Competitor Extraction (Gemini AI + SSRF Guard) ---")
    fetcher = PageFetcher()
    llm = LLMClient(api_key=api_key, model=settings.LLM_MODEL)
    provider = AIResearchProvider(fetcher=fetcher, llm=llm)

    product_data = {
        "id": str(uuid.uuid4()),
        "name": prod_name,
        "description": prod.get("description", ""),
        "category": prod.get("category", ""),
    }
    competitors_data = [
        {
            "id": str(uuid.uuid4()),
            "name": c["name"].strip(),
            "website_url": c["website_url"].strip(),
        }
        for c in valid_competitors
    ]

    research_result = provider.research(product_data, competitors_data)

    print(f"\nResearch Provider: {research_result.provider}")
    print(f"Total Evidence Extracted: {len(research_result.evidence)}")
    print(f"Total Analyses Formed: {len(research_result.analyses)}")

    print("\nPer-Competitor Evidence Provenance:")
    for analysis in research_result.analyses:
        comp_name = next(
            (c["name"] for c in competitors_data if c["id"] == analysis.competitor_id),
            analysis.competitor_id,
        )
        print(f"\n[Competitor] {comp_name}")
        print(f"  • Observed Price: {analysis.currency or 'USD'} {analysis.price_observed}")
        print(f"  • Strengths ({len(analysis.strengths)}): {', '.join(analysis.strengths[:3])}")
        print(f"  • Weaknesses ({len(analysis.weaknesses)}): {', '.join(analysis.weaknesses[:3])}")

        comp_evs = [e for e in research_result.evidence if e.competitor_id == analysis.competitor_id]
        print(f"  • Evidence Items ({len(comp_evs)}):")
        for ev in comp_evs[:3]:
            print(f"     - [{ev.source_type} | Conf: {ev.confidence}] \"{ev.excerpt[:100]}...\"")

    if research_result.errors:
        print(f"\nExtraction Notes & Dropped Items: {json.dumps(research_result.errors, indent=2)}")

    # 5. Run Pure In-Memory Validation Pipeline
    print("\n--- Phase 2: In-Memory Pure Rules Validation Pipeline ---")
    assumptions_dict = {
        "product": data.get("product", {}),
        "customer": data.get("customer", {}),
        "pricing": data.get("pricing", {}),
        "financial": data.get("financial", {}),
        "marketing": data.get("marketing", {}),
    }

    evidence_dicts = [
        {
            "id": str(uuid.uuid4()),
            "competitor_id": ev.competitor_id,
            "source_type": ev.source_type,
            "source_url": ev.source_url,
            "title": ev.title,
            "excerpt": ev.excerpt,
            "confidence": ev.confidence,
            "data": ev.data,
        }
        for ev in research_result.evidence
    ]

    analyses_dicts = [
        {
            "id": str(uuid.uuid4()),
            "competitor_id": an.competitor_id,
            "summary": an.summary,
            "strengths": an.strengths,
            "weaknesses": an.weaknesses,
            "price_observed": an.price_observed,
            "currency": an.currency,
            "produced_by": an.produced_by,
        }
        for an in research_result.analyses
    ]

    stage_results = run_pipeline(
        assumptions=assumptions_dict,
        evidence=evidence_dicts,
        competitor_analyses=analyses_dicts,
    )

    readiness = calculate_readiness(stage_results)
    recommendations = generate_recommendations(
        stage_results=stage_results,
        assumptions=assumptions_dict,
        evidence=evidence_dicts,
    )

    print(f"\nFinal Readiness Verdict: {readiness.verdict}")
    print(f"Overall Readiness Score: {readiness.overall_score if readiness.overall_score is not None else 'null'}")

    print("\nStage Status Breakdown:")
    for stage_name, res in stage_results.items():
        score_display = f"{res.score:.2f}" if res.score is not None else "null"
        print(f"  • {stage_name:<18} -> Status: {res.status.value:<22} Score: {score_display}")

    print(f"\nGenerated Recommendations ({len(recommendations)}):")
    for rec in recommendations[:5]:
        print(f"  • [{rec.priority}] {rec.title} -> {rec.detail}")

    if args.save:
        print("\n[NOTE] --save specified: Persisting trial data to database...")
        db = SessionLocal()
        try:
            trial_prod_id = uuid.uuid4()
            trial_ver_id = uuid.uuid4()
            new_prod = Product(
                id=trial_prod_id,
                name=prod_name,
                description=prod.get("description", "Real-World Trial Product"),
                category=prod.get("category", "General"),
                target_market=prod.get("target_market", "Direct-to-Consumer"),
                current_version=1,
                status="active",
            )
            db.add(new_prod)

            new_ver = ProductVersion(
                id=trial_ver_id,
                product_id=trial_prod_id,
                version_number=1,
                assumptions=assumptions_dict,
                change_summary={"trigger": "real_world_trial"},
                created_by="trial_runner",
            )
            db.add(new_ver)
            db.flush()

            # Map competitors
            comp_id_map: Dict[str, uuid.UUID] = {}
            for comp_item in valid_competitors:
                c_uuid = uuid.uuid4()
                c_name = comp_item.get("name")
                comp_obj = Competitor(
                    id=c_uuid,
                    product_id=trial_prod_id,
                    name=c_name,
                    website_url=comp_item.get("website_url"),
                )
                db.add(comp_obj)
                comp_id_map[c_name] = c_uuid
            db.flush()

            # Map and persist evidence
            for ev_item in research_result.evidence:
                comp_uuid = None
                if ev_item.competitor_id:
                    for comp_name, c_uuid in comp_id_map.items():
                        if ev_item.competitor_id == str(c_uuid) or ev_item.competitor_id in comp_name:
                            comp_uuid = c_uuid
                            break
                c_hash = compute_evidence_content_hash(ev_item.source_url, ev_item.excerpt)
                s_type = ev_item.source_type if ev_item.source_type in {"website", "review", "pricing_page", "social", "manual"} else "website"
                ev_obj = ResearchEvidence(
                    id=uuid.uuid4(),
                    product_id=trial_prod_id,
                    competitor_id=comp_uuid,
                    content_hash=c_hash,
                    source_type=s_type,
                    source_url=ev_item.source_url,
                    title=ev_item.title,
                    excerpt=ev_item.excerpt,
                    confidence=ev_item.confidence,
                    data=ev_item.data,
                )
                db.add(ev_obj)

            db.commit()

            # Execute validation persistence use-case
            run_validation_use_case(db=db, product_id=trial_prod_id)
            print(f"Trial product '{prod_name}' (ID: {trial_prod_id}) and validation run saved successfully.")
        except Exception as e:
            db.rollback()
            print(f"[ERROR] Failed to persist trial data: {e}")
        finally:
            db.close()
    else:
        print("\n[DRY RUN] Trial executed purely in memory. No database rows were modified.")

    print("\n" + "=" * 70)
    print("Trial completed successfully.")
    print("=" * 70)


if __name__ == "__main__":
    main()
