"""Integration tests for the Influencers API endpoints."""

import json
from decimal import Decimal
import uuid
import pytest
from starlette.testclient import TestClient
import jsonschema

from backend.app.models.product import Product
from backend.app.models.version import ProductVersion
from backend.app.models.influencer import Influencer


@pytest.fixture
def openapi_spec():
    with open("contracts/openapi.json", "r", encoding="utf-8") as f:
        return json.load(f)


def validate_against_schema(data, schema_ref, openapi_spec):
    schema_name = schema_ref.split("/")[-1]
    schema = openapi_spec["components"]["schemas"][schema_name]
    resolver = jsonschema.RefResolver.from_schema(openapi_spec)
    jsonschema.validate(instance=data, schema=schema, resolver=resolver)


def test_influencer_crud_and_status(client: TestClient, db_session, openapi_spec):
    """Test creating an influencer, listing with filters, and updating status."""
    uid = uuid.uuid4().hex[:6]
    handle = f"@aarav.wellness_{uid}"
    payload = {
        "name": f"Aarav Wellness {uid}",
        "handle": handle,
        "avatar_url": "https://example.com/avatar.jpg",
        "platform": "instagram",
        "category": "Health Foods & Snacks",
        "bio": "Certified nutritionist and healthy snack advocate.",
        "location": "Mumbai, India",
        "follower_count": 45000,
        "follower_tier": "micro",
        "engagement_rate": 4.8,
        "avg_views": 22000,
        "avg_likes": 1800,
        "niche_tags": ["nutrition", "organic", "energy bars"],
        "audience_demographics": {"gender": "65% Female", "age": "21-34"},
        "estimated_cost_per_post": "18000.00",
        "deliverables_summary": "1x Dedicated Reel + 2x Stories",
        "sample_content_url": "https://instagram.com/p/sample123",
        "notes": "Strong candidate for snack launch",
    }

    # 1. POST /api/v1/influencers
    create_res = client.post("/api/v1/influencers", json=payload)
    assert create_res.status_code == 201
    created = create_res.json()
    validate_against_schema(created, "#/components/schemas/InfluencerResponse", openapi_spec)
    assert created["name"] == payload["name"]
    assert created["handle"] == handle
    inf_id = created["id"]

    # 2. GET /api/v1/influencers (no filter)
    list_res = client.get("/api/v1/influencers")
    assert list_res.status_code == 200
    list_data = list_res.json()
    validate_against_schema(list_data, "#/components/schemas/InfluencerListResponse", openapi_spec)
    assert list_data["total"] >= 1
    assert any(i["id"] == inf_id for i in list_data["items"])

    # 3. GET /api/v1/influencers with filters
    cat_res = client.get("/api/v1/influencers?category=Health%20Foods%20%26%20Snacks")
    assert cat_res.status_code == 200
    assert any(i["id"] == inf_id for i in cat_res.json()["items"])

    plat_res = client.get("/api/v1/influencers?platform=youtube")
    assert plat_res.status_code == 200
    assert not any(i["id"] == inf_id for i in plat_res.json()["items"])

    search_res = client.get(f"/api/v1/influencers?search={uid}")
    assert search_res.status_code == 200
    assert any(i["id"] == inf_id for i in search_res.json()["items"])

    # 4. PATCH /api/v1/influencers/{id}/status
    patch_payload = {
        "status": "shortlisted",
        "notes": "Sent sample kit via courier",
    }
    patch_res = client.patch(f"/api/v1/influencers/{inf_id}/status", json=patch_payload)
    assert patch_res.status_code == 200
    patched = patch_res.json()
    validate_against_schema(patched, "#/components/schemas/InfluencerResponse", openapi_spec)
    assert patched["status"] == "shortlisted"
    assert patched["notes"] == "Sent sample kit via courier"

    # 5. PATCH 404 for non-existent
    bad_id = str(uuid.uuid4())
    bad_patch = client.patch(f"/api/v1/influencers/{bad_id}/status", json={"status": "signed"})
    assert bad_patch.status_code == 404


def test_influencer_matching_custom_and_saved(client: TestClient, db_session, openapi_spec):
    """Test custom matching and saved product matching."""
    uid = uuid.uuid4().hex[:6]
    # Seed an influencer
    inf = Influencer(
        id=uuid.uuid4(),
        name=f"Rohan Runner {uid}",
        handle=f"@rohan.runs_{uid}",
        platform="instagram",
        category="Fitness & Sports Nutrition",
        follower_count=35000,
        follower_tier="micro",
        engagement_rate=5.5,
        avg_views=18000,
        avg_likes=1500,
        niche_tags=["marathon", "running", "hydration", "sports bottle"],
        audience_demographics={"gender": "50/50", "age": "25-40"},
        estimated_cost_per_post=Decimal("12000.00"),
        deliverables_summary="1x Dedicated Reel + 1x Carousel",
        status="discovered",
    )
    db_session.add(inf)

    # Seed a product with version
    prod = Product(
        id=uuid.uuid4(),
        name="HydraFlask Pro",
        category="Fitness & Sports Nutrition",
        target_market="Endurance runners and cyclists",
        description="Vacuum insulated sports bottle",
        status="draft",
    )
    db_session.add(prod)
    v = ProductVersion(
        id=uuid.uuid4(),
        product_id=prod.id,
        version_number=1,
        assumptions={
            "pricing": {"selling_price": 999.00},
            "marketing": {"expected_cac": 350.00},
            "customer": {"target_customer": "Endurance athletes"},
        },
    )
    db_session.add(v)
    db_session.commit()

    # 1. POST /api/v1/influencers/match-custom
    custom_payload = {
        "product_name": "HydraFlask Pro",
        "category": "Fitness & Sports Nutrition",
        "description": "Vacuum insulated sports bottle",
        "target_market": "Endurance runners",
        "selling_price": 999.00,
        "target_cac": 350.00,
        "marketing_budget": 50000.00,
        "platform_preference": "instagram",
    }
    match_custom_res = client.post("/api/v1/influencers/match-custom", json=custom_payload)
    assert match_custom_res.status_code == 200
    custom_data = match_custom_res.json()
    validate_against_schema(custom_data, "#/components/schemas/InfluencerMatchListResponse", openapi_spec)
    assert custom_data["total_matched"] >= 1
    first_match = custom_data["matches"][0]
    validate_against_schema(first_match, "#/components/schemas/InfluencerMatchResult", openapi_spec)
    assert "Rohan Runner" in first_match["influencer"]["name"]
    assert first_match["match_analytics"]["overall_match_score"] >= 70

    # 2. GET /api/v1/influencers/match/{product_id}
    saved_res = client.get(f"/api/v1/influencers/match/{prod.id}")
    assert saved_res.status_code == 200
    saved_data = saved_res.json()
    validate_against_schema(saved_data, "#/components/schemas/InfluencerMatchListResponse", openapi_spec)
    assert saved_data["product_id"] == str(prod.id)
    assert saved_data["total_matched"] >= 1

    # 3. GET /api/v1/influencers/match/{product_id} 404 for missing product
    bad_prod_id = str(uuid.uuid4())
    bad_res = client.get(f"/api/v1/influencers/match/{bad_prod_id}")
    assert bad_res.status_code == 404


def test_influencer_pitch_endpoint(client: TestClient, db_session, openapi_spec):
    """Test generating pitch copy with fallback/template."""
    uid = uuid.uuid4().hex[:6]
    inf = Influencer(
        id=uuid.uuid4(),
        name=f"Meera Beauty {uid}",
        handle=f"@meera.glow_{uid}",
        platform="youtube",
        category="Skincare & Clean Beauty",
        follower_count=60000,
        follower_tier="mid",
        engagement_rate=4.1,
        avg_views=30000,
        avg_likes=2500,
        niche_tags=["serums", "clean beauty"],
        estimated_cost_per_post=Decimal("25000.00"),
        deliverables_summary="1x Dedicated Video Review",
        status="discovered",
    )
    db_session.add(inf)
    db_session.commit()

    pitch_payload = {
        "influencer_id": str(inf.id),
        "custom_product": {
            "product_name": "GlowElixir",
            "category": "Skincare & Clean Beauty",
            "description": "Organic antioxidant facial serum",
            "target_market": "Skincare enthusiasts",
            "selling_price": 1499.00,
            "target_cac": 500.00,
        },
        "outreach_tone": "enthusiastic_founder",
    }

    res = client.post(f"/api/v1/influencers/{inf.id}/pitch", json=pitch_payload)
    assert res.status_code == 200
    pitch_data = res.json()
    validate_against_schema(pitch_data, "#/components/schemas/PitchResponse", openapi_spec)
    assert f"Meera Beauty {uid}" == pitch_data["influencer_name"]
    assert f"@meera.glow_{uid}" == pitch_data["influencer_handle"]
    assert "GlowElixir" in pitch_data["dm_template"]
    assert "GlowElixir" in pitch_data["email_template"]
    assert len(pitch_data["subject_lines"]) >= 3
    assert len(pitch_data["key_talking_points"]) >= 3

    # 404 for missing influencer
    bad_inf_id = str(uuid.uuid4())
    bad_pitch_payload = {
        "influencer_id": bad_inf_id,
    }
    bad_res = client.post(f"/api/v1/influencers/{bad_inf_id}/pitch", json=bad_pitch_payload)
    assert bad_res.status_code == 404
