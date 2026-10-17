from decimal import Decimal
import itertools
from pathlib import Path
import pytest

from backend.app.schemas.assumptions import (
    Assumptions,
    PackagingAssumptions,
    PricingAssumptions,
    CostsAssumptions,
)
from backend.app.services.finance import (
    calculate_financials,
    from_assumptions,
    money_to_str,
    fraction_to_str,
    to_metrics_dict,
    FinanceInputs,
    FinancialResult,
    Issue,
)


def test_vector_a():
    """TEST VECTOR A: price 500, cogs 150, packaging 30, shipping 40, fee 0.02, fixed 50000
    -> variable 230.00, contribution 270.00, margin 0.5400, break_even 186."""
    assumptions = Assumptions(
        packaging=PackagingAssumptions(packaging_cost=Decimal("30")),
        pricing=PricingAssumptions(selling_price=Decimal("500")),
        costs=CostsAssumptions(
            cogs_per_unit=Decimal("150"),
            shipping_cost_per_unit=Decimal("40"),
            payment_fee_fraction=Decimal("0.02"),
            fixed_costs_total=Decimal("50000"),
        ),
    )
    res = calculate_financials(assumptions)
    assert not res.issues
    assert res.variable_cost_per_unit == Decimal("230.00")
    assert res.contribution_per_unit == Decimal("270.00")
    assert res.contribution_margin == Decimal("0.5400")
    assert res.break_even_units == 186

    # Test backward-compatible res.metrics properties
    assert res.metrics.variable_cost_per_unit == Decimal("230.00")
    assert res.metrics.contribution_per_unit == Decimal("270.00")
    assert res.metrics.contribution_margin == Decimal("0.5400")
    assert res.metrics.break_even_units == 186


def test_vector_a_pure_inputs():
    """Vector A directly using frozen FinanceInputs."""
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
    assert money_to_str(res.variable_cost_per_unit) == "230.00"
    assert money_to_str(res.contribution_per_unit) == "270.00"
    assert fraction_to_str(res.contribution_margin) == "0.5400"
    assert res.break_even_units == 186

    metrics_dict = to_metrics_dict(res)
    assert metrics_dict["variable_cost_per_unit"] == "230.00"
    assert metrics_dict["contribution_per_unit"] == "270.00"
    assert metrics_dict["contribution_margin"] == 0.5400
    assert metrics_dict["break_even_units"] == 186


def test_vector_b():
    """TEST VECTOR B: same as Vector A but packaging 60
    -> variable 260.00, contribution 240.00, margin 0.4800, break_even 209."""
    assumptions = Assumptions(
        packaging=PackagingAssumptions(packaging_cost=Decimal("60")),
        pricing=PricingAssumptions(selling_price=Decimal("500")),
        costs=CostsAssumptions(
            cogs_per_unit=Decimal("150"),
            shipping_cost_per_unit=Decimal("40"),
            payment_fee_fraction=Decimal("0.02"),
            fixed_costs_total=Decimal("50000"),
        ),
    )
    res = calculate_financials(assumptions)
    assert not res.issues
    assert res.variable_cost_per_unit == Decimal("260.00")
    assert res.contribution_per_unit == Decimal("240.00")
    assert res.contribution_margin == Decimal("0.4800")
    assert res.break_even_units == 209
    assert res.metrics.variable_cost_per_unit == Decimal("260.00")
    assert res.metrics.contribution_per_unit == Decimal("240.00")
    assert res.metrics.contribution_margin == Decimal("0.4800")
    assert res.metrics.break_even_units == 209


def test_vector_b_pure_inputs():
    """Vector B directly using FinanceInputs."""
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
    assert money_to_str(res.variable_cost_per_unit) == "260.00"
    assert money_to_str(res.contribution_per_unit) == "240.00"
    assert fraction_to_str(res.contribution_margin) == "0.4800"
    assert res.break_even_units == 209


def test_vector_c_negative_contribution():
    """TEST VECTOR C (part 1): price 100, costs exceed price -> negative contribution, break-even null."""
    assumptions = Assumptions(
        packaging=PackagingAssumptions(packaging_cost=Decimal("30")),
        pricing=PricingAssumptions(selling_price=Decimal("100")),
        costs=CostsAssumptions(
            cogs_per_unit=Decimal("90"),
            shipping_cost_per_unit=Decimal("20"),
            fixed_costs_total=Decimal("5000"),
        ),
    )
    res = calculate_financials(assumptions)
    assert any(i.code == "NEGATIVE_CONTRIBUTION" for i in res.issues)
    assert res.contribution_per_unit < Decimal("0")
    assert res.break_even_units is None
    assert res.metrics.contribution_per_unit < Decimal("0")
    assert res.metrics.break_even_units is None


def test_vector_c_missing_price():
    """TEST VECTOR C (part 2): missing price -> dependent metrics null, issue MISSING_INPUT:selling_price."""
    assumptions = Assumptions(
        packaging=PackagingAssumptions(packaging_cost=Decimal("30")),
        pricing=PricingAssumptions(selling_price=None),
        costs=CostsAssumptions(
            cogs_per_unit=Decimal("150"),
            shipping_cost_per_unit=Decimal("40"),
            fixed_costs_total=Decimal("50000"),
        ),
    )
    res = calculate_financials(assumptions)
    assert any(i.code == "MISSING_INPUT:selling_price" for i in res.issues)
    assert res.selling_price is None
    assert res.variable_cost_per_unit is None
    assert res.contribution_per_unit is None
    assert res.contribution_margin is None
    assert res.break_even_units is None
    assert res.metrics.selling_price is None
    assert res.metrics.variable_cost_per_unit is None
    assert res.metrics.contribution_per_unit is None
    assert res.metrics.contribution_margin is None
    assert res.metrics.break_even_units is None


def test_zero_contribution():
    """Price equals variable costs exactly -> contribution zero, break_even null with ZERO_CONTRIBUTION issue."""
    assumptions = Assumptions(
        packaging=PackagingAssumptions(packaging_cost=Decimal("20")),
        pricing=PricingAssumptions(selling_price=Decimal("100")),
        costs=CostsAssumptions(
            cogs_per_unit=Decimal("50"),
            shipping_cost_per_unit=Decimal("30"),
            payment_fee_fraction=Decimal("0.00"),
            fixed_costs_total=Decimal("10000"),
        ),
    )
    res = calculate_financials(assumptions)
    assert any(i.code == "ZERO_CONTRIBUTION" for i in res.issues)
    assert res.contribution_per_unit == Decimal("0.00")
    assert res.break_even_units is None
    assert res.metrics.contribution_per_unit == Decimal("0.00")
    assert res.metrics.break_even_units is None


def test_non_positive_price():
    """Price 0 and negative price: all metrics null, NON_POSITIVE_PRICE issue."""
    res_zero = calculate_financials(FinanceInputs(selling_price=Decimal("0"), cogs_per_unit=Decimal("10"), packaging_cost=Decimal("2"), shipping_cost_per_unit=Decimal("3")))
    assert any(i.code == "NON_POSITIVE_PRICE" for i in res_zero.issues)
    assert res_zero.variable_cost_per_unit is None
    assert res_zero.contribution_per_unit is None
    assert res_zero.contribution_margin is None
    assert res_zero.break_even_units is None

    res_neg = calculate_financials(FinanceInputs(selling_price=Decimal("-10.50"), cogs_per_unit=Decimal("10"), packaging_cost=Decimal("2"), shipping_cost_per_unit=Decimal("3")))
    assert any(i.code == "NON_POSITIVE_PRICE" for i in res_neg.issues)
    assert res_neg.variable_cost_per_unit is None
    assert res_neg.contribution_per_unit is None
    assert res_neg.contribution_margin is None
    assert res_neg.break_even_units is None


def test_negative_costs():
    """Each negative cost triggers NEGATIVE_COST issue."""
    cost_test_cases = [
        ("cogs_per_unit", FinanceInputs(selling_price=Decimal("100"), cogs_per_unit=Decimal("-50"), packaging_cost=Decimal("10"), shipping_cost_per_unit=Decimal("5"))),
        ("packaging_cost", FinanceInputs(selling_price=Decimal("100"), cogs_per_unit=Decimal("50"), packaging_cost=Decimal("-10"), shipping_cost_per_unit=Decimal("5"))),
        ("shipping_cost_per_unit", FinanceInputs(selling_price=Decimal("100"), cogs_per_unit=Decimal("50"), packaging_cost=Decimal("10"), shipping_cost_per_unit=Decimal("-5"))),
        ("other_variable_cost_per_unit", FinanceInputs(selling_price=Decimal("100"), cogs_per_unit=Decimal("50"), packaging_cost=Decimal("10"), shipping_cost_per_unit=Decimal("5"), other_variable_cost_per_unit=Decimal("-2"))),
        ("payment_fee_fixed", FinanceInputs(selling_price=Decimal("100"), cogs_per_unit=Decimal("50"), packaging_cost=Decimal("10"), shipping_cost_per_unit=Decimal("5"), payment_fee_fixed=Decimal("-1"))),
        ("fixed_costs_total", FinanceInputs(selling_price=Decimal("100"), cogs_per_unit=Decimal("50"), packaging_cost=Decimal("10"), shipping_cost_per_unit=Decimal("5"), fixed_costs_total=Decimal("-500"))),
    ]

    for field_name, inputs in cost_test_cases:
        res = calculate_financials(inputs)
        assert any(i.code == "NEGATIVE_COST" and i.field == field_name for i in res.issues), f"Expected NEGATIVE_COST on {field_name}"
        # Also check backward-compatible code match
        assert any(i.code == f"NEGATIVE_COST:{field_name}" for i in res.issues)


def test_missing_required_variable_cost_inputs():
    """Missing cogs, packaging, or shipping -> metrics null, MISSING_INPUT for each."""
    inputs = FinanceInputs(
        selling_price=Decimal("100"),
        cogs_per_unit=None,
        packaging_cost=None,
        shipping_cost_per_unit=None,
    )
    res = calculate_financials(inputs)
    assert res.variable_cost_per_unit is None
    assert res.contribution_per_unit is None
    assert res.contribution_margin is None
    assert res.break_even_units is None
    issue_codes = [i.code for i in res.issues]
    assert "MISSING_INPUT:cogs_per_unit" in issue_codes
    assert "MISSING_INPUT:packaging_cost" in issue_codes
    assert "MISSING_INPUT:shipping_cost_per_unit" in issue_codes


def test_fee_fraction_out_of_bounds():
    """Fee fractions outside [0, 1] produce INVALID_FRACTION issues."""
    inputs_high = FinanceInputs(
        selling_price=Decimal("100"),
        cogs_per_unit=Decimal("20"),
        packaging_cost=Decimal("5"),
        shipping_cost_per_unit=Decimal("5"),
        payment_fee_fraction=Decimal("1.5"),
    )
    res_high = calculate_financials(inputs_high)
    assert any(i.code == "INVALID_FRACTION" and i.field == "payment_fee_fraction" for i in res_high.issues)
    assert res_high.variable_cost_per_unit is None

    inputs_neg = FinanceInputs(
        selling_price=Decimal("100"),
        cogs_per_unit=Decimal("20"),
        packaging_cost=Decimal("5"),
        shipping_cost_per_unit=Decimal("5"),
        platform_fee_fraction=Decimal("-0.1"),
    )
    res_neg = calculate_financials(inputs_neg)
    assert any(i.code == "INVALID_FRACTION" and i.field == "platform_fee_fraction" for i in res_neg.issues)
    assert res_neg.variable_cost_per_unit is None


def test_nan_and_infinity_inputs():
    """NaN and Infinity inputs trigger INVALID_NUMBER issue and never raise."""
    inputs_nan = FinanceInputs(
        selling_price=Decimal("NaN"),
        cogs_per_unit=Decimal("50"),
        packaging_cost=Decimal("10"),
        shipping_cost_per_unit=Decimal("5"),
    )
    res_nan = calculate_financials(inputs_nan)
    assert any(i.code == "INVALID_NUMBER" and i.field == "selling_price" for i in res_nan.issues)
    assert res_nan.variable_cost_per_unit is None

    inputs_inf = FinanceInputs(
        selling_price=Decimal("100"),
        cogs_per_unit=Decimal("Infinity"),
        packaging_cost=Decimal("10"),
        shipping_cost_per_unit=Decimal("5"),
    )
    res_inf = calculate_financials(inputs_inf)
    assert any(i.code == "INVALID_NUMBER" and i.field == "cogs_per_unit" for i in res_inf.issues)
    assert res_inf.variable_cost_per_unit is None


def test_optional_fields_defaults_applied():
    """All optional fields omitted -> default fees (0.02 payment, 0 platform, 0 fixed) applied."""
    inputs = FinanceInputs(
        selling_price=Decimal("100"),
        cogs_per_unit=Decimal("30"),
        packaging_cost=Decimal("10"),
        shipping_cost_per_unit=Decimal("8"),
    )
    res = calculate_financials(inputs)
    # 30 + 10 + 8 + (100 * 0.02 = 2.00) = 50.00
    assert res.variable_cost_per_unit == Decimal("50.00")
    assert res.contribution_per_unit == Decimal("50.00")
    assert res.contribution_margin == Decimal("0.5000")
    # fixed_costs_total was omitted -> break_even is None with MISSING_INPUT:fixed_costs_total
    assert res.break_even_units is None
    assert any(i.code == "MISSING_INPUT:fixed_costs_total" for i in res.issues)


def test_platform_fee_and_fixed_fee_included():
    """Calculates variable cost including platform fee fraction and fixed payment fee."""
    inputs = FinanceInputs(
        selling_price=Decimal("200.00"),
        cogs_per_unit=Decimal("60.00"),
        packaging_cost=Decimal("10.00"),
        shipping_cost_per_unit=Decimal("15.00"),
        other_variable_cost_per_unit=Decimal("5.00"),
        payment_fee_fraction=Decimal("0.025"),   # 200 * 0.025 = 5.00
        payment_fee_fixed=Decimal("0.30"),       # 0.30
        platform_fee_fraction=Decimal("0.05"),  # 200 * 0.05 = 10.00
        fixed_costs_total=Decimal("10000.00"),
    )
    # variable_cost = 60 + 10 + 15 + 5 + 0.30 + 5.00 + 10.00 = 105.30
    res = calculate_financials(inputs)
    assert res.variable_cost_per_unit == Decimal("105.30")
    # contribution = 200 - 105.30 = 94.70
    assert res.contribution_per_unit == Decimal("94.70")
    # margin = 94.70 / 200 = 0.4735
    assert res.contribution_margin == Decimal("0.4735")
    # break_even = ceil(10000 / 94.70) = ceil(105.5966...) = 106
    assert res.break_even_units == 106


def test_round_half_up_at_exact_005_boundary():
    """Exact .005 boundary must round half up, NOT banker's rounding to even."""
    # Banker's rounding on 100.005 would round to 100.00.
    # ROUND_HALF_UP must round to 100.01.
    inputs = FinanceInputs(
        selling_price=Decimal("200.00"),
        cogs_per_unit=Decimal("100.005"),
        packaging_cost=Decimal("0.00"),
        shipping_cost_per_unit=Decimal("0.00"),
        payment_fee_fraction=Decimal("0.00"),
    )
    res = calculate_financials(inputs)
    assert res.variable_cost_per_unit == Decimal("100.01")


def test_rounding_and_precision():
    """Verify Decimal half-up rounding rules."""
    assumptions = Assumptions(
        packaging=PackagingAssumptions(packaging_cost=Decimal("2.00")),
        pricing=PricingAssumptions(selling_price=Decimal("33.33")),
        costs=CostsAssumptions(
            cogs_per_unit=Decimal("10.005"),
            shipping_cost_per_unit=Decimal("3.00"),
            payment_fee_fraction=Decimal("0.02"),
            fixed_costs_total=Decimal("1000.00"),
        ),
    )
    res = calculate_financials(assumptions)
    # 10.005 + 2 + 3 + (33.33*0.02 = 0.6666) = 15.6716 -> rounds half up to 15.67
    assert res.variable_cost_per_unit == Decimal("15.67")
    # contribution = 33.33 - 15.67 = 17.66
    assert res.contribution_per_unit == Decimal("17.66")
    # margin = 17.66 / 33.33 = 0.5298529... -> rounds half up to 0.5299
    assert res.contribution_margin == Decimal("0.5299")


def test_break_even_exact_integer_division():
    """Exact integer division must NOT produce an extra +1 in break-even."""
    inputs = FinanceInputs(
        selling_price=Decimal("100.00"),
        cogs_per_unit=Decimal("40.00"),
        packaging_cost=Decimal("5.00"),
        shipping_cost_per_unit=Decimal("5.00"),
        payment_fee_fraction=Decimal("0.00"),
        fixed_costs_total=Decimal("1000.00"),
    )
    # contribution = 100 - 50 = 50.00
    # break_even = 1000 / 50 = exactly 20 (no +1)
    res = calculate_financials(inputs)
    assert res.contribution_per_unit == Decimal("50.00")
    assert res.break_even_units == 20


def test_fixed_costs_zero_break_even_zero():
    """Fixed costs 0 with positive contribution yields break_even = 0."""
    inputs = FinanceInputs(
        selling_price=Decimal("100.00"),
        cogs_per_unit=Decimal("40.00"),
        packaging_cost=Decimal("5.00"),
        shipping_cost_per_unit=Decimal("5.00"),
        payment_fee_fraction=Decimal("0.00"),
        fixed_costs_total=Decimal("0.00"),
    )
    res = calculate_financials(inputs)
    assert res.break_even_units == 0


def test_huge_values_no_overflow():
    """Handles 1e15 magnitude values gracefully without overflow."""
    huge_price = Decimal("5000000000000000.00")   # 5e15
    huge_cogs = Decimal("1500000000000000.00")
    huge_pack = Decimal("500000000000000.00")
    huge_ship = Decimal("200000000000000.00")
    huge_fixed = Decimal("100000000000000000.00")

    inputs = FinanceInputs(
        selling_price=huge_price,
        cogs_per_unit=huge_cogs,
        packaging_cost=huge_pack,
        shipping_cost_per_unit=huge_ship,
        payment_fee_fraction=Decimal("0.02"),
        fixed_costs_total=huge_fixed,
    )
    res = calculate_financials(inputs)
    assert not res.issues
    # fee = 5e15 * 0.02 = 1e14
    # var_cost = 1.5e15 + 0.5e15 + 0.2e15 + 0.1e15 = 2.3e15
    assert res.variable_cost_per_unit == Decimal("2300000000000000.00")
    # contribution = 5e15 - 2.3e15 = 2.7e15
    assert res.contribution_per_unit == Decimal("2700000000000000.00")
    assert res.contribution_margin == Decimal("0.5400")
    assert res.break_even_units is not None


def test_tiny_values():
    """Handles micro-transactions and small decimals gracefully."""
    inputs = FinanceInputs(
        selling_price=Decimal("0.10"),
        cogs_per_unit=Decimal("0.02"),
        packaging_cost=Decimal("0.01"),
        shipping_cost_per_unit=Decimal("0.01"),
        payment_fee_fraction=Decimal("0.02"),
        fixed_costs_total=Decimal("10.00"),
    )
    res = calculate_financials(inputs)
    assert not res.issues
    assert res.variable_cost_per_unit is not None
    assert res.contribution_per_unit is not None
    assert res.break_even_units is not None


def test_determinism_across_repeated_calls():
    """Same inputs must produce identically equal results across repeated calls."""
    inputs = FinanceInputs(
        selling_price=Decimal("45.00"),
        cogs_per_unit=Decimal("12.50"),
        packaging_cost=Decimal("3.25"),
        shipping_cost_per_unit=Decimal("4.50"),
        fixed_costs_total=Decimal("12000.00"),
    )
    r1 = calculate_financials(inputs)
    r2 = calculate_financials(inputs)
    assert r1.variable_cost_per_unit == r2.variable_cost_per_unit
    assert r1.contribution_per_unit == r2.contribution_per_unit
    assert r1.contribution_margin == r2.contribution_margin
    assert r1.break_even_units == r2.break_even_units
    assert [i.code for i in r1.issues] == [i.code for i in r2.issues]


def test_packaging_cost_mirroring_source_of_truth():
    """packaging.packaging_cost is the source of truth over costs.packaging_cost."""
    assumptions = {
        "pricing": {"selling_price": "100.00"},
        "packaging": {"packaging_cost": "15.00"},
        "costs": {
            "cogs_per_unit": "40.00",
            "packaging_cost": "99.00",  # ignored because packaging.packaging_cost is truth
            "shipping_cost_per_unit": "5.00",
            "fixed_costs_total": "1000.00",
        },
    }
    inputs = from_assumptions(assumptions)
    assert inputs.packaging_cost == Decimal("15.00")
    res = calculate_financials(inputs)
    # var_cost = 40 + 15 + 5 + (100 * 0.02 = 2) = 62.00
    assert res.variable_cost_per_unit == Decimal("62.00")


def test_packaging_mirroring_only_costs_packaging_cost_given():
    """When only costs.packaging_cost is provided, it is mirrored as packaging_cost."""
    assumptions = {
        "pricing": {"selling_price": "100.00"},
        "costs": {
            "cogs_per_unit": "30.00",
            "packaging_cost": "12.50",
            "shipping_cost_per_unit": "5.00",
        },
    }
    inputs = from_assumptions(assumptions)
    assert inputs.packaging_cost == Decimal("12.50")
    res = calculate_financials(inputs)
    # 30 + 12.50 + 5 + (100 * 0.02 = 2) = 49.50
    assert res.variable_cost_per_unit == Decimal("49.50")


def test_packaging_mirroring_only_packaging_packaging_cost_given():
    """When only packaging.packaging_cost is provided, it is used."""
    assumptions = {
        "pricing": {"selling_price": "100.00"},
        "packaging": {"packaging_cost": "18.00"},
        "costs": {
            "cogs_per_unit": "30.00",
            "shipping_cost_per_unit": "5.00",
        },
    }
    inputs = from_assumptions(assumptions)
    assert inputs.packaging_cost == Decimal("18.00")
    res = calculate_financials(inputs)
    # 30 + 18 + 5 + (100 * 0.02 = 2) = 55.00
    assert res.variable_cost_per_unit == Decimal("55.00")


def test_packaging_mirroring_both_equal():
    """When both packaging.packaging_cost and costs.packaging_cost are given and equal, value is accepted."""
    assumptions = {
        "pricing": {"selling_price": "100.00"},
        "packaging": {"packaging_cost": "22.00"},
        "costs": {
            "cogs_per_unit": "30.00",
            "packaging_cost": "22.00",
            "shipping_cost_per_unit": "5.00",
        },
    }
    inputs = from_assumptions(assumptions)
    assert inputs.packaging_cost == Decimal("22.00")
    res = calculate_financials(inputs)
    # 30 + 22 + 5 + (100 * 0.02 = 2) = 59.00
    assert res.variable_cost_per_unit == Decimal("59.00")


def test_packaging_mirroring_both_different_api_rejects(client):
    """When both packaging costs are provided with differing values, API rejects with 422 VALIDATION_ERROR."""
    payload = {
        "name": "Differing Packaging Costs",
        "assumptions": {
            "packaging": {"packaging_cost": 50.00},
            "costs": {"packaging_cost": 25.00},
        },
    }
    res = client.post("/api/v1/products", json=payload)
    assert res.status_code == 422
    err = res.json()["error"]
    assert err["code"] == "VALIDATION_ERROR"
    assert any("assumptions" in d.get("field", "") or "packaging" in d.get("issue", "") for d in err["details"])


# Grid of sample values for sweep
SAMPLE_VALUES = [
    None,
    Decimal("0"),
    Decimal("-10.00"),
    Decimal("50.00"),
    Decimal("100.00"),
    Decimal("100000.00"),
]


@pytest.mark.parametrize(
    "price, cogs, fixed",
    list(itertools.product(SAMPLE_VALUES, SAMPLE_VALUES[:4], SAMPLE_VALUES[:4])),
)
def test_parametrized_sweep_never_raises(price, cogs, fixed):
    """
    Exhaustive grid sweep across None, zero, negative, and positive inputs.
    calculate_financials must NEVER raise, never return inf, and always return FinancialResult.
    """
    inputs = FinanceInputs(
        selling_price=price,
        cogs_per_unit=cogs,
        packaging_cost=Decimal("10.00"),
        shipping_cost_per_unit=Decimal("5.00"),
        fixed_costs_total=fixed,
    )
    result = calculate_financials(inputs)
    assert isinstance(result, FinancialResult)
    assert isinstance(result.issues, list)
    if result.break_even_units is not None:
        assert isinstance(result.break_even_units, int)
        assert result.break_even_units >= 0


def test_finance_source_scan():
    """
    finance.py must contain:
    - NO 'float(' anywhere (pure Decimal)
    - NO 'random' (no 'import random' or random module usage)
    - NO imports from app.models, app.api, sqlalchemy, httpx, or LLM modules
    """
    finance_path = Path(__file__).resolve().parent.parent.parent / "app" / "services" / "finance.py"
    source = finance_path.read_text(encoding="utf-8")

    assert "float(" not in source, "Found forbidden 'float(' in services/finance.py"
    assert "random" not in source, "Found forbidden 'random' in services/finance.py"
    assert "app.models" not in source, "Found forbidden import from app.models in services/finance.py"
    assert "app.api" not in source, "Found forbidden import from app.api in services/finance.py"
    assert "sqlalchemy" not in source, "Found forbidden import from sqlalchemy in services/finance.py"
    assert "httpx" not in source, "Found forbidden import from httpx in services/finance.py"
    assert "openai" not in source, "Found forbidden import from openai in services/finance.py"
    assert "anthropic" not in source, "Found forbidden import from anthropic in services/finance.py"
    assert "langchain" not in source, "Found forbidden import from langchain in services/finance.py"


def test_global_decimal_context_not_mutated():
    """Ensure global decimal context is never mutated by finance operations."""
    import decimal
    original_prec = decimal.getcontext().prec
    original_rounding = decimal.getcontext().rounding

    inputs = FinanceInputs(
        selling_price=Decimal("123.45"),
        cogs_per_unit=Decimal("45.67"),
        packaging_cost=Decimal("5.12"),
        shipping_cost_per_unit=Decimal("7.89"),
        fixed_costs_total=Decimal("10000"),
    )
    res = calculate_financials(inputs)
    _ = to_metrics_dict(res)
    _ = money_to_str(res.variable_cost_per_unit)
    _ = fraction_to_str(res.contribution_margin)

    assert decimal.getcontext().prec == original_prec
    assert decimal.getcontext().rounding == original_rounding


def test_dataclasses_are_frozen():
    """Ensure FinanceInputs, FinancialResult, and Issue are immutable frozen dataclasses."""
    from dataclasses import FrozenInstanceError

    inputs = FinanceInputs(selling_price=Decimal("100.00"))
    with pytest.raises(FrozenInstanceError):
        inputs.selling_price = Decimal("200.00")  # type: ignore

    res = FinancialResult(variable_cost_per_unit=Decimal("50.00"))
    with pytest.raises(FrozenInstanceError):
        res.variable_cost_per_unit = Decimal("60.00")  # type: ignore

    issue = Issue(code="TEST", field="test", message="msg")
    with pytest.raises(FrozenInstanceError):
        issue.code = "CHANGED"  # type: ignore


def test_multiple_negative_costs_produce_one_issue_per_offending_field():
    """Each negative cost produces its own distinct NEGATIVE_COST issue."""
    inputs = FinanceInputs(
        selling_price=Decimal("100.00"),
        cogs_per_unit=Decimal("-10.00"),
        packaging_cost=Decimal("-5.00"),
        shipping_cost_per_unit=Decimal("-3.00"),
        other_variable_cost_per_unit=Decimal("-1.00"),
        payment_fee_fixed=Decimal("-0.50"),
        fixed_costs_total=Decimal("-1000.00"),
    )
    res = calculate_financials(inputs)
    negative_cost_fields = {
        i.field for i in res.issues if i.code == "NEGATIVE_COST" or i.code.startswith("NEGATIVE_COST")
    }
    expected_fields = {
        "cogs_per_unit",
        "packaging_cost",
        "shipping_cost_per_unit",
        "other_variable_cost_per_unit",
        "payment_fee_fixed",
        "fixed_costs_total",
    }
    assert negative_cost_fields == expected_fields
    assert res.variable_cost_per_unit is None


def test_from_assumptions_pydantic_and_dict():
    """Verify from_assumptions works seamlessly with both Pydantic models and dictionaries."""
    assumptions_dict = {
        "pricing": {"selling_price": "250.00"},
        "packaging": {"packaging_cost": "25.00"},
        "costs": {
            "cogs_per_unit": "75.00",
            "shipping_cost_per_unit": "20.00",
            "fixed_costs_total": "20000.00",
        },
    }
    inputs_cls = FinanceInputs.from_assumptions(assumptions_dict)
    assert inputs_cls.selling_price == Decimal("250.00")
    assert inputs_cls.packaging_cost == Decimal("25.00")
    assert inputs_cls.cogs_per_unit == Decimal("75.00")
    assert inputs_cls.shipping_cost_per_unit == Decimal("20.00")
    assert inputs_cls.fixed_costs_total == Decimal("20000.00")

    inputs_fn = from_assumptions(assumptions_dict)
    assert inputs_fn == inputs_cls


def test_serialization_null_metrics():
    """Verify to_metrics_dict handles all-null financial results safely."""
    empty_result = FinancialResult()
    metrics = to_metrics_dict(empty_result)
    assert metrics["selling_price"] is None
    assert metrics["variable_cost_per_unit"] is None
    assert metrics["contribution_per_unit"] is None
    assert metrics["contribution_margin"] is None
    assert metrics["break_even_units"] is None
    assert metrics["fixed_costs_total"] is None
