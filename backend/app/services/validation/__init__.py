"""Validation service package providing validation stages registry and base protocols."""

from typing import Dict, List, Optional

from backend.app.services.validation.base import Stage, STAGE_ORDER
from backend.app.services.validation.stages.customer import CustomerStage
from backend.app.services.validation.stages.competitor import CompetitorStage
from backend.app.services.validation.stages.product_packaging import ProductPackagingStage
from backend.app.services.validation.stages.pricing import PricingStage
from backend.app.services.validation.stages.financial import FinancialStage
from backend.app.services.validation.stages.marketing import MarketingStage

STAGES: List[Stage] = [
    CustomerStage(),
    CompetitorStage(),
    ProductPackagingStage(),
    PricingStage(),
    FinancialStage(),
    MarketingStage(),
]

_STAGE_REGISTRY: Dict[str, Stage] = {stage.name: stage for stage in STAGES}


def get_stage(name: str) -> Optional[Stage]:
    """Retrieve a stage instance by name from the registry."""
    return _STAGE_REGISTRY.get(name)


from backend.app.services.validation.base import Finding, StageContext, StageResult, Status
from backend.app.services.validation.orchestrator import ValidationOrchestrator, resolve_stages_to_run
from backend.app.services.readiness import ReadinessResult, calculate_readiness, compute_readiness
from backend.app.services.validation.repository import get_latest_run, get_run, list_runs, save_run
from backend.app.services.validation import rules_config
from backend.app.services.validation.stages import STAGE_MAP

__all__ = [
    "STAGES",
    "get_stage",
    "STAGE_ORDER",
    "STAGE_MAP",
    "ValidationOrchestrator",
    "resolve_stages_to_run",
    "ReadinessResult",
    "calculate_readiness",
    "compute_readiness",
    "StageContext",
    "StageResult",
    "Status",
    "Finding",
    "rules_config",
    "get_latest_run",
    "get_run",
    "list_runs",
    "save_run",
]
