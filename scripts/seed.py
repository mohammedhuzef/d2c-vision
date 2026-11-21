"""LaunchTwin AI Deterministic Seed Data Generator.

Loads four canonical demo products and twelve fictional sample influencers through
real database repositories and validation use-cases.

Adheres strictly to FROZEN RULES:
- Idempotent and safe to execute repeatedly
- Production guard: refuses to run on production-like database URLs unless --allow-prod-like is supplied
- 4 deterministic demo products:
  1. SAMPLE TerraFlask Tumbler (Vector A) -> 100.00, READY
  2. SAMPLE Heavy-Packaging Bottle -> 97.50, READY_WITH_WARNINGS
  3. SAMPLE Underpriced Bottle -> 79.00, NOT_READY (critical veto)
  4. SAMPLE Early-Stage Idea -> null score, READY_WITH_WARNINGS
- At least 12 fictional creators named "(Sample)"
- All competitor excerpts labelled source_type="sample_seed", titled "SAMPLE ..."
- Prints a clear verification summary table comparing expected vs actual verdicts
"""

import argparse
import json
import os
import sys
import uuid
from decimal import Decimal
from pathlib import Path

# Add root directory to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(root_dir / "backend"))

from sqlalchemy import select, func, text, create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.core.config import settings
from backend.app.core.database import Base
from backend.app.models.product import Product
from backend.app.models.version import ProductVersion
from backend.app.models.competitor import Competitor
from backend.app.models.evidence import ResearchEvidence, compute_evidence_content_hash
from backend.app.models.analysis import CompetitorAnalysis
from backend.app.models.validation import ValidationRun
from backend.app.models.report import Report
from backend.app.models.influencer import Influencer
from backend.app.usecases.run_validation import run_validation_use_case
from backend.app.repositories.report_repository import create_report


def get_db_session(allow_prod_like: bool = False):
    """Establishes DB connection with strict production safety check."""
    db_url = os.environ.get("DATABASE_URL") or settings.DATABASE_URL
    lower_url = db_url.lower()

    # Guard against accidental production wipes
    prod_keywords = ["prod", "production", "live"]
    if any(k in lower_url for k in prod_keywords) and not allow_prod_like:
        print(f"\n[FATAL ERROR] Refusing to seed database with URL: '{db_url}'")
        print("URL looks like a production environment. Pass '--allow-prod-like' if intentional.")
        sys.exit(1)

    connect_args = {}
    if "postgresql" in lower_url:
        connect_args["connect_timeout"] = 3
    elif "sqlite" in lower_url:
        connect_args["check_same_thread"] = False

    try:
        engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)
        if "sqlite" in lower_url:
            Base.metadata.create_all(bind=engine)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        print(f"[seed] Database at {db_url} unreachable ({exc}). Falling back to sqlite:///./launchtwin.db")
        db_url = "sqlite:///./launchtwin.db"
        engine = create_engine(db_url, connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=engine)

    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return Session()


SAMPLE_INFLUENCERS = [
    {
        "name": "Sneha Patel (Sample)",
        "handle": "@sneha.fitness.sample",
        "platform": "instagram",
        "category": "Fitness & Active",
        "bio": "Certified strength trainer & hydration enthusiast. Fictional sample profile.",
        "location": "Mumbai, India",
        "follower_count": 42000,
        "follower_tier": "micro",
        "engagement_rate": 5.8,
        "avg_views": 24000,
        "avg_likes": 1800,
        "niche_tags": ["fitness", "hydration", "workout", "activewear"],
        "audience_demographics": {"gender": "65% Female", "age": "21-35"},
        "estimated_cost_per_post": Decimal("15000.00"),
        "deliverables_summary": "1x Dedicated Reel + 2x Stories",
    },
    {
        "name": "Kabir Mehta (Sample)",
        "handle": "@kabir.runs.sample",
        "platform": "youtube",
        "category": "Fitness & Active",
        "bio": "Marathoner and endurance sport tech reviewer. Fictional sample profile.",
        "location": "Bengaluru, India",
        "follower_count": 85000,
        "follower_tier": "mid",
        "engagement_rate": 4.2,
        "avg_views": 38000,
        "avg_likes": 2600,
        "niche_tags": ["running", "marathon", "gear", "tumbler"],
        "audience_demographics": {"gender": "55% Male", "age": "25-40"},
        "estimated_cost_per_post": Decimal("30000.00"),
        "deliverables_summary": "1x Dedicated Video Review",
    },
    {
        "name": "Ananya Sharma (Sample)",
        "handle": "@ananya.wellness.sample",
        "platform": "instagram",
        "category": "Health & Wellness",
        "bio": "Holistic lifestyle, mindfulness & eco-friendly living advocate. Fictional sample.",
        "location": "Delhi NCR, India",
        "follower_count": 68000,
        "follower_tier": "mid",
        "engagement_rate": 6.1,
        "avg_views": 31000,
        "avg_likes": 2400,
        "niche_tags": ["wellness", "sustainable", "hydration", "mindfulness"],
        "audience_demographics": {"gender": "78% Female", "age": "22-38"},
        "estimated_cost_per_post": Decimal("22000.00"),
        "deliverables_summary": "1x Dedicated Reel + 3x Stories",
    },
    {
        "name": "Rohan Deshmukh (Sample)",
        "handle": "@rohan.commutes.sample",
        "platform": "tiktok",
        "category": "Lifestyle & Travel",
        "bio": "Urban commuter tips, travel accessories & EDC essentials. Fictional sample.",
        "location": "Pune, India",
        "follower_count": 15000,
        "follower_tier": "micro",
        "engagement_rate": 7.4,
        "avg_views": 19000,
        "avg_likes": 1600,
        "niche_tags": ["commute", "travel", "coffee", "edc"],
        "audience_demographics": {"gender": "60% Male", "age": "20-32"},
        "estimated_cost_per_post": Decimal("8000.00"),
        "deliverables_summary": "2x Short Video Reviews",
    },
    {
        "name": "Pooja Verma (Sample)",
        "handle": "@pooja.eco.sample",
        "platform": "instagram",
        "category": "Eco-Living & Home Care",
        "bio": "Zero waste living, plastic-free swaps & sustainable home choices. Fictional sample.",
        "location": "Goa, India",
        "follower_count": 18500,
        "follower_tier": "micro",
        "engagement_rate": 6.5,
        "avg_views": 14000,
        "avg_likes": 1100,
        "niche_tags": ["plasticfree", "zerowaste", "sustainable", "drinkware"],
        "audience_demographics": {"gender": "70% Female", "age": "24-42"},
        "estimated_cost_per_post": Decimal("9500.00"),
        "deliverables_summary": "1x Dedicated Carousel + 2x Stories",
    },
    {
        "name": "Vikram Seth (Sample)",
        "handle": "@vikram.exec.sample",
        "platform": "youtube",
        "category": "Tech & Gadgets",
        "bio": "Executive desk setups, productivity gadgets & smart hardware. Fictional sample.",
        "location": "Hyderabad, India",
        "follower_count": 210000,
        "follower_tier": "macro",
        "engagement_rate": 2.9,
        "avg_views": 85000,
        "avg_likes": 4500,
        "niche_tags": ["desksetup", "smart", "tech", "executive"],
        "audience_demographics": {"gender": "75% Male", "age": "26-45"},
        "estimated_cost_per_post": Decimal("50000.00"),
        "deliverables_summary": "1x Integrated Video Sponsor",
    },
    {
        "name": "Tanvi Rao (Sample)",
        "handle": "@tanvi.sips.sample",
        "platform": "instagram",
        "category": "Gourmet Beverages & Tea",
        "bio": "Specialty coffee, loose-leaf teas & artisanal beverage gear. Fictional sample.",
        "location": "Bengaluru, India",
        "follower_count": 29000,
        "follower_tier": "micro",
        "engagement_rate": 5.1,
        "avg_views": 16000,
        "avg_likes": 1300,
        "niche_tags": ["coffee", "tea", "tumbler", "taste"],
        "audience_demographics": {"gender": "62% Female", "age": "23-38"},
        "estimated_cost_per_post": Decimal("12500.00"),
        "deliverables_summary": "1x Dedicated Reel + Recipe Integration",
    },
    {
        "name": "Arjun Nair (Sample)",
        "handle": "@arjun.adventures.sample",
        "platform": "tiktok",
        "category": "Outdoor & Camping",
        "bio": "Trekking, hiking & backcountry gear stress testing. Fictional sample.",
        "location": "Dehradun, India",
        "follower_count": 48000,
        "follower_tier": "micro",
        "engagement_rate": 6.8,
        "avg_views": 27000,
        "avg_likes": 2100,
        "niche_tags": ["trekking", "camping", "rugged", "hydration"],
        "audience_demographics": {"gender": "68% Male", "age": "18-35"},
        "estimated_cost_per_post": Decimal("11000.00"),
        "deliverables_summary": "1x Field Test Video",
    },
    {
        "name": "Dr. Neha Kulkarni (Sample)",
        "handle": "@dr.neha.nutrition.sample",
        "platform": "instagram",
        "category": "Health Foods & Snacks",
        "bio": "Clinical nutritionist breaking down everyday food and drink choices. Fictional sample.",
        "location": "Mumbai, India",
        "follower_count": 92000,
        "follower_tier": "mid",
        "engagement_rate": 4.5,
        "avg_views": 41000,
        "avg_likes": 3200,
        "niche_tags": ["nutrition", "bpa-free", "health", "water"],
        "audience_demographics": {"gender": "74% Female", "age": "25-45"},
        "estimated_cost_per_post": Decimal("28000.00"),
        "deliverables_summary": "1x Educational Reel + 2x Q&A Stories",
    },
    {
        "name": "Devansh Joshi (Sample)",
        "handle": "@devansh.nano.sample",
        "platform": "instagram",
        "category": "Fitness & Active",
        "bio": "Calisthenics enthusiast & student athlete community leader. Fictional sample.",
        "location": "Ahmedabad, India",
        "follower_count": 3200,
        "follower_tier": "nano",
        "engagement_rate": 9.2,
        "avg_views": 4500,
        "avg_likes": 420,
        "niche_tags": ["workout", "budget", "tumbler", "gym"],
        "audience_demographics": {"gender": "50/50", "age": "18-25"},
        "estimated_cost_per_post": Decimal("2500.00"),
        "deliverables_summary": "1x Dedicated Reel + Story Share",
    },
    {
        "name": "Zara Khan (Sample)",
        "handle": "@zara.urban.sample",
        "platform": "youtube",
        "category": "Lifestyle & Travel",
        "bio": "Metropolitan living, daily vlogs & minimal lifestyle essentials. Fictional sample.",
        "location": "London & Mumbai",
        "follower_count": 140000,
        "follower_tier": "mid",
        "engagement_rate": 3.6,
        "avg_views": 52000,
        "avg_likes": 3100,
        "niche_tags": ["urban", "minimal", "commute", "aesthetic"],
        "audience_demographics": {"gender": "68% Female", "age": "22-35"},
        "estimated_cost_per_post": Decimal("35000.00"),
        "deliverables_summary": "1x Dedicated Video Vlog Segment",
    },
    {
        "name": "Siddharth Sen (Sample)",
        "handle": "@siddharth.gear.sample",
        "platform": "tiktok",
        "category": "Tech & Gadgets",
        "bio": "Quick product teardowns, durability tests & EDC reviews. Fictional sample.",
        "location": "Kolkata, India",
        "follower_count": 76000,
        "follower_tier": "mid",
        "engagement_rate": 5.9,
        "avg_views": 39000,
        "avg_likes": 2900,
        "niche_tags": ["teardown", "durability", "titanium", "bottle"],
        "audience_demographics": {"gender": "72% Male", "age": "18-30"},
        "estimated_cost_per_post": Decimal("16000.00"),
        "deliverables_summary": "1x Durability Test Video",
    },
]


def seed_sample_influencers(db, product_id=None) -> int:
    """Inserts at least 12 fictional sample influencers idempotently."""
    created_count = 0
    for creator in SAMPLE_INFLUENCERS:
        existing = db.scalar(
            select(Influencer).where(func.lower(Influencer.handle) == creator["handle"].lower())
        )
        if not existing:
            inf = Influencer(
                id=uuid.uuid4(),
                product_id=product_id,
                name=creator["name"],
                handle=creator["handle"],
                avatar_url=None,
                platform=creator["platform"],
                category=creator["category"],
                bio=creator["bio"],
                location=creator["location"],
                follower_count=creator["follower_count"],
                follower_tier=creator["follower_tier"],
                engagement_rate=creator["engagement_rate"],
                avg_views=creator["avg_views"],
                avg_likes=creator["avg_likes"],
                niche_tags=creator["niche_tags"],
                audience_demographics=creator["audience_demographics"],
                estimated_cost_per_post=creator["estimated_cost_per_post"],
                deliverables_summary=creator["deliverables_summary"],
                status="discovered",
                notes="Fictional creator profile for demonstration only.",
            )
            db.add(inf)
            created_count += 1

    db.commit()
    return created_count


def seed_database(allow_prod_like: bool = False, run_live: bool = False):
    """Executes deterministic seeding across four products and sample influencers."""
    seed_file = root_dir / "seed" / "demo_product.json"
    if not seed_file.exists():
        seed_file = root_dir / "backend" / "seed" / "demo_product.json"
    if not seed_file.exists():
        print(f"[FATAL] Seed file not found at: {seed_file}")
        sys.exit(1)

    with open(seed_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    products_to_seed = data.get("products", [])
    if not products_to_seed:
        print("[FATAL] No products defined in seed file.")
        sys.exit(1)

    db = get_db_session(allow_prod_like=allow_prod_like)
    seeded_results = []
    primary_product_id = None

    try:
        for idx, item in enumerate(products_to_seed, start=1):
            prod_data = item["product"]
            competitors_data = item.get("competitors", [])
            key = item.get("key", f"prod_{idx}").upper()
            expected = item.get("expected", {})

            # 1. Idempotency check: look up by product name (case-insensitive)
            existing_product = db.scalar(
                select(Product).where(func.lower(Product.name) == prod_data["name"].lower())
            )

            if existing_product:
                latest_run = db.scalar(
                    select(ValidationRun)
                    .where(ValidationRun.product_id == existing_product.id)
                    .order_by(ValidationRun.created_at.desc())
                )
                score_val = latest_run.readiness_score if latest_run else None
                score_str = f"{score_val:.2f}" if score_val is not None else "null"
                verdict_str = latest_run.verdict if latest_run else "N/A"

                # Extract financial metrics
                fin_summary = "N/A"
                if latest_run and latest_run.results:
                    fin_res = next((r for r in latest_run.results if r.stage == "financial"), None)
                    if fin_res and fin_res.metrics:
                        m = fin_res.metrics
                        vc = m.get("variable_cost_per_unit", "0.00")
                        c = m.get("contribution_per_unit", "0.00")
                        cm = m.get("contribution_margin", "0.0000")
                        be = m.get("break_even_units", "0")
                        fin_summary = f"{vc} / {c} / {cm} / {be}"

                seeded_results.append({
                    "idx": idx,
                    "key": key,
                    "id": str(existing_product.id),
                    "name": existing_product.name,
                    "actual_verdict": verdict_str,
                    "actual_score": score_str,
                    "actual_fin": fin_summary,
                    "expected_verdict": expected.get("verdict"),
                    "expected_score": f"{expected.get('score'):.2f}" if expected.get("score") is not None else "null",
                    "expected_fin": expected.get("financial"),
                    "status": "EXISTING",
                })
                if primary_product_id is None:
                    primary_product_id = existing_product.id
                continue

            product_id = uuid.uuid4()
            version_id = uuid.uuid4()

            # 2. Create Product
            product = Product(
                id=product_id,
                name=prod_data["name"],
                description=prod_data.get("description"),
                category=prod_data.get("category"),
                target_market=prod_data.get("target_market"),
                current_version=1,
                status="active",
            )
            db.add(product)

            # 3. Create Version 1
            version = ProductVersion(
                id=version_id,
                product_id=product_id,
                version_number=1,
                assumptions=prod_data["assumptions"],
                change_summary={},
                created_by="system-seed",
            )
            db.add(version)
            db.flush()

            # 4. Create Competitors & Evidence
            for comp_data in competitors_data:
                comp_id = uuid.uuid4()
                competitor = Competitor(
                    id=comp_id,
                    product_id=product_id,
                    name=comp_data["name"],
                    website_url=comp_data.get("website_url"),
                    product_name=comp_data.get("product_name"),
                    notes=comp_data.get("notes"),
                )
                db.add(competitor)
                db.flush()

                evidence_ids = []
                for ev in comp_data.get("evidence", []):
                    ev_id = uuid.uuid4()
                    evidence = ResearchEvidence(
                        id=ev_id,
                        product_id=product_id,
                        competitor_id=comp_id,
                        content_hash=compute_evidence_content_hash(ev.get("source_url"), ev.get("excerpt", "")),
                        source_type="sample_seed",
                        source_url=ev.get("source_url"),
                        title=ev.get("title", "SAMPLE Observation"),
                        excerpt=ev.get("excerpt", ""),
                        confidence=Decimal(str(ev.get("confidence", "0.80"))),
                        data=ev.get("data", {}),
                    )
                    db.add(evidence)
                    evidence_ids.append(ev_id)

                if "analysis" in comp_data:
                    an = comp_data["analysis"]
                    analysis = CompetitorAnalysis(
                        id=uuid.uuid4(),
                        product_id=product_id,
                        competitor_id=comp_id,
                        summary=an.get("summary", ""),
                        strengths=an.get("strengths", []),
                        weaknesses=an.get("weaknesses", []),
                        price_observed=Decimal(str(an.get("price_observed"))) if an.get("price_observed") is not None else None,
                        evidence_ids=evidence_ids,
                        produced_by=an.get("produced_by", "mock"),
                    )
                    db.add(analysis)

            db.commit()

            # 5. Run Initial Validation
            validation_run = run_validation_use_case(db=db, product_id=product_id)

            # 6. Generate Launch Report
            report = create_report(db, product_id)

            score_val = validation_run.readiness_score
            score_str = f"{score_val:.2f}" if score_val is not None else "null"

            # Extract financial metrics
            fin_summary = "N/A"
            if validation_run and validation_run.results:
                fin_res = next((r for r in validation_run.results if r.stage == "financial"), None)
                if fin_res and fin_res.metrics:
                    m = fin_res.metrics
                    vc = m.get("variable_cost_per_unit", "0.00")
                    c = m.get("contribution_per_unit", "0.00")
                    cm = m.get("contribution_margin", "0.0000")
                    be = m.get("break_even_units", "0")
                    fin_summary = f"{vc} / {c} / {cm} / {be}"

            seeded_results.append({
                "idx": idx,
                "key": key,
                "id": str(product.id),
                "name": product.name,
                "actual_verdict": validation_run.verdict,
                "actual_score": score_str,
                "actual_fin": fin_summary,
                "expected_verdict": expected.get("verdict"),
                "expected_score": f"{expected.get('score'):.2f}" if expected.get("score") is not None else "null",
                "expected_fin": expected.get("financial"),
                "status": "CREATED",
            })
            if primary_product_id is None:
                primary_product_id = product.id

        # 7. Seed Sample Influencers
        inf_created = seed_sample_influencers(db, primary_product_id)

        # 8. Print Seed Verification Table
        print("\n" + "=" * 92)
        print("LAUNCHTWIN AI DEMO DATA SEED & VERDICT VERIFICATION TABLE")
        print("=" * 92)
        print(f"{'#':<3} {'Demo Product Name':<32} {'Expected Verdict':<20} {'Actual Verdict':<20} {'Match?'}")
        print("-" * 92)

        all_matched = True
        for r in seeded_results:
            v_match = r["actual_verdict"] == r["expected_verdict"]
            s_match = r["actual_score"] == r["expected_score"]
            is_ok = v_match and s_match
            if not is_ok:
                all_matched = False
            status_symbol = "[OK] MATCH" if is_ok else "[FAIL] MISMATCH"

            print(f"{r['idx']:<3} {r['name'][:30]:<32} {str(r['expected_verdict']) + ' (' + str(r['expected_score']) + ')':<20} {str(r['actual_verdict']) + ' (' + str(r['actual_score']) + ')':<20} {status_symbol}")
            if r["expected_fin"]:
                print(f"    Expected Fin: {r['expected_fin']}")
                print(f"    Actual Fin:   {r['actual_fin']}")

        print("-" * 92)
        print(f"Total Demo Products Verified:  {len(seeded_results)}")
        print(f"Sample Influencers Seeded:     {len(SAMPLE_INFLUENCERS)} total ({inf_created} new)")
        print(f"All Expected Verdicts Matched: {all_matched}")
        print("=" * 92 + "\n")

        # Optional live smoke check on competitor URLs if requested
        if run_live and primary_product_id:
            print("\n[--live] Executing live research check on primary product competitors...")
            from backend.app.services.ai_research_provider import AIResearchProvider
            provider = AIResearchProvider()
            comps = db.query(Competitor).filter(Competitor.product_id == primary_product_id).all()
            for c in comps:
                if c.website_url:
                    print(f"  Fetching: {c.name} ({c.website_url})...")
                    res = provider.analyze_competitor(c.website_url)
                    print(f"  Result: kept {len(res.evidence)} evidence items, price={res.price_observed}")

        return primary_product_id

    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="LaunchTwin AI Deterministic Database Seeder")
    parser.add_argument("--allow-prod-like", action="store_true", help="Allow running on URLs containing prod/production")
    parser.add_argument("--live", action="store_true", help="Run live competitor research on product 1")
    args = parser.parse_args()

    seed_database(allow_prod_like=args.allow_prod_like, run_live=args.live)
