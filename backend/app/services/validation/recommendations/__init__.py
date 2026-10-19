"""Recommendations Engine Package.

Deterministic, rules-based recommendations derived from validation stage findings and readiness.
"""

from backend.app.services.validation.recommendations.models import (
    ActionType,
    Priority,
    Recommendation,
)
from backend.app.services.validation.recommendations.generator import (
    generate_recommendations,
)
from backend.app.services.validation.recommendations.rules import (
    RECOMMENDATION_RULE_TABLE,
)

__all__ = [
    "ActionType",
    "Priority",
    "Recommendation",
    "generate_recommendations",
    "RECOMMENDATION_RULE_TABLE",
]
