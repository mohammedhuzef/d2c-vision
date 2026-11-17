import logging
import os
from typing import Generator

os.environ.setdefault("DISABLE_SQLALCHEMY_CEXT", "1")

from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL
connect_args = {}
if "postgresql" in db_url:
    connect_args["connect_timeout"] = 2
else:
    connect_args["check_same_thread"] = False

engine = create_engine(
    db_url,
    echo=False,
    pool_pre_ping=True if "postgresql" in db_url else False,
    connect_args=connect_args,
)

# Test connection on startup; if PostgreSQL is down/unreachable, gracefully fall back to SQLite
try:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
except Exception as exc:
    if "postgresql" in db_url:
        logger.warning(
            "PostgreSQL at %s is unreachable (%s). Falling back to sqlite:///./launchtwin.db for local execution.",
            db_url,
            exc,
        )
        db_url = "sqlite:///./launchtwin.db"
        engine = create_engine(db_url, connect_args={"check_same_thread": False, "timeout": 30})

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

