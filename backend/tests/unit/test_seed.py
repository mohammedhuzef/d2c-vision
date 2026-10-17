import pytest
from sqlalchemy import select
from backend.app.models.product import Product
from backend.app.models.validation import ValidationRun
from backend.app.models.report import Report
from scripts.seed import seed_database


def test_seed_database(monkeypatch, db_session):
    # Monkeypatch SessionLocal in seed.py to use test db_session
    class DummySessionLocal:
        def __call__(self):
            return db_session

    monkeypatch.setattr("scripts.seed.SessionLocal", DummySessionLocal())

    # Run seed
    prod_id = seed_database()
    assert prod_id is not None

    product = db_session.get(Product, prod_id)
    assert product is not None
    assert "TerraFlask" in product.name

    # Assert validation run was created
    val_run = db_session.scalar(
        select(ValidationRun).where(ValidationRun.product_id == prod_id)
    )
    assert val_run is not None
    assert len(val_run.results) == 6

    # Assert report was created
    rep = db_session.scalar(
        select(Report).where(Report.product_id == prod_id)
    )
    assert rep is not None
    assert "# Launch-Readiness Report: TerraFlask" in rep.markdown

    # Idempotent second run
    second_id = seed_database()
    assert second_id == prod_id
