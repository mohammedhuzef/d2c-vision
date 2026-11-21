"""Deterministic validation simulation engine for LaunchTwin AI.

Simulates what-if assumption changes against the pure validation pipeline and readiness engine:
- Evaluates baseline vs simulated stage statuses, scores, and metrics
- Calculates exact deltas and changes
- Strictly validates overrides (rejects unknown paths, negative amounts, and non-numeric values)
"""

import copy
from decimal import Decimal, InvalidOperation
from typing import Any, Optional, Sequence

from backend.app.services.readiness import calculate_readiness, ReadinessResult
from backend.app.services.validation.base import StageResult
from backend.app.services.validation.pipeline import run_pipeline
from backend.app.services.validation.rules_config import STAGE_ORDER, MAX_NUMERIC_MAGNITUDE

# Canonical mapping of allowed assumption override keys to internal dotted paths
OVERRIDE_ALIASES: dict[str, tuple[str, ...]] = {
    "selling_price": ("pricing.selling_price",),
    "target_margin_fraction": ("pricing.target_margin_fraction",),
    "cogs_per_unit": ("costs.cogs_per_unit",),
    "packaging_cost": ("packaging.packaging_cost", "costs.packaging_cost"),
    "shipping_cost_per_unit": ("costs.shipping_cost_per_unit",),
    "payment_fee_fraction": ("costs.payment_fee_fraction",),
    "payment_fee_fixed": ("costs.payment_fee_fixed",),
    "platform_fee_fraction": ("costs.platform_fee_fraction",),
    "other_variable_cost_per_unit": ("costs.other_variable_cost_per_unit",),
    "fixed_costs_total": ("costs.fixed_costs_total",),
    "customer_interviews_count": ("customer.customer_interviews_count",),
    "expected_cac": ("marketing.expected_cac",),
}

NUMERIC_FIELDS: frozenset[str] = frozenset({
    "pricing.selling_price",
    "pricing.target_margin_fraction",
    "costs.cogs_per_unit",
    "costs.packaging_cost",
    "costs.shipping_cost_per_unit",
    "costs.payment_fee_fraction",
    "costs.payment_fee_fixed",
    "costs.platform_fee_fraction",
    "costs.other_variable_cost_per_unit",
    "costs.fixed_costs_total",
    "packaging.packaging_cost",
    "packaging.unit_weight_grams",
    "customer.customer_interviews_count",
    "marketing.expected_cac",
    "marketing.monthly_budget",
    "marketing.expected_conversion_rate_fraction",
})


def _validate_and_resolve_overrides(overrides: dict[str, Any]) -> dict[str, Any]:
    """Validates override keys and values, returning resolved dotted paths.

    Raises:
        ValueError: If a field path is unknown, non-numeric, or negative.
    """
    resolved: dict[str, Any] = {}
    for key, val in overrides.items():
        clean_key = key.strip()
        if clean_key in OVERRIDE_ALIASES:
            target_paths = OVERRIDE_ALIASES[clean_key]
        elif "." in clean_key:
            section, field_name = clean_key.split(".", 1)
            target_paths = (f"{section}.{field_name}",)
        else:
            raise ValueError(f"Unknown override field path: '{clean_key}'")

        # Validate numeric / money fields
        for target_path in target_paths:
            if target_path in NUMERIC_FIELDS and val is not None:
                try:
                    dec = Decimal(str(val).strip())
                except (InvalidOperation, ValueError, TypeError):
                    raise ValueError(f"Invalid non-numeric override value for '{clean_key}': {val}")

                if dec.is_nan() or dec.is_infinite():
                    raise ValueError(f"Override value for '{clean_key}' must be finite: {val}")

                if dec < Decimal("0"):
                    raise ValueError(f"Override value for '{clean_key}' cannot be negative: {val}")

                if dec > MAX_NUMERIC_MAGNITUDE:
                    raise ValueError(f"Override value for '{clean_key}' exceeds maximum magnitude: {val}")

            resolved[target_path] = val

    return resolved


def _apply_overrides(assumptions: dict[str, Any], resolved_overrides: dict[str, Any]) -> dict[str, Any]:
    """Applies resolved dotted path overrides to a deep copy of assumptions."""
    simulated = copy.deepcopy(assumptions)
    for target_path, val in resolved_overrides.items():
        section, field_name = target_path.split(".", 1)
        simulated.setdefault(section, {})[field_name] = val
    return simulated


def _extract_profile(stages: dict[str, StageResult], readiness: ReadinessResult) -> dict[str, Any]:
    """Formats stage results and readiness into the canonical simulation profile."""
    fin_stage = stages.get("financial")
    pkg_stage = stages.get("product_packaging")
    mkt_stage = stages.get("marketing")

    fin_metrics = fin_stage.metrics if fin_stage else {}
    pkg_metrics = pkg_stage.metrics if pkg_stage else {}
    mkt_metrics = mkt_stage.metrics if mkt_stage else {}

    contrib = fin_metrics.get("contribution_per_unit")
    margin = fin_metrics.get("contribution_margin")
    be_units = fin_metrics.get("break_even_units")
    pkg_ratio = pkg_metrics.get("packaging_cost_ratio")
    cac_ratio = mkt_metrics.get("cac_to_contribution_ratio")

    return {
        "readiness": {
            "label": readiness.label,
            "score": f"{readiness.overall_score:.2f}" if readiness.overall_score is not None else None,
        },
        "stages": {
            name: {
                "status": stages[name].status.value,
                "score": f"{stages[name].score:.2f}" if stages[name].score is not None else None,
            }
            for name in STAGE_ORDER
            if name in stages
        },
        "metrics": {
            "contribution_per_unit": f"{contrib:.2f}" if contrib is not None else None,
            "margin_fraction": f"{margin:.4f}" if margin is not None else None,
            "break_even_units": str(be_units) if be_units is not None else None,
            "packaging_cost_fraction": f"{pkg_ratio:.4f}" if pkg_ratio is not None else None,
            "cac_to_contribution_ratio": f"{cac_ratio:.4f}" if cac_ratio is not None else None,
        },
    }


def _format_delta(
    base_val: Optional[str],
    sim_val: Optional[str],
    precision: int = 2,
    is_int: bool = False,
) -> Optional[str]:
    """Calculates signed delta between baseline and simulated values."""
    if base_val is None or sim_val is None:
        return None
    try:
        b = Decimal(str(base_val))
        s = Decimal(str(sim_val))
        diff = s - b
        if is_int:
            diff_int = int(diff)
            sign = "+" if diff_int >= 0 else ""
            return f"{sign}{diff_int}"
        else:
            sign = "+" if diff >= Decimal("0") else ""
            fmt = f"{{:.{precision}f}}"
            return f"{sign}{fmt.format(diff)}"
    except (InvalidOperation, ValueError, TypeError):
        return None


def simulate(
    assumptions: dict[str, Any],
    overrides: Optional[dict[str, Any]],
    evidence: Sequence[Any],
    competitor_analyses: Sequence[Any],
) -> dict[str, Any]:
    """Simulates validation and readiness with hypothetical assumption overrides.

    Args:
        assumptions: Baseline product and financial assumptions.
        overrides: Dictionary of assumption field overrides (may be empty).
        evidence: Benchmark research evidence.
        competitor_analyses: Competitor benchmark analyses.

    Returns:
        Dictionary matching SimulationResponse schema from contracts/openapi.json.

    Raises:
        ValueError: If an override field path is unknown, non-numeric, or negative.
    """
    clean_overrides = overrides or {}
    resolved_overrides = _validate_and_resolve_overrides(clean_overrides)

    # 1. Run baseline pipeline
    baseline_stages = run_pipeline(assumptions, evidence, competitor_analyses)
    baseline_readiness = calculate_readiness(baseline_stages)
    baseline_profile = _extract_profile(baseline_stages, baseline_readiness)

    # 2. Run simulated pipeline
    if not resolved_overrides:
        simulated_profile = baseline_profile
        deltas: dict[str, Optional[str]] = {}
        changes: list[dict[str, Any]] = []
    else:
        simulated_assumptions = _apply_overrides(assumptions, resolved_overrides)
        simulated_stages = run_pipeline(simulated_assumptions, evidence, competitor_analyses)
        simulated_readiness = calculate_readiness(simulated_stages)
        simulated_profile = _extract_profile(simulated_stages, simulated_readiness)

        # 3. Calculate deltas and changes
        tracked_fields = [
            ("readiness_score", "readiness.score", 2, False),
            ("contribution_per_unit", "metrics.contribution_per_unit", 2, False),
            ("margin_fraction", "metrics.margin_fraction", 4, False),
            ("break_even_units", "metrics.break_even_units", 0, True),
            ("packaging_cost_fraction", "metrics.packaging_cost_fraction", 4, False),
            ("cac_to_contribution_ratio", "metrics.cac_to_contribution_ratio", 4, False),
        ]

        deltas = {}
        changes = []

        for delta_key, change_field, prec, is_int in tracked_fields:
            if change_field.startswith("readiness."):
                sub = change_field.split(".", 1)[1]
                b_str = baseline_profile["readiness"].get(sub)
                s_str = simulated_profile["readiness"].get(sub)
            else:
                sub = change_field.split(".", 1)[1]
                b_str = baseline_profile["metrics"].get(sub)
                s_str = simulated_profile["metrics"].get(sub)

            delta_str = _format_delta(b_str, s_str, precision=prec, is_int=is_int)
            deltas[delta_key] = delta_str

            if delta_str is not None:
                changes.append({
                    "field": change_field,
                    "baseline": b_str,
                    "simulated": s_str,
                    "delta": delta_str,
                })

    return {
        "baseline": baseline_profile,
        "simulated": simulated_profile,
        "deltas": deltas,
        "changes": changes,
    }

