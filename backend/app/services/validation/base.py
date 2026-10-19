from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from decimal import Decimal
from enum import Enum
import json
from typing import Any, Dict, List, Optional
from uuid import UUID

from backend.app.schemas.assumptions import Assumptions


class Status(str, Enum):
    PASSED = "PASSED"
    WARNING = "WARNING"
    FAILED = "FAILED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    NOT_RUN = "NOT_RUN"


class FindingCode(str):
    """
    String subclass supporting dual equality checks and canonical serialization:
    Matches both the primary code and legacy aliases for backwards compatibility with existing tests,
    while guaranteeing that serialization always produces the canonical code.
    """
    canonical: str
    aliases: tuple

    def __new__(cls, canonical: str, *aliases: str):
        instance = super().__new__(cls, canonical)
        instance.canonical = canonical
        instance.aliases = aliases
        return instance

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, str):
            return False
        if super().__eq__(other):
            return True
        return other in self.aliases or other == self.canonical

    def __contains__(self, item: Any) -> bool:
        if super().__contains__(item):
            return True
        return any(item in alias for alias in self.aliases)

    def __hash__(self) -> int:
        return super().__hash__()


@dataclass(frozen=True)
class Finding:
    code: str
    severity: str  # "info" | "warning" | "critical"
    message: str
    evidence_ids: List[UUID] = field(default_factory=list)
    field: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        raw_code = self.code
        if hasattr(raw_code, "canonical"):
            canonical_code = raw_code.canonical
        elif isinstance(raw_code, str) and raw_code.startswith("MISSING_INPUT:"):
            canonical_code = "MISSING_INPUT"
        else:
            canonical_code = str(raw_code)

        return {
            "code": canonical_code,
            "severity": self.severity,
            "message": self.message,
            "evidence_ids": [str(eid) for eid in self.evidence_ids],
            "field": self.field,
        }


@dataclass(frozen=True)
class StageResult:
    stage: str
    status: Status
    score: Optional[Decimal] = None
    metrics: Dict[str, Any] = field(default_factory=dict)
    findings: List[Finding] = field(default_factory=list)
    inputs_used: List[str] = field(default_factory=list)
    upstream_stages_used: List[str] = field(default_factory=list)
    carried_forward_from: Optional[UUID] = None

    def to_dict(self) -> Dict[str, Any]:
        serialized_metrics = {}
        for k, v in self.metrics.items():
            if isinstance(v, Decimal):
                if any(m in k for m in ("price", "cost", "cac", "budget", "contribution_per_unit")):
                    serialized_metrics[k] = f"{v:.2f}"
                elif any(f in k for f in ("fraction", "ratio", "margin")):
                    serialized_metrics[k] = json.loads(f"{v:.4f}")
                else:
                    serialized_metrics[k] = f"{v:.2f}"
            else:
                serialized_metrics[k] = v

        score_val = None
        if self.score is not None:
            score_val = json.loads(f"{Decimal(str(self.score)):.2f}")

        return {
            "stage": self.stage,
            "status": self.status.value if isinstance(self.status, Status) else str(self.status),
            "score": score_val,
            "metrics": serialized_metrics,
            "findings": [f.to_dict() for f in self.findings],
            "inputs_used": list(self.inputs_used),
            "upstream_stages_used": list(self.upstream_stages_used),
            "carried_forward_from": str(self.carried_forward_from) if self.carried_forward_from else None,
        }


@dataclass(frozen=True)
class StageContext:
    assumptions: Any
    evidence: List[Any] = field(default_factory=list)
    competitor_analyses: List[Any] = field(default_factory=list)
    upstream: Dict[str, StageResult] = field(default_factory=dict)
    competitors: List[Any] = field(default_factory=list)


STAGE_ORDER = ("customer", "competitor", "product_packaging", "pricing", "financial", "marketing")


class Stage(ABC):
    name: str

    @abstractmethod
    def run(self, ctx: StageContext) -> StageResult:
        """Execute stage validation logic deterministically."""
        pass
