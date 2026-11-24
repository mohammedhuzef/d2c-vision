import os
import sys

# Ensure Cython C-extensions in SQLAlchemy don't crash on Windows AppLocker environments
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

from pathlib import Path
import pytest
from starlette.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT))
sys.path.insert(0, str(REPO_ROOT / "backend"))

from alembic.config import Config
from alembic import command
from backend.app.core.config import settings
import backend.app.core.database as db_module
from backend.app.main import app

TEST_DB_FILE = REPO_ROOT / "test_suite.db"


@pytest.fixture(scope="session")
def setup_test_db():
    if TEST_DB_FILE.exists():
        try:
            TEST_DB_FILE.unlink()
        except Exception:
            pass

    test_db_url = os.environ.get("TEST_DATABASE_URL") or f"sqlite:///{TEST_DB_FILE}"
    os.environ["DATABASE_URL"] = test_db_url
    settings.DATABASE_URL = test_db_url

    # Run alembic migrations to apply all tables and triggers
    alembic_cfg = Config(str(REPO_ROOT / "alembic.ini"))
    alembic_cfg.set_main_option("sqlalchemy.url", test_db_url)
    command.upgrade(alembic_cfg, "head")

    connect_args = {}
    if "sqlite" in test_db_url:
        connect_args["check_same_thread"] = False

    engine = create_engine(test_db_url, connect_args=connect_args)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Rebind core database engine and SessionLocal so /health hits test db
    db_module.engine = engine
    db_module.SessionLocal = TestingSessionLocal

    yield engine, TestingSessionLocal

    engine.dispose()
    if TEST_DB_FILE.exists():
        try:
            TEST_DB_FILE.unlink()
        except Exception:
            pass


@pytest.fixture
def db_session(setup_test_db):
    engine, TestingSessionLocal = setup_test_db
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def client(setup_test_db):
    engine, TestingSessionLocal = setup_test_db

    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[db_module.get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
