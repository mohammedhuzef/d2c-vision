"""Integration tests asserting database-level immutability triggers and uniqueness constraints."""

import uuid
import pytest
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError, IntegrityError


def _fmt_id(val: uuid.UUID, dialect_name: str):
    return val.hex if dialect_name == "sqlite" else str(val)


def test_product_versions_immutability_triggers(db_session):
    """Raw SQL UPDATE and DELETE on product_versions must be rejected by database triggers."""
    dialect_name = db_session.bind.dialect.name
    prod_id = _fmt_id(uuid.uuid4(), dialect_name)
    ver_id = _fmt_id(uuid.uuid4(), dialect_name)

    # 1. Seed a product
    db_session.execute(
        text(
            "INSERT INTO products (id, name, current_version, status) "
            "VALUES (:id, 'ImmutabilityTestProduct', 1, 'draft')"
        ),
        {"id": prod_id},
    )

    # 2. Seed a version
    db_session.execute(
        text(
            "INSERT INTO product_versions (id, product_id, version_number, assumptions, change_summary) "
            "VALUES (:id, :product_id, 1, '{}', '{}')"
        ),
        {"id": ver_id, "product_id": prod_id},
    )
    db_session.commit()

    # 3. Raw SQL UPDATE must be rejected
    with pytest.raises(DBAPIError) as exc_update:
        db_session.execute(
            text("UPDATE product_versions SET created_by = 'unauthorized_edit' WHERE id = :id"),
            {"id": ver_id},
        )
        db_session.commit()
    db_session.rollback()
    assert "immutable" in str(exc_update.value).lower()

    # 4. Raw SQL DELETE must be rejected
    with pytest.raises(DBAPIError) as exc_delete:
        db_session.execute(
            text("DELETE FROM product_versions WHERE id = :id"),
            {"id": ver_id},
        )
        db_session.commit()
    db_session.rollback()
    assert "immutable" in str(exc_delete.value).lower()


def test_product_versions_uniqueness_constraint(db_session):
    """Inserting duplicate (product_id, version_number) must be rejected by UNIQUE constraint."""
    dialect_name = db_session.bind.dialect.name
    prod_id = _fmt_id(uuid.uuid4(), dialect_name)
    v1_id = _fmt_id(uuid.uuid4(), dialect_name)
    v2_id = _fmt_id(uuid.uuid4(), dialect_name)

    db_session.execute(
        text(
            "INSERT INTO products (id, name, current_version, status) "
            "VALUES (:id, 'VersionUniquenessTestProduct', 1, 'draft')"
        ),
        {"id": prod_id},
    )
    db_session.execute(
        text(
            "INSERT INTO product_versions (id, product_id, version_number, assumptions, change_summary) "
            "VALUES (:id, :product_id, 1, '{}', '{}')"
        ),
        {"id": v1_id, "product_id": prod_id},
    )
    db_session.commit()

    # Attempt to insert same product_id with same version_number=1
    with pytest.raises(IntegrityError):
        db_session.execute(
            text(
                "INSERT INTO product_versions (id, product_id, version_number, assumptions, change_summary) "
                "VALUES (:id, :product_id, 1, '{}', '{}')"
            ),
            {"id": v2_id, "product_id": prod_id},
        )
        db_session.commit()
    db_session.rollback()


def test_competitor_case_insensitive_name_uniqueness(db_session):
    """Inserting competitors with matching lower(name) for the same product must be rejected."""
    dialect_name = db_session.bind.dialect.name
    prod_id = _fmt_id(uuid.uuid4(), dialect_name)
    c1_id = _fmt_id(uuid.uuid4(), dialect_name)
    c2_id = _fmt_id(uuid.uuid4(), dialect_name)

    db_session.execute(
        text(
            "INSERT INTO products (id, name, current_version, status) "
            "VALUES (:id, 'CompetitorUniquenessTestProduct', 1, 'draft')"
        ),
        {"id": prod_id},
    )
    db_session.execute(
        text(
            "INSERT INTO competitors (id, product_id, name) "
            "VALUES (:id, :product_id, 'EcoBrand Prime')"
        ),
        {"id": c1_id, "product_id": prod_id},
    )
    db_session.commit()

    # Attempt to insert competitor with same lowercase name ('ecobrand prime')
    with pytest.raises(IntegrityError):
        db_session.execute(
            text(
                "INSERT INTO competitors (id, product_id, name) "
                "VALUES (:id, :product_id, 'ecobrand prime')"
            ),
            {"id": c2_id, "product_id": prod_id},
        )
        db_session.commit()
    db_session.rollback()
