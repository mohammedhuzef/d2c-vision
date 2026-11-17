import os
import sqlite3
import sys
from pathlib import Path

os.environ['DISABLE_SQLALCHEMY_CEXT'] = '1'
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import backend.app.models
from backend.app.core.database import Base

ref_db = 'backend/_reference/launchtwin.db'
conn = sqlite3.connect(ref_db)
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
ref_tables = [r[0] for r in cursor.fetchall() if r[0] != 'sqlite_sequence' and r[0] != 'alembic_version']

with open('backend/alembic/versions/0001_initial_schema.py', 'r', encoding='utf-8') as f:
    mig_code = f.read()
import re
mig_tables = re.findall(r"op\.create_table\(\s*['\"]([^'\"]+)['\"]", mig_code)
orm_tables = sorted(Base.metadata.tables.keys())

expected_12 = [
    "products", "product_versions", "competitors", "competitor_analyses",
    "research_evidence", "research_runs", "validation_runs", "validation_results",
    "recommendations", "reports", "impact_events", "influencers"
]

print("=== TABLE COMPARISON ===")
print(f"{'Table':<25} | {'Expected':<8} | {'ORM':<8} | {'0001 Mig':<8} | Differences")
print("-" * 80)

for t in sorted(expected_12):
    in_exp = t in expected_12
    in_orm = t in orm_tables
    in_mig = t in mig_tables

    # Compare columns between ref_db and ORM
    cursor.execute(f"PRAGMA table_info({t});")
    ref_cols = {c[1]: c[2] for c in cursor.fetchall()}

    orm_cols = {}
    if in_orm:
        orm_t = Base.metadata.tables[t]
        orm_cols = {c.name: str(c.type) for c in orm_t.columns}

    diffs = []
    missing_in_orm = set(ref_cols.keys()) - set(orm_cols.keys())
    if missing_in_orm:
        diffs.append(f"Missing in ORM: {missing_in_orm}")
    extra_in_orm = set(orm_cols.keys()) - set(ref_cols.keys())
    if extra_in_orm:
        diffs.append(f"Extra in ORM: {extra_in_orm}")

    diff_str = "; ".join(diffs) if diffs else "None (Exact match)"
    print(f"{t:<25} | {str(in_exp):<8} | {str(in_orm):<8} | {str(in_mig):<8} | {diff_str}")

# Check any tables in ORM not in expected_12
extras_in_orm_overall = set(orm_tables) - set(expected_12)
if extras_in_orm_overall:
    print(f"\nExtra tables in ORM: {extras_in_orm_overall}")
else:
    print("\nNo extra tables in ORM (exactly matches the 12 expected).")
