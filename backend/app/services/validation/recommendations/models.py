"""Domain models and dataclasses for validation recommendations.

Matches RecommendationItemResponse schema from contracts/openapi.json:
- id (UUID format, deterministic uuid5)
- code (str)
- stage (str)
- priority (CRITICAL, HIGH, MEDIUM, LOW)
- title (str)
- detail (str)
- action_type (PROVIDE_INPUT, ADJUST_PRICE, REDUCE_COST, REDUCE_PACKAGING_COST,
               GATHER_EVIDENCE, IMPROVE_DIFFERENTIATION, REVISE_CHANNEL_MIX,
               REVIEW_ASSUMPTION)
- target_field (Optional[str])
- current_value (Optional[str])
- suggested_value (Optional[str])
- finding_codes (list[str])
- evidence_ids (list[str])
- impact (dict[str, Any])
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional
import uuid

# Namespace for deterministic Recommendation UUIDs
RECOMMENDATIONS_NAMESPACE = uuid.uuid5(uuid.NAMESPACE_DNS, "launchtwin.ai.recommendations")


class ActionType(str, Enum):
    PROVIDE_INPUT = "PROVIDE_INPUT"
    ADJUST_PRICE = "ADJUST_PRICE"
    REDUCE_COST = "REDUCE_COST"
    REDUCE_PACKAGING_COST = "REDUCE_PACKAGING_COST"
    GATHER_EVIDENCE = "GATHER_EVIDENCE"
    IMPROVE_DIFFERENTIATION = "IMPROVE_DIFFERENTIATION"
    REVISE_CHANNEL_MIX = "REVISE_CHANNEL_MIX"
    REVIEW_ASSUMPTION = "REVIEW_ASSUMPTION"


def deterministic_uuid5(stage: str, code: str, target_field: Optional[str] = None) -> str:
    """Generates a deterministic UUID5 string from (stage, code, target_field)."""
    key = f"{stage}:{code}:{target_field or ''}"
    return str(uuid.uuid5(RECOMMENDATIONS_NAMESPACE, key))


@dataclass(frozen=True)
class RecommendationItem:
    """Canonical recommendation item matching RecommendationItemResponse schema."""
    code: str
    stage: str
    priority: str
    title: str
    detail: str
    action_type: str
    id: str = field(default="")
    target_field: Optional[str] = None
    current_value: Optional[str] = None
    suggested_value: Optional[str] = None
    finding_codes: tuple[str, ...] = field(default_factory=tuple)
    evidence_ids: tuple[str, ...] = field(default_factory=tuple)
    impact: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.id:
            object.__setattr__(
                self,
                "id",
                deterministic_uuid5(self.stage, self.code, self.target_field),
            )
        if isinstance(self.action_type, ActionType):
            object.__setattr__(self, "action_type", self.action_type.value)
        if isinstance(self.finding_codes, list):
            object.__setattr__(self, "finding_codes", tuple(self.finding_codes))
        if isinstance(self.evidence_ids, list):
            object.__setattr__(self, "evidence_ids", tuple(self.evidence_ids))

    def to_dict(self) -> dict[str, Any]:
        """Converts the recommendation item to contract-matching JSON-serializable dictionary."""
        return {
            "id": self.id,
            "code": self.code,
            "stage": self.stage,
            "priority": self.priority,
            "title": self.title,
            "detail": self.detail,
            "action_type": self.action_type,
            "target_field": self.target_field,
            "current_value": self.current_value,
            "suggested_value": self.suggested_value,
            "finding_codes": list(self.finding_codes),
            "evidence_ids": list(self.evidence_ids),
            "impact": dict(self.impact),
        }

