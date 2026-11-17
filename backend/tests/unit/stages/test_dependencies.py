"""Unit tests for dependency mapping and affected stages calculation."""

import pytest

from backend.app.services.validation.dependencies import affected_stages
from backend.app.services.validation.rules_config import STAGE_ORDER


def test_affected_stages_empty():
    """Empty changed_fields returns empty list."""
    assert affected_stages([]) == []


def test_affected_stages_packaging_cost_transitive_closure():
    """packaging.packaging_cost affects product_packaging, pricing, financial directly;

    financial affects marketing downstream.
    Must return [product_packaging, pricing, financial, marketing] in STAGE_ORDER.
    """
    affected = affected_stages(["packaging.packaging_cost"])
    assert affected == ["product_packaging", "pricing", "financial", "marketing"]


def test_affected_stages_customer():
    """customer.* only affects customer stage."""
    affected = affected_stages(["customer.target_customer", "customer.problem_statement"])
    assert affected == ["customer"]


def test_affected_stages_product_and_competitor():
    """product.* and competitor affect competitor directly, which affects pricing downstream."""
    affected_prod = affected_stages(["product.title"])
    assert affected_prod == ["competitor", "pricing"]

    affected_comp = affected_stages(["competitor"])
    assert affected_comp == ["competitor", "pricing"]

    affected_evid = affected_stages(["evidence"])
    assert affected_evid == ["competitor", "pricing"]


def test_affected_stages_costs():
    """costs.* affects pricing and financial directly; financial affects marketing downstream."""
    affected = affected_stages(["costs.shipping_cost_per_unit"])
    assert affected == ["pricing", "financial", "marketing"]


def test_affected_stages_marketing():
    """marketing.* only affects marketing stage."""
    affected = affected_stages(["marketing.expected_cac"])
    assert affected == ["marketing"]


def test_affected_stages_multiple_fields_preserves_stage_order():
    """Multiple changed fields produce union in STAGE_ORDER."""
    affected = affected_stages(["customer.interviews", "marketing.channels"])
    assert affected == ["customer", "marketing"]


def test_affected_stages_unknown_field_raises_value_error():
    """Unknown field paths raise ValueError loudly."""
    with pytest.raises(ValueError, match="Unknown field path"):
        affected_stages(["unknown_prefix.field"])

    with pytest.raises(ValueError, match="Field path cannot be empty"):
        affected_stages([""])

