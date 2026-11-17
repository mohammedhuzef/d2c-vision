"""Base types, enums, dataclasses, and abstract interfaces for validation stages.

Pure Python only: No imports from database, ORM, HTTP clients, or LLMs.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from decimal import Decimal
from enum import Enum
from typing import Any, Optional

from backend.app.services.validation.rules_config import STAGE_ORDER


class Status(str, Enum):
    """Validation stage status verdict."""
    PASSED = "PASSED"
    WARNING = "WARNING"
    FAILED = "FAILED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    NOT_RUN = "NOT_RUN"


class Severity(str, Enum):
    """Finding severity classification."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


@dataclass(frozen=True)
class Finding:
    """A deterministic observation or defect detected during stage execution."""
    code: str
    severity: Severity
    message: str
    evidence_ids: tuple[str, ...] = field(default_factory=tuple)
    field: Optional[str] = None

    def __post_init__(self) -> None:
        if isinstance(self.evidence_ids, (list, set)):
            object.__setattr__(self, "evidence_ids", tuple(self.evidence_ids))
        if isinstance(self.severity, str) and not isinstance(self.severity, Severity):
            object.__setattr__(self, "severity", Severity(self.severity))


@dataclass(frozen=True)
class StageResult:
    """The immutable evaluation output of an individual validation stage."""
    stage: str
    status: Status
    score: Optional[Decimal]
    metrics: dict[str, Any] = field(default_factory=dict)
    findings: tuple[Finding, ...] = field(default_factory=tuple)
    inputs_used: tuple[str, ...] = field(default_factory=tuple)
    upstream_stages_used: tuple[str, ...] = field(default_factory=tuple)
    carried_forward_from: Optional[str] = None

    def __post_init__(self) -> None:
        if isinstance(self.status, str) and not isinstance(self.status, Status):
            object.__setattr__(self, "status", Status(self.status))
        if isinstance(self.findings, list):
            object.__setattr__(self, "findings", tuple(self.findings))
        if isinstance(self.inputs_used, list):
            object.__setattr__(self, "inputs_used", tuple(self.inputs_used))
        if isinstance(self.upstream_stages_used, list):
            object.__setattr__(self, "upstream_stages_used", tuple(self.upstream_stages_used))


@dataclass(frozen=True)
class StageContext:
    """Context and dependencies provided to a stage runner."""
    assumptions: dict[str, Any]
    evidence: tuple[Any, ...] = field(default_factory=tuple)
    competitor_analyses: tuple[Any, ...] = field(default_factory=tuple)
    upstream: dict[str, StageResult] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if isinstance(self.evidence, list):
            object.__setattr__(self, "evidence", tuple(self.evidence))
        if isinstance(self.competitor_analyses, list):
            object.__setattr__(self, "competitor_analyses", tuple(self.competitor_analyses))


class Stage(ABC):
    """Abstract Base Class for pure validation stages."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Canonical stage name matching STAGE_ORDER."""
        pass

    @abstractmethod
    def run(self, ctx: StageContext) -> StageResult:
        """Execute stage validation logic deterministically."""
        pass


__all__ = [
    "Status",
    "Severity",
    "Finding",
    "StageResult",
    "StageContext",
    "Stage",
    "STAGE_ORDER",
]

