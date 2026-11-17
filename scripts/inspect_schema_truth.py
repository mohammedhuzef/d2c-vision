import os
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.core.database import Base
import backend.app.models

print("=== PART 1: SCHEMA TRUTH INSPECTION ===")

# Reference DB
conn = sqlite3.connect("backend/_reference/launchtwin.db")
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'alembic_%';")
ref_tables = sorted([r[0] for r in cursor.fetchall()])
print("REFERENCE DB TABLES:", ref_tables)

# Reference columns per table
ref_schema = {}
for t in ref_tables:
    cursor.execute(f"PRAGMA table_info({t});")
    cols = [row[1] for row in cursor.fetchall()]
    ref_schema[t] = cols

# ORM Tables
orm_tables = sorted(list(Base.metadata.tables.keys()))
print("ORM TABLES:", orm_tables)

orm_schema = {}
for t in orm_tables:
    table = Base.metadata.tables[t]
    orm_schema[t] = [c.name for c in table.columns]

# Alembic Revisions
mig_dir = "backend/alembic/versions"
mig_files = sorted(os.listdir(mig_dir)) if os.path.exists(mig_dir) else []
print("ALEMBIC REVISION FILES:", mig_files)

print("\n=== EXPECTED 12 TABLES COMPARISON ===")
expected_12 = [
    "products",
    "product_versions",
    "competitors",
    "competitor_analyses",
    "research_evidence",
    "research_runs",
    "validation_runs",
    "validation_results",
    "recommendations",
    "reports",
    "impact_events",
    "influencers",
]

print(f"{'Expected Table':<25} | {'Exists in Ref':<15} | {'Exists in ORM':<15} | {'Col Differences'}")
print("-" * 80)
for t in expected_12:
    in_ref = t in ref_tables
    in_orm = t in orm_tables
    diffs = []
    if in_ref and in_orm:
        ref_cols = set(ref_schema[t])
        orm_cols = set(orm_schema[t])
        missing_in_orm = ref_cols - orm_cols
        extra_in_orm = orm_cols - ref_cols
        if missing_in_orm:
            diffs.append(f"Missing in ORM: {missing_in_orm}")
        if extra_in_orm:
            diffs.append(f"Extra in ORM: {extra_in_orm}")
    elif not in_ref:
        diffs.append("Not in ref DB")
    elif not in_orm:
        diffs.append("Not in ORM")
    diff_str = "; ".join(diffs) if diffs else "MATCH"
    print(f"{t:<25} | {str(in_ref):<15} | {str(in_orm):<15} | {diff_str}")

# Any extra tables
extra_ref = set(ref_tables) - set(expected_12)
extra_orm = set(orm_tables) - set(expected_12)
print("\nExtra in Ref DB:", extra_ref)
print("Extra in ORM:", extra_orm)
