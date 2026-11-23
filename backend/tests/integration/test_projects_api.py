"""Integration tests for /api/v1/projects endpoints."""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_create_and_get_project():
    payload = {
        "name": "Organic Hibiscus Berry Tonic",
        "category": "Beverages",
        "targetMarket": "India (Tier 1 Metros)",
        "sellingPrice": 149.0,
        "mfgCost": 38.0,
        "moq": 500,
        "marketingBudget": 50000.0,
        "description": "Botanical sparkling water infused with hibiscus and green tea extract.",
        "ingredients": "Organic hibiscus calyces, green tea, erythritol, carbonated water.",
        "targetAudience": "Urban wellness consumers aged 22-35.",
        "image": "/images/cat-beverages.jpg",
        "status": "In Progress",
        "viabilityScore": 84,
        "viabilityGrade": "Grade A",
        "report": {
            "demand": "+48% YoY",
            "searchVol": "142,000 / mo",
            "competition": "Medium-High",
            "compText": "Whitespace in clean-label botanical soda",
            "marginViability": "74% Gross Margin",
            "copackers": "18 Verified Bottlers in MH, KA & DL",
            "risks": ["Liquid shipping weight", "Requires FSSAI license"],
            "recommendations": ["Bundle in 4-packs", "Launch pre-order waitlist"],
        },
    }

    # 1. Create project
    res_create = client.post("/api/v1/projects", json=payload)
    assert res_create.status_code == 201
    created = res_create.json()
    assert created["id"].startswith("proj-")
    assert created["name"] == "Organic Hibiscus Berry Tonic"
    assert created["category"] == "Beverages"
    assert created["sellingPrice"] == 149.0
    assert created["mfgCost"] == 38.0
    assert created["margin"] == 74.5
    assert created["moq"] == 500
    assert created["viabilityScore"] == 84
    assert created["viabilityGrade"] == "Grade A"
    assert created["report"]["demand"] == "+48% YoY"
    assert created["createdAt"] is not None
    assert created["updatedAt"] is not None

    project_id = created["id"]

    # 2. Get project by ID
    res_get = client.get(f"/api/v1/projects/{project_id}")
    assert res_get.status_code == 200
    fetched = res_get.json()
    assert fetched["id"] == project_id
    assert fetched["name"] == payload["name"]
    assert fetched["ingredients"] == payload["ingredients"]
    assert fetched["report"]["competition"] == "Medium-High"

    # 3. List projects with filter
    res_list = client.get(f"/api/v1/projects?search=Hibiscus&category=Beverages")
    assert res_list.status_code == 200
    listed = res_list.json()
    assert listed["total"] >= 1
    assert any(p["id"] == project_id for p in listed["items"])

    # 4. Update project (PATCH)
    res_patch = client.patch(
        f"/api/v1/projects/{project_id}",
        json={"status": "Completed", "sellingPrice": 169.0},
    )
    assert res_patch.status_code == 200
    updated = res_patch.json()
    assert updated["status"] == "Completed"
    assert updated["sellingPrice"] == 169.0
    assert updated["margin"] == round(((169.0 - 38.0) / 169.0) * 100.0, 1)

    # 5. Delete project
    res_del = client.delete(f"/api/v1/projects/{project_id}")
    assert res_del.status_code == 204

    # 6. Verify 404 after deletion
    res_get_del = client.get(f"/api/v1/projects/{project_id}")
    assert res_get_del.status_code == 404
