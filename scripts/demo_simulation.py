"""Demonstration script: Simulating Vector A with a price change.

Shows baseline vs simulated stage statuses, scores, financial margin, and readiness.
"""

from decimal import Decimal
import json
import sys
from pathlib import Path

# Add backend and root to sys.path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))
sys.path.insert(0, str(root_dir / "backend"))

from backend.app.schemas.assumptions import (
    Assumptions,
    CustomerAssumptions,
    ProductAssumptions,
    PackagingAssumptions,
    PricingAssumptions,
    CostsAssumptions,
    MarketingAssumptions,
)
from backend.app.services.validation.simulation import simulate


def run_demo():
    # 1. Healthy Vector A baseline
    vector_a = Assumptions(
        customer=CustomerAssumptions(
            target_customer="Coffee Lovers",
            problem_statement="Drinks get lukewarm",
            customer_interviews_count=10,
        ),
        product=ProductAssumptions(
            unique_selling_points=["Double-wall ceramic"],
            differentiation_vs_competitors="Sleek form factor",
        ),
        packaging=PackagingAssumptions(
            material="Recycled Kraft",
            packaging_cost=Decimal("30.00"),
        ),
        pricing=PricingAssumptions(
            selling_price=Decimal("500.00"),
            target_margin_fraction=Decimal("0.40"),
        ),
        costs=CostsAssumptions(
            cogs_per_unit=Decimal("150.00"),
            packaging_cost=Decimal("30.00"),
            shipping_cost_per_unit=Decimal("40.00"),
            payment_fee_fraction=Decimal("0.02"),
            fixed_costs_total=Decimal("50000.00"),
        ),
        marketing=MarketingAssumptions(
            channels=["Social"],
            expected_cac=Decimal("67.50"),
            monthly_budget=Decimal("5000.00"),
        ),
    )

    # 2. Simulate price reduction to $300.00 (below target margin)
    overrides = {"selling_price": "300.00"}
    res = simulate(vector_a, overrides)

    print("=" * 70)
    print("       WHAT-IF SIMULATION: VECTOR A WITH PRICE CHANGE ($500 -> $300)")
    print("=" * 70)
    print(f"{'Metric / Property':<30} | {'Baseline':<16} | {'Simulated':<16} | {'Delta':<8}")
    print("-" * 76)
    print(f"{'Readiness Label':<30} | {res.baseline.readiness.label:<16} | {res.simulated.readiness.label:<16} | {'-':<8}")
    print(f"{'Readiness Score':<30} | {str(res.baseline.readiness.score):<16} | {str(res.simulated.readiness.score):<16} | {str(res.deltas.get('readiness_score')):<8}")
    print(f"{'Contribution Margin':<30} | {str(res.baseline.metrics.margin_fraction):<16} | {str(res.simulated.metrics.margin_fraction):<16} | {str(res.deltas.get('margin_fraction')):<8}")
    print(f"{'Contribution Per Unit ($)':<30} | {str(res.baseline.metrics.contribution_per_unit):<16} | {str(res.simulated.metrics.contribution_per_unit):<16} | {str(res.deltas.get('contribution_per_unit')):<8}")
    print(f"{'Break-Even Units':<30} | {str(res.baseline.metrics.break_even_units):<16} | {str(res.simulated.metrics.break_even_units):<16} | {str(res.deltas.get('break_even_units')):<8}")
    print(f"{'CAC to Contribution Ratio':<30} | {str(res.baseline.metrics.cac_to_contribution_ratio):<16} | {str(res.simulated.metrics.cac_to_contribution_ratio):<16} | {str(res.deltas.get('cac_to_contribution_ratio')):<8}")
    print("-" * 76)
    print("STAGE BREAKDOWN (Status & Score):")
    for st, b_s in res.baseline.stages.items():
        s_s = res.simulated.stages[st]
        print(f"  Stage {st:<18}: Baseline {b_s.status} ({b_s.score}) -> Simulated {s_s.status} ({s_s.score})")
    print("-" * 76)
    print("RECORDED CHANGES:")
    for ch in res.changes:
        delta_str = f" (Delta: {ch.delta})" if ch.delta else ""
        print(f"  * {ch.field}: {ch.baseline} -> {ch.simulated}{delta_str}")
    print("=" * 70)


if __name__ == "__main__":
    run_demo()
