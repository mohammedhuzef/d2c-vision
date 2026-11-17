import os
import sqlite3
import sys
from pathlib import Path

os.environ['DISABLE_SQLALCHEMY_CEXT'] = '1'
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

ref_db = 'backend/_reference/launchtwin.db'
if not os.path.exists(ref_db):
    print(f'NOT FOUND: {ref_db}')
else:
    conn = sqlite3.connect(ref_db)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = [r[0] for r in cursor.fetchall() if r[0] != 'sqlite_sequence']
    print(f'Found {len(tables)} tables in {ref_db}:')
    for t in tables:
        cursor.execute(f"PRAGMA table_info({t});")
        cols = cursor.fetchall()
        print(f"\nTABLE {t}:")
        for c in cols:
            # cid, name, type, notnull, dflt_value, pk
            pk_str = " PK" if c[5] else ""
            nn_str = " NOT NULL" if c[3] else ""
            df_str = f" DEFAULT {c[4]}" if c[4] is not None else ""
            print(f"  {c[1]}: {c[2]}{nn_str}{df_str}{pk_str}")
        cursor.execute(f"PRAGMA index_list({t});")
        idxs = cursor.fetchall()
        for idx in idxs:
            cursor.execute(f"PRAGMA index_info({idx[1]});")
            idx_cols = [str(ic[2]) if ic[2] is not None else '<expr>' for ic in cursor.fetchall()]
            uniq_str = " UNIQUE" if idx[2] else ""
            print(f"  INDEX {idx[1]}{uniq_str} ({', '.join(idx_cols)})")

    with open('backend/alembic/versions/0001_initial_schema.py', 'r', encoding='utf-8') as f:
        mig_code = f.read()
    import re
    mig_tables = re.findall(r"op\.create_table\(\s*['\"]([^'\"]+)['\"]", mig_code)
    print('\nTables created in 0001_initial_schema.py:')
    for mt in mig_tables:
        print(' -', mt)

    import backend.app.models
    from backend.app.core.database import Base
    orm_tables = sorted(Base.metadata.tables.keys())
    print('\nTables in Base.metadata.tables (ORM):')
    for ot in orm_tables:
        print(' -', ot)
