from dataclasses import dataclass, field
from decimal import Decimal
from enum import Enum
import json
from typing import Any, Dict, List, Optional
from uuid import UUID

from backend.app.services.validation import rules_config


class Priority(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ActionType(str, Enum):
    PROVIDE_INPUT = "PROVIDE_INPUT"
    ADJUST_PRICE = "ADJUST_PRICE"
    REDUCE_COST = "REDUCE_COST"
    REDUCE_PACKAGING_COST = "REDUCE_PACKAGING_COST"
    GATHER_EVIDENCE = "GATHER_EVIDENCE"
    IMPROVE_DIFFERENTIATION = "IMPROVE_DIFFERENTIATION"
    REVISE_CHANNEL_MIX = "REVISE_CHANNEL_MIX"
    REVIEW_ASSUMPTION = "REVIEW_ASSUMPTION"


@dataclass(frozen=True)
class Recommendation:
    id: UUID
    code: str
    stage: str
    priority: Priority
    title: str
    detail: str
    action_type: ActionType
    target_field: Optional[str] = None
    current_value: Optional[str] = None
    suggested_value: Optional[str] = None
    finding_codes: List[str] = field(default_factory=list)
    evidence_ids: List[UUID] = field(default_factory=list)
    impact: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """
        Serializes Recommendation to JSON-safe dictionary adhering to strict formatting:
        - Money as strings with 2 dp
        - Fractions as numbers with 4 dp
        - Scores as numbers with 2 dp
        - Strict Decimal only
        """
        formatted_impact = {}
        for k, v in self.impact.items():
            if isinstance(v, Decimal):
                if any(m in k for m in ("price", "cost", "cogs", "cac", "ceiling", "budget")):
                    formatted_impact[k] = f"{v:.2f}"
                elif any(f in k for f in ("fraction", "ratio", "margin", "gap")):
                    formatted_impact[k] = json.loads(f"{v:.4f}")
                elif "score" in k:
                    formatted_impact[k] = json.loads(f"{v:.2f}")
                else:
                    formatted_impact[k] = f"{v:.2f}"
            elif isinstance(v, UUID):
                formatted_impact[k] = str(v)
            else:
                formatted_impact[k] = v

        return {
            "id": str(self.id),
            "code": self.code,
            "stage": self.stage,
            "priority": self.priority.value if isinstance(self.priority, Priority) else str(self.priority),
            "title": self.title,
            "detail": self.detail,
            "action_type": self.action_type.value if isinstance(self.action_type, ActionType) else str(self.action_type),
            "target_field": self.target_field,
            "current_value": self.current_value,
            "suggested_value": self.suggested_value,
            "finding_codes": list(self.finding_codes),
            "evidence_ids": [str(eid) for eid in self.evidence_ids],
            "impact": formatted_impact,
        }
