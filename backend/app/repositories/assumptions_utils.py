"""Utilities for assumption deep merging, diff computation, and validation."""

import copy
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional, Set, Tuple

from backend.app.core.errors import ValidationError
from backend.app.schemas.assumptions import ALLOWED_ASSUMPTIONS_PATHS

FRACTION_FIELDS: frozenset[str] = frozenset({
    "pricing.target_margin_fraction",
    "costs.payment_fee_fraction",
    "costs.platform_fee_fraction",
    "marketing.expected_conversion_rate_fraction",
})

MONEY_OR_COUNT_NON_NEGATIVE: frozenset[str] = frozenset({
    "costs.cogs_per_unit",
    "costs.packaging_cost",
    "costs.shipping_cost_per_unit",
    "costs.payment_fee_fixed",
    "costs.other_variable_cost_per_unit",
    "costs.fixed_costs_total",
    "packaging.packaging_cost",
    "packaging.unit_weight_grams",
    "customer.customer_interviews_count",
    "marketing.expected_cac",
    "marketing.monthly_budget",
})

STRICT_POSITIVE_FIELDS: frozenset[str] = frozenset({
    "pricing.selling_price",
})


def _flatten_dict(d: Dict[str, Any], prefix: str = "") -> Dict[str, Any]:
    """Flattens a nested dictionary into dot-notation paths."""
    items: Dict[str, Any] = {}
    for k, v in d.items():
        new_key = f"{prefix}.{k}" if prefix else str(k)
        if isinstance(v, dict):
            items.update(_flatten_dict(v, new_key))
        else:
            items[new_key] = v
    return items


def _unflatten_dict(flat: Dict[str, Any]) -> Dict[str, Any]:
    """Expands a dot-notation dictionary into nested dictionaries."""
    nested: Dict[str, Any] = {}
    for key, value in flat.items():
        parts = key.split(".")
        current = nested
        for part in parts[:-1]:
            current = current.setdefault(part, {})
        current[parts[-1]] = value
    return nested


def validate_patch(patch: Dict[str, Any]) -> Dict[str, Any]:
    """Validates patch keys and values.

    Raises:
        ValidationError (422): If an unknown path, negative money, non-positive price,
                              or out-of-range fraction is supplied.
    """
    flat = _flatten_dict(patch)
    for path, val in flat.items():
        if path not in ALLOWED_ASSUMPTIONS_PATHS:
            raise ValidationError(
                message=f"Unknown assumption field path: '{path}'",
                details=[{"field": path, "issue": "Unknown assumption field"}],
            )

        if val is None:
            continue

        # Strictly positive check
        if path in STRICT_POSITIVE_FIELDS:
            try:
                dec = Decimal(str(val).strip())
                if dec <= Decimal("0"):
                    raise ValidationError(
                        message=f"{path} must be greater than zero",
                        details=[{"field": path, "issue": "Must be greater than zero"}],
                    )
            except (InvalidOperation, ValueError, TypeError):
                raise ValidationError(
                    message=f"Invalid numeric value for {path}",
                    details=[{"field": path, "issue": "Invalid numeric value"}],
                )

        # Non-negative check
        if path in MONEY_OR_COUNT_NON_NEGATIVE:
            try:
                dec = Decimal(str(val).strip())
                if dec < Decimal("0"):
                    raise ValidationError(
                        message=f"{path} cannot be negative",
                        details=[{"field": path, "issue": "Cannot be negative"}],
                    )
            except (InvalidOperation, ValueError, TypeError):
                raise ValidationError(
                    message=f"Invalid numeric value for {path}",
                    details=[{"field": path, "issue": "Invalid numeric value"}],
                )

        # Fraction range check [0, 1]
        if path in FRACTION_FIELDS:
            try:
                dec = Decimal(str(val).strip())
                if dec < Decimal("0") or dec > Decimal("1"):
                    raise ValidationError(
                        message=f"{path} must be between 0 and 1",
                        details=[{"field": path, "issue": "Must be between 0 and 1"}],
                    )
            except (InvalidOperation, ValueError, TypeError):
                raise ValidationError(
                    message=f"Invalid numeric value for {path}",
                    details=[{"field": path, "issue": "Invalid numeric value"}],
                )

    return flat


def deep_merge(target: Dict[str, Any], source: Dict[str, Any]) -> Dict[str, Any]:
    """Deep merges source into target copy."""
    result = copy.deepcopy(target)
    for key, value in source.items():
        if isinstance(value, dict) and key in result and isinstance(result[key], dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = copy.deepcopy(value)
    return result


def _normalize_value(val: Any) -> Any:
    """Normalizes comparable values (e.g. Decimal vs int vs float string)."""
    if val is None:
        return None
    try:
        # Check if convertible to Decimal for numeric comparison
        return Decimal(str(val).strip())
    except (InvalidOperation, ValueError, TypeError):
        return val


def compute_diff(
    old_assumptions: Dict[str, Any],
    new_assumptions: Dict[str, Any],
) -> Tuple[List[str], Dict[str, Dict[str, Any]]]:
    """Computes changed field dot paths and before/after change summary."""
    old_flat = _flatten_dict(old_assumptions)
    new_flat = _flatten_dict(new_assumptions)

    all_keys = sorted(set(old_flat.keys()) | set(new_flat.keys()))
    changed_fields: List[str] = []
    change_summary: Dict[str, Dict[str, Any]] = {}

    for k in all_keys:
        old_v = old_flat.get(k)
        new_v = new_flat.get(k)

        norm_old = _normalize_value(old_v)
        norm_new = _normalize_value(new_v)

        if norm_old != norm_new:
            changed_fields.append(k)
            change_summary[k] = {
                "old": old_v,
                "new": new_v,
            }

    return changed_fields, change_summary

