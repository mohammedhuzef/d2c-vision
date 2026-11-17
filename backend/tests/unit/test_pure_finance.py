"""Unit tests for the pure Python finance engine.

Tests:
- Vector A and Vector B
- Contract example post_products.json with hand-checked arithmetic
- Packaging cost resolution (packaging.packaging_cost authority vs costs.packaging_cost fallback vs mismatch finding)
- Zero and negative contribution handling (break_even_units is None)
- Missing input handling (metrics None, Issue emitted)
- ROUND_HALF_UP rounding verification
- Frozen dataclass immutability
"""

from decimal import Decimal
import pytest

from backend.app.services.finance import (
    calculate_break_even_units,
    calculate_contribution_margin,
    calculate_contribution_per_unit,
    calculate_financials,
    calculate_sensitivity,
    calculate_variable_cost,
    from_assumptions,
    resolve_packaging_cost,
    round_margin,
    round_money,
    to_decimal,
    FinanceInputs,
    FinancialResult,
    Issue,
)
from backend.app.services.validation.base import Finding, Severity


def test_vector_a():
    """VECTOR A: price 500, cogs 150, packaging 30, shipping 40, fee 0.02, fixed 50000
    -> 230.00 / 270.00 / 0.5400 / 186.
    """
    inputs = FinanceInputs(
        selling_price=Decimal("500"),
        cogs_per_unit=Decimal("150"),
        packaging_cost=Decimal("30"),
        shipping_cost_per_unit=Decimal("40"),
        payment_fee_fraction=Decimal("0.02"),
        fixed_costs_total=Decimal("50000"),
    )
    res = calculate_financials(inputs)

    assert not res.issues
    assert res.variable_cost_per_unit == Decimal("230.00")
    assert res.contribution_per_unit == Decimal("270.00")
    assert res.contribution_margin == Decimal("0.5400")
    assert res.break_even_units == 186


def test_vector_b():
    """VECTOR B: same as Vector A but packaging 60
    -> 260.00 / 240.00 / 0.4800 / 209.
    """
    inputs = FinanceInputs(
        selling_price=Decimal("500"),
        cogs_per_unit=Decimal("150"),
        packaging_cost=Decimal("60"),
        shipping_cost_per_unit=Decimal("40"),
        payment_fee_fraction=Decimal("0.02"),
        fixed_costs_total=Decimal("50000"),
    )
    res = calculate_financials(inputs)

    assert not res.issues
    assert res.variable_cost_per_unit == Decimal("260.00")
    assert res.contribution_per_unit == Decimal("240.00")
    assert res.contribution_margin == Decimal("0.4800")
    assert res.break_even_units == 209


def test_contract_example_post_products_costs_with_other_variable():
    """Contract example post_products.json costs (including other_variable_cost_per_unit = 0.50):
    Inputs:
      selling_price = 32.00
      cogs_per_unit = 9.50
      packaging_cost = 3.50
      shipping_cost_per_unit = 4.20
      payment_fee_fixed = 0.30
      payment_fee_fraction = 0.02
      platform_fee_fraction = 0.00
      other_variable_cost_per_unit = 0.50
      fixed_costs_total = 15000.00

    Hand-checked Arithmetic Proof:
      Variable Cost:
        cogs (9.50) + packaging (3.50) + shipping (4.20) + other_var (0.50) + payment_fee_fixed (0.30)
        + pct_fees (0.02 * 32.00 = 0.64)
        = 18.64 (rounded to 2 dp first)
      Contribution per unit:
        32.00 - 18.64 = 13.36 (2 dp)
      Contribution margin fraction:
        13.36 / 32.00 = 0.4175 (4 dp ROUND_HALF_UP)
      Break-even units:
        ceil(15000.00 / 13.36) = ceil(1122.754491...) = 1123
    """
    inputs = FinanceInputs(
        selling_price=Decimal("32.00"),
        cogs_per_unit=Decimal("9.50"),
        packaging_cost=Decimal("3.50"),
        shipping_cost_per_unit=Decimal("4.20"),
        payment_fee_fixed=Decimal("0.30"),
        payment_fee_fraction=Decimal("0.02"),
        platform_fee_fraction=Decimal("0.00"),
        other_variable_cost_per_unit=Decimal("0.50"),
        fixed_costs_total=Decimal("15000.00"),
    )
    res = calculate_financials(inputs)

    assert not res.issues
    assert res.variable_cost_per_unit == Decimal("18.64")
    assert res.contribution_per_unit == Decimal("13.36")
    assert res.contribution_margin == Decimal("0.4175")
    assert res.break_even_units == 1123


def test_contract_example_post_products_zero_other_variable():
    """Contract example post_products.json costs when other_variable_cost_per_unit = 0.00:
    Inputs:
      selling_price = 32.00
      cogs_per_unit = 9.50
      packaging_cost = 3.50
      shipping_cost_per_unit = 4.20
      payment_fee_fixed = 0.30
      payment_fee_fraction = 0.02
      platform_fee_fraction = 0.00
      other_variable_cost_per_unit = 0.00
      fixed_costs_total = 15000.00

    Hand-checked Arithmetic Proof:
      Variable Cost: 9.50 + 3.50 + 4.20 + 0.30 + 0.64 = 18.14
      Contribution: 32.00 - 18.14 = 13.86
      Margin: 13.86 / 32.00 = 0.433125 -> 0.4331
      Break-even: ceil(15000.00 / 13.86) = 1083
    """
    inputs = FinanceInputs(
        selling_price=Decimal("32.00"),
        cogs_per_unit=Decimal("9.50"),
        packaging_cost=Decimal("3.50"),
        shipping_cost_per_unit=Decimal("4.20"),
        payment_fee_fixed=Decimal("0.30"),
        payment_fee_fraction=Decimal("0.02"),
        platform_fee_fraction=Decimal("0.00"),
        other_variable_cost_per_unit=Decimal("0.00"),
        fixed_costs_total=Decimal("15000.00"),
    )
    res = calculate_financials(inputs)

    assert not res.issues
    assert res.variable_cost_per_unit == Decimal("18.14")
    assert res.contribution_per_unit == Decimal("13.86")
    assert res.contribution_margin == Decimal("0.4331")
    assert res.break_even_units == 1083


def test_each_cost_field_changes_variable_cost():
    """Proves that changing each cost field independently changes the variable cost result."""
    base = FinanceInputs(
        selling_price=Decimal("100.00"),
        cogs_per_unit=Decimal("30.00"),
        packaging_cost=Decimal("10.00"),
        shipping_cost_per_unit=Decimal("8.00"),
        other_variable_cost_per_unit=Decimal("2.00"),
        payment_fee_fixed=Decimal("1.00"),
        payment_fee_fraction=Decimal("0.02"),
        platform_fee_fraction=Decimal("0.01"),
        fixed_costs_total=Decimal("5000.00"),
    )
    base_res = calculate_financials(base)
    # var_cost = 30 + 10 + 8 + 2 + 1 + ((0.02 + 0.01) * 100 = 3) = 54.00
    assert base_res.variable_cost_per_unit == Decimal("54.00")

    # 1. cogs
    res_cogs = calculate_financials(FinanceInputs(**{**base.__dict__, "cogs_per_unit": Decimal("35.00")}))
    assert res_cogs.variable_cost_per_unit != base_res.variable_cost_per_unit
    assert res_cogs.variable_cost_per_unit == Decimal("59.00")

    # 2. packaging
    res_pkg = calculate_financials(FinanceInputs(**{**base.__dict__, "packaging_cost": Decimal("15.00")}))
    assert res_pkg.variable_cost_per_unit != base_res.variable_cost_per_unit
    assert res_pkg.variable_cost_per_unit == Decimal("59.00")

    # 3. shipping
    res_ship = calculate_financials(FinanceInputs(**{**base.__dict__, "shipping_cost_per_unit": Decimal("12.00")}))
    assert res_ship.variable_cost_per_unit != base_res.variable_cost_per_unit
    assert res_ship.variable_cost_per_unit == Decimal("58.00")

    # 4. other_variable
    res_other = calculate_financials(FinanceInputs(**{**base.__dict__, "other_variable_cost_per_unit": Decimal("5.00")}))
    assert res_other.variable_cost_per_unit != base_res.variable_cost_per_unit
    assert res_other.variable_cost_per_unit == Decimal("57.00")

    # 5. payment_fee_fixed
    res_fee_fixed = calculate_financials(FinanceInputs(**{**base.__dict__, "payment_fee_fixed": Decimal("3.00")}))
    assert res_fee_fixed.variable_cost_per_unit != base_res.variable_cost_per_unit
    assert res_fee_fixed.variable_cost_per_unit == Decimal("56.00")

    # 6. payment_fee_fraction
    res_fee_frac = calculate_financials(FinanceInputs(**{**base.__dict__, "payment_fee_fraction": Decimal("0.05")}))
    assert res_fee_frac.variable_cost_per_unit != base_res.variable_cost_per_unit
    assert res_fee_frac.variable_cost_per_unit == Decimal("57.00")

    # 7. platform_fee_fraction
    res_plat_frac = calculate_financials(FinanceInputs(**{**base.__dict__, "platform_fee_fraction": Decimal("0.05")}))
    assert res_plat_frac.variable_cost_per_unit != base_res.variable_cost_per_unit
    assert res_plat_frac.variable_cost_per_unit == Decimal("58.00")


def test_packaging_cost_resolver_authority():
    """packaging.packaging_cost is the authority; if absent falls back to costs.packaging_cost."""
    # 1. Packaging present, costs absent -> uses packaging
    assumptions_1 = {
        "packaging": {"packaging_cost": "4.50"},
        "costs": {},
    }
    pkg_cost, findings = resolve_packaging_cost(assumptions_1)
    assert pkg_cost == Decimal("4.50")
    assert not findings

    # 2. Packaging absent, costs present -> falls back to costs
    assumptions_2 = {
        "packaging": {},
        "costs": {"packaging_cost": "5.25"},
    }
    pkg_cost, findings = resolve_packaging_cost(assumptions_2)
    assert pkg_cost == Decimal("5.25")
    assert not findings

    # 3. Both present and matching -> uses value, no findings
    assumptions_3 = {
        "packaging": {"packaging_cost": "6.00"},
        "costs": {"packaging_cost": "6.00"},
    }
    pkg_cost, findings = resolve_packaging_cost(assumptions_3)
    assert pkg_cost == Decimal("6.00")
    assert not findings

    # 4. Both present and differing -> authority packaging.packaging_cost used, PACKAGING_COST_MISMATCH warning finding
    assumptions_4 = {
        "packaging": {"packaging_cost": "3.50"},
        "costs": {"packaging_cost": "4.00"},
    }
    pkg_cost, findings = resolve_packaging_cost(assumptions_4)
    assert pkg_cost == Decimal("3.50")
    assert len(findings) == 1
    assert findings[0].code == "PACKAGING_COST_MISMATCH"
    assert findings[0].severity == Severity.WARNING
    assert findings[0].field == "packaging.packaging_cost"


def test_zero_contribution_break_even_none():
    """Contribution == 0 -> break_even_units is None, Issue ZERO_CONTRIBUTION."""
    inputs = FinanceInputs(
        selling_price=Decimal("100.00"),
        cogs_per_unit=Decimal("60.00"),
        packaging_cost=Decimal("20.00"),
        shipping_cost_per_unit=Decimal("18.00"),
        payment_fee_fraction=Decimal("0.02"),
        fixed_costs_total=Decimal("10000.00"),
    )
    # var_cost = 60 + 20 + 18 + (0.02 * 100 = 2) = 100.00
    # contribution = 100.00 - 100.00 = 0.00
    res = calculate_financials(inputs)
    assert res.variable_cost_per_unit == Decimal("100.00")
    assert res.contribution_per_unit == Decimal("0.00")
    assert res.break_even_units is None
    assert any(i.code == "ZERO_CONTRIBUTION" for i in res.issues)


def test_negative_contribution_break_even_none():
    """Contribution < 0 -> break_even_units is None, Issue NEGATIVE_CONTRIBUTION."""
    inputs = FinanceInputs(
        selling_price=Decimal("100.00"),
        cogs_per_unit=Decimal("70.00"),
        packaging_cost=Decimal("25.00"),
        shipping_cost_per_unit=Decimal("20.00"),
        payment_fee_fraction=Decimal("0.02"),
        fixed_costs_total=Decimal("10000.00"),
    )
    # var_cost = 70 + 25 + 20 + 2 = 117.00
    # contribution = 100 - 117 = -17.00
    res = calculate_financials(inputs)
    assert res.variable_cost_per_unit == Decimal("117.00")
    assert res.contribution_per_unit == Decimal("-17.00")
    assert res.break_even_units is None
    assert any(i.code == "NEGATIVE_CONTRIBUTION" for i in res.issues)


def test_missing_inputs_no_guess():
    """Missing required inputs -> metrics are None, never a guess."""
    # 1. Missing selling price
    inputs_no_price = FinanceInputs(
        cogs_per_unit=Decimal("50.00"),
        packaging_cost=Decimal("10.00"),
        shipping_cost_per_unit=Decimal("15.00"),
    )
    res_no_price = calculate_financials(inputs_no_price)
    assert res_no_price.variable_cost_per_unit is None
    assert res_no_price.contribution_per_unit is None
    assert res_no_price.contribution_margin is None
    assert res_no_price.break_even_units is None
    assert any(i.code == "MISSING_INPUT" and i.field == "selling_price" for i in res_no_price.issues)

    # 2. Missing cogs
    inputs_no_cogs = FinanceInputs(
        selling_price=Decimal("100.00"),
        packaging_cost=Decimal("10.00"),
        shipping_cost_per_unit=Decimal("15.00"),
    )
    res_no_cogs = calculate_financials(inputs_no_cogs)
    assert res_no_cogs.variable_cost_per_unit is None
    assert res_no_cogs.contribution_per_unit is None
    assert any(i.code == "MISSING_INPUT" and i.field == "cogs_per_unit" for i in res_no_cogs.issues)

    # 3. Missing packaging
    inputs_no_pkg = FinanceInputs(
        selling_price=Decimal("100.00"),
        cogs_per_unit=Decimal("50.00"),
        shipping_cost_per_unit=Decimal("15.00"),
    )
    res_no_pkg = calculate_financials(inputs_no_pkg)
    assert res_no_pkg.variable_cost_per_unit is None
    assert any(i.code == "MISSING_INPUT" and i.field == "packaging_cost" for i in res_no_pkg.issues)

    # 4. Missing shipping
    inputs_no_ship = FinanceInputs(
        selling_price=Decimal("100.00"),
        cogs_per_unit=Decimal("50.00"),
        packaging_cost=Decimal("10.00"),
    )
    res_no_ship = calculate_financials(inputs_no_ship)
    assert res_no_ship.variable_cost_per_unit is None
    assert any(i.code == "MISSING_INPUT" and i.field == "shipping_cost_per_unit" for i in res_no_ship.issues)

    # 5. Missing fixed costs total: variable and contribution computed, break_even is None
    inputs_no_fixed = FinanceInputs(
        selling_price=Decimal("100.00"),
        cogs_per_unit=Decimal("50.00"),
        packaging_cost=Decimal("10.00"),
        shipping_cost_per_unit=Decimal("15.00"),
        payment_fee_fraction=Decimal("0.02"),
    )
    res_no_fixed = calculate_financials(inputs_no_fixed)
    assert res_no_fixed.variable_cost_per_unit == Decimal("77.00")
    assert res_no_fixed.contribution_per_unit == Decimal("23.00")
    assert res_no_fixed.contribution_margin == Decimal("0.2300")
    assert res_no_fixed.break_even_units is None
    assert any(i.code == "MISSING_INPUT" and i.field == "fixed_costs_total" for i in res_no_fixed.issues)


def test_negative_costs_produce_issues():
    """Negative costs produce NEGATIVE_COST issue with field specified."""
    inputs = FinanceInputs(
        selling_price=Decimal("100.00"),
        cogs_per_unit=Decimal("-10.00"),
        packaging_cost=Decimal("5.00"),
        shipping_cost_per_unit=Decimal("5.00"),
    )
    res = calculate_financials(inputs)
    assert res.variable_cost_per_unit is None
    assert any(i.code == "NEGATIVE_COST" and i.field == "cogs_per_unit" for i in res.issues)


def test_rounding_half_up_cases():
    """Verifies ROUND_HALF_UP behavior on money (2 dp) and margin (4 dp)."""
    assert round_money(Decimal("10.004")) == Decimal("10.00")
    assert round_money(Decimal("10.005")) == Decimal("10.01")
    assert round_money(Decimal("10.006")) == Decimal("10.01")

    assert round_margin(Decimal("0.43314")) == Decimal("0.4331")
    assert round_margin(Decimal("0.43315")) == Decimal("0.4332")
    assert round_margin(Decimal("0.43316")) == Decimal("0.4332")


def test_sensitivity_helper():
    """Verifies calculate_sensitivity generates projected rows."""
    inputs = FinanceInputs(
        selling_price=Decimal("500"),
        cogs_per_unit=Decimal("150"),
        packaging_cost=Decimal("30"),
        shipping_cost_per_unit=Decimal("40"),
        payment_fee_fraction=Decimal("0.02"),
        fixed_costs_total=Decimal("50000"),
    )
    rows = calculate_sensitivity(inputs, [Decimal("-50.00"), Decimal("0.00"), Decimal("50.00")])
    assert len(rows) == 3

    # Base row (delta 0)
    base_row = rows[1]
    assert base_row.selling_price == Decimal("500.00")
    assert base_row.variable_cost_per_unit == Decimal("230.00")
    assert base_row.contribution_per_unit == Decimal("270.00")
    assert base_row.break_even_units == 186

