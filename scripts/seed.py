import json
import os
import sys
import uuid
from decimal import Decimal
from pathlib import Path

# Add backend directory and workspace root to path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(root_dir / "backend"))

from sqlalchemy import select, func, text, create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.core.config import settings
from backend.app.core.database import Base
import backend.app.models
from backend.app.models.product import Product
from backend.app.models.version import ProductVersion
from backend.app.models.competitor import Competitor
from backend.app.models.evidence import ResearchEvidence, compute_evidence_content_hash
from backend.app.models.analysis import CompetitorAnalysis
from backend.app.models.validation import ValidationRun
from backend.app.models.report import Report
from backend.app.services.validation.orchestrator import ValidationOrchestrator
from backend.app.services.reports import generate_launch_report


def SessionLocal():
    """Return an active DB session, falling back to local SQLite if Postgres is unreachable."""
    db_url = os.environ.get("DATABASE_URL") or settings.DATABASE_URL
    try:
        connect_args = {}
        if "postgresql" in db_url:
            connect_args["connect_timeout"] = 2
        engine = create_engine(db_url, pool_pre_ping=True, connect_args=connect_args)
        if "sqlite" in db_url:
            Base.metadata.create_all(bind=engine)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        print(f"[seed] Database at {db_url} is unreachable ({exc}). Falling back to sqlite:///./launchtwin.db")
        db_url = "sqlite:///./launchtwin.db"
        engine = create_engine(db_url)
        Base.metadata.create_all(bind=engine)

    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return Session()


def seed_database():
    seed_file = root_dir / "seed" / "demo_product.json"
    if not seed_file.exists():
        seed_file = root_dir / "backend" / "seed" / "demo_product.json"
    if not seed_file.exists():
        print(f"Error: Seed file not found at {seed_file}")
        sys.exit(1)

    with open(seed_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Normalize entries
    products_to_seed = []
    if "products" in data and isinstance(data["products"], list):
        products_to_seed = data["products"]
    elif "product" in data:
        products_to_seed = [{"key": "default", "product": data["product"], "competitors": data.get("competitors", [])}]

    db = SessionLocal()
    seeded_results = []
    primary_product_id = None

    try:
        for item in products_to_seed:
            prod_data = item["product"]
            competitors_data = item.get("competitors", [])
            key = item.get("key", "default").upper()

            # 1. Idempotency check: look up by product name (case-insensitive)
            existing_product = db.scalar(
                select(Product).where(func.lower(Product.name) == prod_data["name"].lower())
            )

            if existing_product:
                print(f"Product '{existing_product.name}' (ID: {existing_product.id}) already exists. Skipping insertion.")
                latest_run = db.scalar(
                    select(ValidationRun)
                    .where(ValidationRun.product_id == existing_product.id)
                    .order_by(ValidationRun.created_at.desc())
                )
                score_str = f"{latest_run.readiness_score}/100" if latest_run and latest_run.readiness_score is not None else "N/A"
                verdict_str = latest_run.verdict if latest_run else "N/A"

                seeded_results.append({
                    "key": key,
                    "id": str(existing_product.id),
                    "name": existing_product.name,
                    "version": existing_product.current_version,
                    "score": score_str,
                    "verdict": verdict_str,
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

            # 3. Create Initial Version (v1)
            initial_version = ProductVersion(
                id=version_id,
                product_id=product_id,
                version_number=1,
                assumptions=prod_data["assumptions"],
                change_summary={},
                created_by="system-seed",
            )
            db.add(initial_version)
            db.flush()

            # 4. Add Competitors, Evidence, and Analyses
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

                # Evidence
                evidence_ids = []
                for ev in comp_data.get("evidence", []):
                    ev_id = uuid.uuid4()
                    evidence = ResearchEvidence(
                        id=ev_id,
                        product_id=product_id,
                        competitor_id=comp_id,
                        content_hash=compute_evidence_content_hash(ev.get("source_url"), ev.get("excerpt", "")),
                        source_type=ev.get("source_type", "website"),
                        source_url=ev.get("source_url"),
                        title=ev.get("title", ""),
                        excerpt=ev.get("excerpt", ""),
                        confidence=Decimal(str(ev.get("confidence", "0.90"))),
                        data=ev.get("data", {}),
                    )
                    db.add(evidence)
                    evidence_ids.append(ev_id)

                # Analysis
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
            orchestrator = ValidationOrchestrator(db)
            validation_run = orchestrator.run_validation(product_id, trigger="initial")

            # 6. Generate Launch Report
            report = generate_launch_report(product_id, db)

            seeded_results.append({
                "key": key,
                "id": str(product.id),
                "name": product.name,
                "version": product.current_version,
                "score": f"{validation_run.readiness_score}/100",
                "verdict": validation_run.verdict,
                "report_id": str(report.id),
                "status": "CREATED",
            })
            if primary_product_id is None:
                primary_product_id = product.id

        print("\n" + "=" * 70)
        print("SEED DATABASE EXECUTION SUMMARY")
        print("=" * 70)
        for res in seeded_results:
            print(f"[{res['key']}] {res['name']} ({res['status']})")
            print(f"  Product ID:    {res['id']}")
            print(f"  Version:       v{res['version']}")
            print(f"  Readiness:     {res['score']} ({res['verdict']})")
            print(f"  Frontend URL:  http://localhost:5173/products/{res['id']}")
            print(f"  API URL:       http://localhost:8000/api/v1/products/{res['id']}")
            print("-" * 70)

        return primary_product_id

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
