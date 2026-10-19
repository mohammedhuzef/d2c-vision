import threading
import uuid
from decimal import Decimal
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from backend.app.core.database import get_db
from backend.app.main import app
from backend.app.models.product import Product
from backend.app.models.version import ProductVersion
from backend.app.models.competitor import Competitor
from backend.app.models.analysis import CompetitorAnalysis
from backend.tests.conftest import TestingSessionLocal


@pytest.mark.postgres
def test_concurrent_assumptions_patch():
    """
    Two threads patching the same product at the same time must produce
    versions 2 and 3 sequentially with SELECT ... FOR UPDATE, never a collision.
    """
    def thread_safe_get_db():
        db = TestingSessionLocal()
        try:
            yield db
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    app.dependency_overrides[get_db] = thread_safe_get_db
    try:
        with TestClient(app, raise_server_exceptions=True) as client:
            # 1. Create a product (version 1)
            create_res = client.post(
                "/api/v1/products",
                json={
                    "name": f"Concurrent Product {uuid.uuid4().hex[:8]}",
                    "assumptions": {
                        "pricing": {"selling_price": 100.00},
                        "costs": {"cogs_per_unit": 40.00, "shipping_cost_per_unit": 10.00, "fixed_costs_total": 5000.00},
                        "packaging": {"packaging_cost": 5.00},
                    },
                },
            )
            assert create_res.status_code == 201
            product_id = create_res.json()["id"]

            results = []
            barrier = threading.Barrier(2)

            def patch_worker(patch_data):
                barrier.wait()
                res = client.patch(
                    f"/api/v1/products/{product_id}/assumptions",
                    json={"patch": patch_data, "revalidate": False},
                )
                results.append(res)

            patch_1 = {"pricing": {"selling_price": 120.00}}
            patch_2 = {"costs": {"cogs_per_unit": 45.00}}

            t1 = threading.Thread(target=patch_worker, args=(patch_1,))
            t2 = threading.Thread(target=patch_worker, args=(patch_2,))

            t1.start()
            t2.start()
            t1.join()
            t2.join()

            assert len(results) == 2
            assert all(r.status_code == 200 for r in results), [r.text for r in results]

            versions_created = {r.json()["new_version"] for r in results}
            assert versions_created == {2, 3}, f"Expected versions {{2, 3}}, got {versions_created}"

            # Verify in database
            db = TestingSessionLocal()
            try:
                prod = db.get(Product, uuid.UUID(product_id))
                assert prod is not None
                assert prod.current_version == 3

                versions = db.scalars(
                    select(ProductVersion)
                    .where(ProductVersion.product_id == prod.id)
                    .order_by(ProductVersion.version_number.asc())
                ).all()
                assert [v.version_number for v in versions] == [1, 2, 3]
            finally:
                db.close()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.postgres
def test_postgres_functional_unique_index_lower_name():
    """
    Functional unique index on competitors (product_id, lower(name)) in PostgreSQL
    must raise IntegrityError on case-insensitive duplicate competitor names.
    """
    db = TestingSessionLocal()
    try:
        prod = Product(id=uuid.uuid4(), name=f"Unique Index Prod {uuid.uuid4().hex[:6]}")
        db.add(prod)
        db.commit()

        c1 = Competitor(id=uuid.uuid4(), product_id=prod.id, name="Acme Brands")
        db.add(c1)
        db.commit()

        # Same competitor name with different casing for the same product
        c2 = Competitor(id=uuid.uuid4(), product_id=prod.id, name="aCmE bRaNdS")
        db.add(c2)
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()
    finally:
        db.close()


@pytest.mark.postgres
def test_postgres_uuid_array_and_jsonb_behavior():
    """
    Validates PostgreSQL native UUID[] array and JSONB storage and query semantics.
    """
    db = TestingSessionLocal()
    try:
        prod = Product(id=uuid.uuid4(), name=f"Array Test Prod {uuid.uuid4().hex[:6]}")
        db.add(prod)
        db.commit()

        u1, u2 = uuid.uuid4(), uuid.uuid4()
        analysis = CompetitorAnalysis(
            id=uuid.uuid4(),
            product_id=prod.id,
            competitor_id=None,
            strengths=["eco-friendly", "durable"],
            weaknesses=["high price"],
            evidence_ids=[u1, u2],
            data={"metadata": {"verified": True, "score": 9.5}, "tags": ["premium", "b2c"]},
        )
        db.add(analysis)
        db.commit()

        saved = db.get(CompetitorAnalysis, analysis.id)
        assert saved is not None
        assert saved.evidence_ids == [u1, u2]
        assert saved.data["metadata"]["verified"] is True
        assert saved.data["metadata"]["score"] == 9.5
    finally:
        db.close()


@pytest.mark.postgres
def test_postgres_immutability_trigger():
    """
    Validates PostgreSQL PL/pgSQL immutability trigger raises exception on mutation.
    """
    db = TestingSessionLocal()
    try:
        prod = Product(id=uuid.uuid4(), name=f"Trigger Test Prod {uuid.uuid4().hex[:6]}")
        db.add(prod)
        db.commit()

        version = ProductVersion(
            id=uuid.uuid4(),
            product_id=prod.id,
            version_number=1,
            assumptions={"pricing": {"selling_price": 50.0}},
            change_summary={},
        )
        db.add(version)
        db.commit()

        # Update must be rejected by trigger
        version.version_number = 2
        with pytest.raises(Exception):
            db.commit()
        db.rollback()

        # Delete must be rejected by trigger
        v_reload = db.get(ProductVersion, version.id)
        db.delete(v_reload)
        with pytest.raises(Exception):
            db.commit()
        db.rollback()
    finally:
        db.close()
