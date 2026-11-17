import os
import sys
from pathlib import Path

os.environ['DISABLE_SQLALCHEMY_CEXT'] = '1'
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from alembic.config import Config
from alembic import command

test_db = Path("fresh_test.db")
if test_db.exists():
    try:
        test_db.unlink()
    except Exception:
        pass

cfg = Config("alembic.ini")
cfg.set_main_option("sqlalchemy.url", f"sqlite:///{test_db}")

print("=== 1. UPGRADE HEAD ===")
command.upgrade(cfg, "head")

print("\n=== 2. DOWNGRADE BASE ===")
command.downgrade(cfg, "base")

print("\n=== 3. UPGRADE HEAD (RE-APPLY) ===")
command.upgrade(cfg, "head")

print("\nCYCLE COMPLETED SUCCESSFULLY!")
if test_db.exists():
    try:
        test_db.unlink()
    except Exception:
        pass
