#!/usr/bin/env python3
"""
scripts/check_vectors.py - Mathematical Invariants Verification.
Verifies proved test vectors (Vector A, Vector B, and Delta) using pure domain logic.
"""

from decimal import Decimal
import sys
from pathlib import Path

# Ensure UTF-8 output encoding on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(BACKEND_DIR))

from backend.app.services.finance import (
    FinanceInputs,
    calculate_financials,
)


def verify_vectors():
    print("=" * 70)
    print("LAUNCHTWIN AI -- DETERMINISTIC MATHEMATICAL INVARIANTS CHECK")
    print("=" * 70)

    # 1. Vector A Verification
    assumptions_a = FinanceInputs(
        packaging_cost=Decimal("30.00"),
        selling_price=Decimal("500.00"),
        cogs_per_unit=Decimal("150.00"),
        shipping_cost_per_unit=Decimal("40.00"),
        payment_fee_fraction=Decimal("0.02"),
        fixed_costs_total=Decimal("50000.00"),
    )
    res_a = calculate_financials(assumptions_a)

    print("\n[VECTOR A: Initial Launch Baseline]")
    print("  Inputs: Selling Price = 500.00, COGS = 150.00, Packaging = 30.00, Shipping = 40.00, Fee = 2% (10.00), Fixed = 50000.00")
    print("  Calculated:")
    print(f"    Variable Cost Per Unit : {res_a.variable_cost_per_unit:.2f} (Expected: 230.00)")
    print(f"    Contribution Per Unit  : {res_a.contribution_per_unit:.2f} (Expected: 270.00)")
    print(f"    Contribution Margin    : {res_a.contribution_margin:.4f} ({res_a.contribution_margin * 100:.2f}%) (Expected: 0.5400 / 54.00%)")
    print(f"    Break-Even Volume      : {res_a.break_even_units} units (Expected: 186 units)")

    assert res_a.variable_cost_per_unit == Decimal("230.00"), f"Vector A variable cost mismatch: {res_a.variable_cost_per_unit}"
    assert res_a.contribution_per_unit == Decimal("270.00"), f"Vector A contribution mismatch: {res_a.contribution_per_unit}"
    assert res_a.contribution_margin == Decimal("0.5400"), f"Vector A margin mismatch: {res_a.contribution_margin}"
    assert res_a.break_even_units == 186, f"Vector A break-even mismatch: {res_a.break_even_units}"
    print("  Status: PASSED (All Vector A invariants mathematically verified)")

    # 2. Vector B Verification
    assumptions_b = FinanceInputs(
        packaging_cost=Decimal("60.00"),
        selling_price=Decimal("500.00"),
        cogs_per_unit=Decimal("150.00"),
        shipping_cost_per_unit=Decimal("40.00"),
        payment_fee_fraction=Decimal("0.02"),
        fixed_costs_total=Decimal("50000.00"),
    )
    res_b = calculate_financials(assumptions_b)

    print("\n[VECTOR B: Upgraded Packaging Assumption]")
    print("  Inputs: Packaging Cost upgraded to 60.00 (All other assumptions identical)")
    print("  Calculated:")
    print(f"    Variable Cost Per Unit : {res_b.variable_cost_per_unit:.2f} (Expected: 260.00)")
    print(f"    Contribution Per Unit  : {res_b.contribution_per_unit:.2f} (Expected: 240.00)")
    print(f"    Contribution Margin    : {res_b.contribution_margin:.4f} ({res_b.contribution_margin * 100:.2f}%) (Expected: 0.4800 / 48.00%)")
    print(f"    Break-Even Volume      : {res_b.break_even_units} units (Expected: 209 units)")

    assert res_b.variable_cost_per_unit == Decimal("260.00"), f"Vector B variable cost mismatch: {res_b.variable_cost_per_unit}"
    assert res_b.contribution_per_unit == Decimal("240.00"), f"Vector B contribution mismatch: {res_b.contribution_per_unit}"
    assert res_b.contribution_margin == Decimal("0.4800"), f"Vector B margin mismatch: {res_b.contribution_margin}"
    assert res_b.break_even_units == 209, f"Vector B break-even mismatch: {res_b.break_even_units}"
    print("  Status: PASSED (All Vector B invariants mathematically verified)")

    # 3. Delta Verification
    margin_delta = res_b.contribution_margin - res_a.contribution_margin
    be_delta = res_b.break_even_units - res_a.break_even_units

    print("\n[VERSION DELTA (Vector B vs Vector A)]")
    print(f"  Margin Delta     : {margin_delta:+.4f} ({margin_delta * 100:+.2f}%) (Expected: -0.0600 / -6.00%)")
    print(f"  Break-Even Delta : {be_delta:+d} units (Expected: +23 units)")

    assert margin_delta == Decimal("-0.0600"), f"Margin delta mismatch: {margin_delta}"
    assert be_delta == 23, f"Break-even delta mismatch: {be_delta}"
    print("  Status: PASSED (Version delta invariants verified)")

    print("\n" + "=" * 70)
    print("RESULT: ALL VECTOR INVARIANTS VERIFIED CLEANLY (EXIT CODE 0)")
    print("=" * 70)


if __name__ == "__main__":
    verify_vectors()
