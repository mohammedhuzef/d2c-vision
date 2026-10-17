"""Pydantic V2 schemas for What-If Simulation.

Strict typing, Decimal-safe string representations for all monetary values, fractions,
scores and deltas. Strictly ZERO float fields for money or fractions.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SimulationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    overrides: Dict[str, Any] = Field(
        default_factory=dict,
        description="Dictionary of allowed assumption field overrides (e.g. selling_price, cogs_per_unit).",
    )


class SimulationStageResponse(BaseModel):
    status: str
    score: Optional[str] = None


class SimulationMetricsResponse(BaseModel):
    contribution_per_unit: Optional[str] = None
    margin_fraction: Optional[str] = None
    break_even_units: Optional[str] = None
    packaging_cost_fraction: Optional[str] = None
    cac_to_contribution_ratio: Optional[str] = None


class SimulationReadinessResponse(BaseModel):
    label: str
    score: Optional[str] = None


class SimulationProfileResponse(BaseModel):
    readiness: SimulationReadinessResponse
    stages: Dict[str, SimulationStageResponse]
    metrics: SimulationMetricsResponse


class SimulationChangeResponse(BaseModel):
    field: str
    baseline: Optional[str] = None
    simulated: Optional[str] = None
    delta: Optional[str] = None


class SimulationResponse(BaseModel):
    baseline: SimulationProfileResponse
    simulated: SimulationProfileResponse
    deltas: Dict[str, Optional[str]] = Field(default_factory=dict)
    changes: List[SimulationChangeResponse] = Field(default_factory=list)
