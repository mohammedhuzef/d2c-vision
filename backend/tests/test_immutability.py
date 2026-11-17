import uuid
import pytest
from sqlalchemy import text
from backend.app.models.product import Product
from backend.app.models.version import ProductVersion
from backend.app.models.validation import ValidationRun


def test_db_trigger_product_versions_immutability(db_session):
    product_id = uuid.uuid4()
    version_id = uuid.uuid4()

    # Seed product
    p = Product(id=product_id, name="Immutability Test Product", current_version=1, status="draft")
    db_session.add(p)
    db_session.commit()

    # Insert product_version via raw SQL
    db_session.execute(
        text(
            "INSERT INTO product_versions (id, product_id, version_number, assumptions, change_summary, created_by) "
            "VALUES (:id, :p_id, 1, '{}', '{}', 'author1')"
        ),
        {"id": str(version_id), "p_id": str(product_id)},
    )
    db_session.commit()

    # Assert raw SQL UPDATE is rejected by database trigger
    with pytest.raises(Exception) as exc_update:
        db_session.execute(
            text("UPDATE product_versions SET created_by = 'modified' WHERE id = :id"),
            {"id": str(version_id)},
        )
        db_session.commit()
    db_session.rollback()
    assert "immutable" in str(exc_update.value).lower()

    # Assert raw SQL DELETE is rejected by database trigger
    with pytest.raises(Exception) as exc_delete:
        db_session.execute(
            text("DELETE FROM product_versions WHERE id = :id"),
            {"id": str(version_id)},
        )
        db_session.commit()
    db_session.rollback()
    assert "immutable" in str(exc_delete.value).lower()


def test_db_trigger_validation_runs_immutability(db_session):
    product_id = uuid.uuid4()
    version_id = uuid.uuid4()
    run_id = uuid.uuid4()

    # Seed product
    p = Product(id=product_id, name="Validation Immutability Test", current_version=1, status="draft")
    db_session.add(p)
    db_session.commit()

    # Insert product_version
    db_session.execute(
        text(
            "INSERT INTO product_versions (id, product_id, version_number, assumptions, change_summary, created_by) "
            "VALUES (:id, :p_id, 1, '{}', '{}', 'author1')"
        ),
        {"id": str(version_id), "p_id": str(product_id)},
    )
    db_session.commit()

    # Insert validation_run via raw SQL
    db_session.execute(
        text(
            "INSERT INTO validation_runs (id, product_id, version_id, trigger, status, stages_run, verdict, started_at) "
            "VALUES (:id, :p_id, :v_id, 'initial', 'COMPLETED', '[]', 'READY', CURRENT_TIMESTAMP)"
        ),
        {"id": str(run_id), "p_id": str(product_id), "v_id": str(version_id)},
    )
    db_session.commit()

    # Assert raw SQL UPDATE is rejected by database trigger
    with pytest.raises(Exception) as exc_update:
        db_session.execute(
            text("UPDATE validation_runs SET verdict = 'NOT_READY' WHERE id = :id"),
            {"id": str(run_id)},
        )
        db_session.commit()
    db_session.rollback()
    assert "immutable" in str(exc_update.value).lower()

    # Assert raw SQL DELETE is rejected by database trigger
    with pytest.raises(Exception) as exc_delete:
        db_session.execute(
            text("DELETE FROM validation_runs WHERE id = :id"),
            {"id": str(run_id)},
        )
        db_session.commit()
    db_session.rollback()
    assert "immutable" in str(exc_delete.value).lower()


def test_orm_guard_product_versions_immutability(db_session):
    product_id = uuid.uuid4()
    version_id = uuid.uuid4()

    p = Product(id=product_id, name="ORM Guard Product", current_version=1, status="draft")
    db_session.add(p)
    db_session.commit()

    pv = ProductVersion(
        id=version_id,
        product_id=product_id,
        version_number=1,
        assumptions={"test": 1},
        change_summary={},
        created_by="tester",
    )
    db_session.add(pv)
    db_session.commit()

    # Mutate through ORM
    pv.created_by = "mutated_via_orm"
    with pytest.raises(ValueError) as exc:
        db_session.commit()
    db_session.rollback()
    assert "immutable" in str(exc.value).lower()


def test_orm_guard_validation_runs_immutability(db_session):
    product_id = uuid.uuid4()
    version_id = uuid.uuid4()
    run_id = uuid.uuid4()

    p = Product(id=product_id, name="ORM Guard Run Product", current_version=1, status="draft")
    db_session.add(p)
    db_session.commit()

    pv = ProductVersion(
        id=version_id,
        product_id=product_id,
        version_number=1,
        assumptions={"test": 1},
        change_summary={},
        created_by="tester",
    )
    db_session.add(pv)
    db_session.commit()

    vr = ValidationRun(
        id=run_id,
        product_id=product_id,
        version_id=version_id,
        trigger="initial",
        status="COMPLETED",
        stages_run=[],
        verdict="READY",
    )
    db_session.add(vr)
    db_session.commit()

    # Mutate through ORM
    vr.verdict = "NOT_READY"
    with pytest.raises(ValueError) as exc:
        db_session.commit()
    db_session.rollback()
    assert "immutable" in str(exc.value).lower()

