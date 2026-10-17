import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.core.database import Base, get_db
from backend.app.main import app

# Fast SQLite default, or real PostgreSQL if TEST_DATABASE_URL is set
ENV_DB_URL = os.environ.get("TEST_DATABASE_URL")
if ENV_DB_URL:
    TEST_DATABASE_URL = ENV_DB_URL
    IS_POSTGRES = "postgres" in TEST_DATABASE_URL or "psycopg" in TEST_DATABASE_URL
    test_engine = create_engine(TEST_DATABASE_URL, pool_pre_ping=True)
else:
    TEST_DATABASE_URL = "sqlite:///:memory:"
    IS_POSTGRES = False
    test_engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def pytest_collection_modifyitems(config, items):
    if not IS_POSTGRES:
        skip_pg = pytest.mark.skip(
            reason="Requires real PostgreSQL (TEST_DATABASE_URL not set to a Postgres URL)"
        )
        for item in items:
            if "postgres" in item.keywords:
                item.add_marker(skip_pg)


from pathlib import Path
from alembic.config import Config
from alembic import command


ROOT_DIR = Path(__file__).resolve().parent.parent.parent


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    alembic_cfg = Config(str(ROOT_DIR / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(ROOT_DIR / "backend" / "alembic"))
    with test_engine.begin() as conn:
        alembic_cfg.attributes["connection"] = conn
        command.upgrade(alembic_cfg, "head")
    yield
    with test_engine.begin() as conn:
        alembic_cfg.attributes["connection"] = conn
        command.downgrade(alembic_cfg, "base")


@pytest.fixture
def db_session():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    if transaction.is_active:
        transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()
