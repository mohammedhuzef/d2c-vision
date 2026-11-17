"""Execution script for running validation pipeline on Vector A.

Runs the full validation pipeline on Vector A assumptions
with 2 benchmark competitors ($450 and $550),
prints all stage outcomes, scores, metrics, findings, and overall launch readiness.
"""

import json
from pathlib import Path
import sys

# Ensure repository root is on sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from backend.app.services.readiness import calculate_readiness
from backend.app.services.validation.pipeline import run_pipeline
from backend.app.services.validation.rules_config import STAGE_ORDER


def get_vector_a_assumptions() -> dict:
    """Returns canonical Vector A assumptions."""
    root_dir = Path(__file__).resolve().parent.parent
    example_path = root_dir / "contracts" / "examples" / "post_products.json"
    if example_path.exists():
        with open(example_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        assumptions = data["request"]["assumptions"]
    else:
        assumptions = {}

    # Set canonical Vector A inputs
    assumptions.setdefault("customer", {})
    assumptions["customer"]["target_customer"] = "Millennials and Gen Z commuters seeking plastic-free drinkware"
    assumptions["customer"]["problem_statement"] = "Single-use cups create waste and standard reusable mugs leak"
    assumptions["customer"]["customer_interviews_count"] = 10
    assumptions["customer"]["segment_size_estimate"] = "12M addressable urban commuters"
    assumptions["customer"]["willingness_to_pay_signal"] = "Strong interest at $450-550 range"

    assumptions.setdefault("product", {})
    assumptions["product"]["differentiation_vs_competitors"] = (
        "Proprietary double-walled vacuum insulation with certified carbon-neutral lifecycle"
    )

    assumptions.setdefault("packaging", {})
    assumptions["packaging"]["material"] = "Recycled kraft paper cylinder with soy ink printing"
    assumptions["packaging"]["packaging_cost"] = "30.00"

    assumptions.setdefault("pricing", {})
    assumptions["pricing"]["selling_price"] = "500.00"
    assumptions["pricing"]["target_margin_fraction"] = "0.40"

    assumptions.setdefault("costs", {})
    assumptions["costs"]["cogs_per_unit"] = "150.00"
    assumptions["costs"]["packaging_cost"] = "30.00"
    assumptions["costs"]["shipping_cost_per_unit"] = "40.00"
    assumptions["costs"]["payment_fee_fraction"] = "0.02"
    assumptions["costs"]["payment_fee_fixed"] = "0.00"
    assumptions["costs"]["platform_fee_fraction"] = "0.00"
    assumptions["costs"]["other_variable_cost_per_unit"] = "0.00"
    assumptions["costs"]["fixed_costs_total"] = "50000.00"

    assumptions.setdefault("marketing", {})
    assumptions["marketing"]["channels"] = ["Instagram Reels", "TikTok Micro-influencers", "Corporate gifting"]
    assumptions["marketing"]["expected_cac"] = "60.00"

    return assumptions


def main() -> None:
    # 1. Load Vector A assumptions
    assumptions = get_vector_a_assumptions()

    # 2. Benchmark competitors: $450 and $550, each with 1 verified evidence item
    competitor_analyses = [
        {
            "id": "comp-analysis-1",
            "competitor_id": "comp-1",
            "name": "Apex Tumbler",
            "price_observed": "450.00",
            "evidence_ids": ["ev-1"],
        },
        {
            "id": "comp-analysis-2",
            "competitor_id": "comp-2",
            "name": "Vessel Pro",
            "price_observed": "550.00",
            "evidence_ids": ["ev-2"],
        },
    ]

    evidence = [
        {
            "id": "ev-1",
            "competitor_id": "comp-1",
            "evidence_type": "pricing",
            "verified": True,
        },
        {
            "id": "ev-2",
            "competitor_id": "comp-2",
            "evidence_type": "pricing",
            "verified": True,
        },
    ]

    print("================================================================================")
    print("INPUTS PASSED:")
    print(f"  Selling Price: {assumptions['pricing']['selling_price']}")
    print(f"  Competitor Prices: 450.00, 550.00")
    print(f"  Customer Interviews Count: {assumptions['customer']['customer_interviews_count']}")
    print(f"  Product Differentiation: {assumptions['product']['differentiation_vs_competitors']}")
    print(f"  Expected CAC: {assumptions['marketing']['expected_cac']}")
    print("================================================================================")
    print("LAUNCHTWIN AI VALIDATION PIPELINE -- VECTOR A")
    print("================================================================================")

    # 3. Execute validation pipeline
    stage_results = run_pipeline(assumptions, evidence, competitor_analyses)

    for stage_name in STAGE_ORDER:
        res = stage_results.get(stage_name)
        if not res:
            continue
        print(f"\nSTAGE: {stage_name.upper()}")
        print(f"  Status : {res.status.value}")
        print(f"  Score  : {res.score}")
        print(f"  Metrics: {res.metrics}")
        if res.findings:
            print("  Findings:")
            for f in res.findings:
                print(f"    - [{f.severity.value.upper()}] {f.code}: {f.message}")

    # 4. Calculate Launch Readiness
    readiness = calculate_readiness(stage_results)
    print("\n================================================================================")
    print("LAUNCH READINESS AGGREGATION")
    print("================================================================================")
    print(f"  Overall Score  : {readiness.overall_score}")
    print(f"  Readiness Label: {readiness.label}")
    print(f"  Warning Stages : {list(readiness.warning_stages)}")
    print(f"  Blocking Stages: {list(readiness.blocking_stages)}")
    print(f"  Missing Stages : {list(readiness.missing_stages)}")
    print("================================================================================")


if __name__ == "__main__":
    main()
