import uuid
import pytest


def test_create_product_success(client):
    payload = {
        "name": "EcoSip Flask",
        "description": "Sustainable insulated flask",
        "category": "Drinkware",
        "target_market": "Urban commuters",
        "assumptions": {
            "pricing": {
                "selling_price": 45.00,
                "currency": "USD",
                "target_margin_fraction": 0.50
            }
        }
    }
    response = client.post("/api/v1/products", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "EcoSip Flask"
    assert data["current_version"] == 1
    assert data["status"] == "draft"
    assert "id" in data

    product_id = data["id"]
    # Check detail endpoint
    detail_res = client.get(f"/api/v1/products/{product_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["assumptions"]["pricing"]["selling_price"] == 45.00
    assert len(detail["stage_statuses"]) == 6
    assert all(st == "NOT_RUN" for st in detail["stage_statuses"].values())


def test_create_product_without_assumptions(client):
    res = client.post("/api/v1/products", json={"name": "Barebones Product"})
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Barebones Product"
    assert data["current_version"] == 1

    detail = client.get(f"/api/v1/products/{data['id']}").json()
    assert detail["current_version"] == 1
    assert detail["assumptions"] is not None
    assert len(detail["stage_statuses"]) == 6
    assert all(st == "NOT_RUN" for st in detail["stage_statuses"].values())


def test_list_products_pagination(client):
    # Create products
    client.post("/api/v1/products", json={"name": "Paginated A"})
    client.post("/api/v1/products", json={"name": "Paginated B"})
    client.post("/api/v1/products", json={"name": "Paginated C"})

    # Page 1
    p1 = client.get("/api/v1/products?limit=2&offset=0")
    assert p1.status_code == 200
    d1 = p1.json()
    assert d1["limit"] == 2
    assert d1["offset"] == 0
    assert d1["total"] >= 3
    assert len(d1["items"]) == 2

    # Page 2
    p2 = client.get("/api/v1/products?limit=2&offset=2")
    assert p2.status_code == 200
    d2 = p2.json()
    assert len(d2["items"]) >= 1


def test_create_product_blank_name_rejected(client):
    res = client.post("/api/v1/products", json={"name": "   "})
    assert res.status_code == 422
    err = res.json()["error"]
    assert err["code"] == "VALIDATION_ERROR"
    assert any("name" in d["field"] for d in err["details"])


def test_create_product_unknown_fields_rejected(client):
    payload = {
        "name": "Bad Product",
        "assumptions": {
            "pricing": {
                "selling_price": 50.0,
                "unknown_nonexistent_field": 123
            }
        }
    }
    response = client.post("/api/v1/products", json=payload)
    assert response.status_code == 422
    err = response.json()["error"]
    assert err["code"] == "VALIDATION_ERROR"
    assert any("unknown_nonexistent_field" in d["field"] for d in err["details"])


def test_create_product_negative_selling_price(client):
    payload = {
        "name": "Negative Pricing",
        "assumptions": {
            "pricing": {
                "selling_price": -25.00
            }
        }
    }
    res = client.post("/api/v1/products", json=payload)
    assert res.status_code == 422
    err = res.json()["error"]
    assert err["code"] == "VALIDATION_ERROR"
    assert any(d["field"] == "assumptions.pricing.selling_price" for d in err["details"])


def test_create_product_packaging_cost_mismatch(client):
    payload = {
        "name": "Cost Mismatch",
        "assumptions": {
            "packaging": {
                "packaging_cost": 50.00
            },
            "costs": {
                "packaging_cost": 25.00
            }
        }
    }
    res = client.post("/api/v1/products", json=payload)
    assert res.status_code == 422
    err = res.json()["error"]
    assert err["code"] == "VALIDATION_ERROR"
    assert any("packaging.packaging_cost" in d["field"] or "costs.packaging_cost" in d["field"] or "assumptions" in d["field"] for d in err["details"])


def test_get_product_not_found(client):
    random_id = str(uuid.uuid4())
    response = client.get(f"/api/v1/products/{random_id}")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_get_product_bad_uuid_rejected(client):
    response = client.get("/api/v1/products/not-a-valid-uuid")
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_competitor_crud_and_deduplication(client):
    prod_res = client.post("/api/v1/products", json={"name": "Tumbler Pro"})
    product_id = prod_res.json()["id"]

    # 1. Add valid competitors
    comp_payload = {
        "competitors": [
            {"name": "Yeti", "website_url": "https://yeti.com"},
            {"name": "Stanley", "website_url": "https://stanley.com"}
        ]
    }
    res = client.post(f"/api/v1/products/{product_id}/competitors", json=comp_payload)
    assert res.status_code == 201
    items = res.json()["items"]
    assert len(items) == 2
    names = [i["name"] for i in items]
    assert "Yeti" in names
    assert "Stanley" in names

    # 2. Duplicate in payload
    dup_payload = {
        "competitors": [
            {"name": "Hydro Flask"},
            {"name": "hydro flask"}
        ]
    }
    res_dup = client.post(f"/api/v1/products/{product_id}/competitors", json=dup_payload)
    assert res_dup.status_code == 409
    assert res_dup.json()["error"]["code"] == "CONFLICT"

    # 3. Duplicate against existing database entry (case-insensitive)
    existing_dup_payload = {
        "competitors": [
            {"name": "yEtI"}
        ]
    }
    res_exist = client.post(f"/api/v1/products/{product_id}/competitors", json=existing_dup_payload)
    assert res_exist.status_code == 409
    assert res_exist.json()["error"]["code"] == "CONFLICT"

    # 4. List competitors
    list_res = client.get(f"/api/v1/products/{product_id}/competitors")
    assert list_res.status_code == 200
    assert len(list_res.json()["items"]) == 2


def test_competitor_blank_name_and_empty_list_rejected(client):
    prod = client.post("/api/v1/products", json={"name": "Comp Validation Prod"}).json()
    product_id = prod["id"]

    # Empty list
    res_empty = client.post(f"/api/v1/products/{product_id}/competitors", json={"competitors": []})
    assert res_empty.status_code == 422
    assert res_empty.json()["error"]["code"] == "VALIDATION_ERROR"

    # Blank name
    res_blank = client.post(f"/api/v1/products/{product_id}/competitors", json={"competitors": [{"name": "   "}]})
    assert res_blank.status_code == 422
    assert res_blank.json()["error"]["code"] == "VALIDATION_ERROR"


@pytest.mark.postgres
def test_product_versions_immutability_trigger(client, db_session):
    from sqlalchemy import select
    from backend.app.models.version import ProductVersion

    prod = client.post("/api/v1/products", json={"name": "Immutable Prod PG"}).json()
    prod_id = uuid.UUID(prod["id"])
    version = db_session.scalar(select(ProductVersion).where(ProductVersion.product_id == prod_id))
    assert version is not None

    # Attempt to update ProductVersion -> must be blocked
    with pytest.raises(Exception):
        version.version_number = 999
        db_session.flush()

    db_session.rollback()

    version2 = db_session.scalar(select(ProductVersion).where(ProductVersion.product_id == prod_id))
    # Attempt to delete ProductVersion -> must be blocked
    with pytest.raises(Exception):
        db_session.delete(version2)
        db_session.flush()


def test_sqlite_immutability_trigger(client, db_session):
    from sqlalchemy import select
    from backend.app.models.version import ProductVersion

    prod = client.post("/api/v1/products", json={"name": "Immutable Prod SQLite"}).json()
    prod_id = uuid.UUID(prod["id"])
    version = db_session.scalar(select(ProductVersion).where(ProductVersion.product_id == prod_id))
    assert version is not None

    # Attempt to update ProductVersion -> must be blocked
    with pytest.raises(Exception):
        version.version_number = 999
        db_session.flush()

    db_session.rollback()

    version2 = db_session.scalar(select(ProductVersion).where(ProductVersion.product_id == prod_id))
    # Attempt to delete ProductVersion -> must be blocked
    with pytest.raises(Exception):
        db_session.delete(version2)
        db_session.flush()


def test_migration_upgrade_and_downgrade_round_trip():
    from pathlib import Path
    from sqlalchemy import create_engine
    from alembic.config import Config
    from alembic import command

    root_dir = Path(__file__).resolve().parent.parent.parent.parent
    alembic_cfg = Config(str(root_dir / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(root_dir / "backend" / "alembic"))

    temp_engine = create_engine("sqlite:///:memory:")
    with temp_engine.begin() as conn:
        alembic_cfg.attributes["connection"] = conn
        command.upgrade(alembic_cfg, "head")
        command.downgrade(alembic_cfg, "base")
        command.upgrade(alembic_cfg, "head")

