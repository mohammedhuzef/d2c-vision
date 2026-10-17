"""What-If Simulation Engine for LaunchTwin AI.

Pure functions, Decimal only, no I/O, no DB/network/LLM dependencies.
Allows testing hypothetical pricing, cost, or marketing adjustments against
project assumptions without modifying project state or creating validation runs.
"""

from dataclasses import dataclass, field
import decimal
from decimal import Decimal, ROUND_HALF_UP, localcontext
import json
from typing import Any, Dict, List, Optional, Set, Tuple, Union

from backend.app.schemas.assumptions import Assumptions
from backend.app.services.validation.base import StageContext, StageResult, Status, STAGE_ORDER
from backend.app.services.validation.pipeline import run_pipeline
from backend.app.services.validation import rules_config


class SimulationValidationError(ValueError):
    """Raised when simulation overrides contain unknown fields, non-numeric or negative values."""
    pass


@dataclass(frozen=True)
class SimulationStageSummary:
    status: str
    score: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status,
            "score": self.score,
        }


@dataclass(frozen=True)
class SimulationMetricsSummary:
    contribution_per_unit: Optional[str] = None
    margin_fraction: Optional[str] = None
    break_even_units: Optional[str] = None
    packaging_cost_fraction: Optional[str] = None
    cac_to_contribution_ratio: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "contribution_per_unit": self.contribution_per_unit,
            "margin_fraction": self.margin_fraction,
            "break_even_units": self.break_even_units,
            "packaging_cost_fraction": self.packaging_cost_fraction,
            "cac_to_contribution_ratio": self.cac_to_contribution_ratio,
        }


@dataclass(frozen=True)
class SimulationReadinessSummary:
    label: str
    score: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "label": self.label,
            "score": self.score,
        }


@dataclass(frozen=True)
class SimulationProfile:
    readiness: SimulationReadinessSummary
    stages: Dict[str, SimulationStageSummary]
    metrics: SimulationMetricsSummary

    def to_dict(self) -> Dict[str, Any]:
        return {
            "readiness": self.readiness.to_dict(),
            "stages": {k: v.to_dict() for k, v in self.stages.items()},
            "metrics": self.metrics.to_dict(),
        }


@dataclass(frozen=True)
class SimulationChange:
    field: str
    baseline: Optional[str]
    simulated: Optional[str]
    delta: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        res: Dict[str, Any] = {
            "field": self.field,
            "baseline": self.baseline,
            "simulated": self.simulated,
        }
        if self.delta is not None:
            res["delta"] = self.delta
        return res


@dataclass(frozen=True)
class SimulationResult:
    baseline: SimulationProfile
    simulated: SimulationProfile
    deltas: Dict[str, Optional[str]]
    changes: List[SimulationChange]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "baseline": self.baseline.to_dict(),
            "simulated": self.simulated.to_dict(),
            "deltas": dict(self.deltas),
            "changes": [c.to_dict() for c in self.changes],
        }


def _validate_and_parse_overrides(overrides: Dict[str, Any]) -> Dict[str, Decimal]:
    """Validates override fields and values strictly."""
    if not isinstance(overrides, dict):
        raise SimulationValidationError("Overrides must be a JSON dictionary of field-value pairs.")

    allowed: Set[str] = rules_config.ALLOWED_SIMULATION_OVERRIDE_FIELDS
    parsed: Dict[str, Decimal] = {}

    for k, v in overrides.items():
        if k not in allowed:
            raise SimulationValidationError(
                f"Unknown override field: '{k}'. Allowed fields are: {sorted(allowed)}"
            )

        if v is None:
            raise SimulationValidationError(f"Override field '{k}' cannot be null.")

        # Attempt Decimal conversion
        try:
            val_str = str(v).strip()
            dec_val = Decimal(val_str)
            if dec_val.is_nan() or dec_val.is_infinite():
                raise ValueError
        except (decimal.InvalidOperation, ValueError, TypeError):
            raise SimulationValidationError(
                f"Value for override field '{k}' must be a valid numeric Decimal string, got '{v}'."
            )

        if dec_val < rules_config.DECIMAL_ZERO:
            raise SimulationValidationError(
                f"Override field '{k}' must be non-negative, got '{v}'."
            )

        parsed[k] = dec_val

    return parsed


def _build_overridden_assumptions(
    base_assumptions: Union[Assumptions, Dict[str, Any]],
    parsed_overrides: Dict[str, Decimal],
) -> Assumptions:
    """Clones base assumptions and applies validated override values."""
    if isinstance(base_assumptions, Assumptions):
        d = base_assumptions.model_dump()
    else:
        d = json.loads(json.dumps(base_assumptions, default=str))

    for k, val in parsed_overrides.items():
        if k == "selling_price":
            d.setdefault("pricing", {})["selling_price"] = val
        elif k in ("cogs_per_unit", "unit_cogs"):
            d.setdefault("costs", {})["cogs_per_unit"] = val
        elif k == "packaging_cost":
            d.setdefault("packaging", {})["packaging_cost"] = val
            d.setdefault("costs", {})["packaging_cost"] = val
        elif k in (
            "shipping_cost_per_unit",
            "other_variable_cost_per_unit",
            "payment_fee_fraction",
            "payment_fee_fixed",
            "platform_fee_fraction",
            "fixed_costs_total",
        ):
            d.setdefault("costs", {})[k] = val
        elif k == "target_margin_fraction":
            d.setdefault("pricing", {})["target_margin_fraction"] = val
        elif k in ("expected_cac", "monthly_budget", "expected_conversion_rate_fraction"):
            d.setdefault("marketing", {})[k] = val

    return Assumptions.model_validate(d)


def _extract_profile(
    stage_results: List[StageResult],
    readiness_res: Any,
) -> SimulationProfile:
    """Builds a normalized SimulationProfile from pipeline stage results and readiness."""
    res_map = {r.stage: r for r in stage_results}

    # 1. Readiness
    readiness_score_str = None
    if readiness_res.overall_score is not None:
        readiness_score_str = f"{readiness_res.overall_score:.2f}"

    readiness_summary = SimulationReadinessSummary(
        label=readiness_res.label,
        score=readiness_score_str,
    )

    # 2. Stage summaries
    stages_dict: Dict[str, SimulationStageSummary] = {}
    for stage_name in STAGE_ORDER:
        r = res_map.get(stage_name)
        if r is None:
            stages_dict[stage_name] = SimulationStageSummary(status=Status.NOT_RUN.value, score=None)
        else:
            score_str = f"{r.score:.2f}" if r.score is not None else None
            status_val = r.status.value if isinstance(r.status, Status) else str(r.status)
            stages_dict[stage_name] = SimulationStageSummary(status=status_val, score=score_str)

    # 3. Key Metrics
    fin_res = res_map.get("financial")
    pkg_res = res_map.get("product_packaging")
    mkt_res = res_map.get("marketing")

    fin_metrics = fin_res.metrics if fin_res and fin_res.metrics else {}
    pkg_metrics = pkg_res.metrics if pkg_res and pkg_res.metrics else {}
    mkt_metrics = mkt_res.metrics if mkt_res and mkt_res.metrics else {}

    # contribution_per_unit (money 2 dp)
    cpu_val = fin_metrics.get("contribution_per_unit")
    cpu_str = f"{Decimal(str(cpu_val)):.2f}" if cpu_val is not None else None

    # margin_fraction (fraction 4 dp)
    mf_val = fin_metrics.get("contribution_margin")
    mf_str = f"{Decimal(str(mf_val)):.4f}" if mf_val is not None else None

    # break_even_units (integer string)
    be_val = fin_metrics.get("break_even_units")
    be_str = str(be_val) if be_val is not None else None

    # packaging_cost_fraction (fraction 4 dp)
    pcf_val = pkg_metrics.get("packaging_cost_fraction")
    pcf_str = f"{Decimal(str(pcf_val)):.4f}" if pcf_val is not None else None

    # cac_to_contribution_ratio (fraction 4 dp)
    cac_val = mkt_metrics.get("cac_to_contribution_ratio")
    cac_str = f"{Decimal(str(cac_val)):.4f}" if cac_val is not None else None

    metrics_summary = SimulationMetricsSummary(
        contribution_per_unit=cpu_str,
        margin_fraction=mf_str,
        break_even_units=be_str,
        packaging_cost_fraction=pcf_str,
        cac_to_contribution_ratio=cac_str,
    )

    return SimulationProfile(
        readiness=readiness_summary,
        stages=stages_dict,
        metrics=metrics_summary,
    )


def _format_delta(
    base: Optional[str],
    sim: Optional[str],
    kind: str,
) -> Optional[str]:
    """
    Computes and formats a signed delta string:
    - 'money' or 'score': 2 dp, e.g. '+30.00' or '-10.00'
    - 'fraction': 4 dp, e.g. '+0.0600' or '-0.0100'
    - 'integer': signed int, e.g. '-23' or '+10'
    """
    if base is None or sim is None:
        return None
    try:
        dec_base = Decimal(base)
        dec_sim = Decimal(sim)
        diff = dec_sim - dec_base
        if kind in ("money", "score"):
            return f"{diff:+.2f}"
        elif kind == "fraction":
            return f"{diff:+.4f}"
        elif kind == "integer":
            int_diff = int(dec_sim) - int(dec_base)
            return f"{int_diff:+d}"
    except Exception:
        return None
    return None


def simulate(
    assumptions: Union[Assumptions, Dict[str, Any]],
    overrides: Dict[str, Any],
    evidence: Optional[List[Any]] = None,
    competitors: Optional[List[Any]] = None,
    competitor_analyses: Optional[List[Any]] = None,
) -> SimulationResult:
    """
    Simulates validation results with hypothetical overrides applied.
    Pure engine: plain data in, plain data out, no DB side effects, no validation runs created.

    Steps:
    1. Validate overrides strictly (allowed fields only, valid non-negative numbers).
    2. Build baseline and simulated StageContexts.
    3. Run ALL six stages in STAGE_ORDER via shared run_pipeline.
    4. Compute baseline vs simulated metrics, readiness, and stage profiles.
    5. Calculate deltas and construct changes list for any moved statuses, labels, or metrics.
    """
    with localcontext() as ctx:
        ctx.prec = 50
        ctx.rounding = ROUND_HALF_UP

        parsed_overrides = _validate_and_parse_overrides(overrides)

        # Baseline assumptions
        if isinstance(assumptions, Assumptions):
            base_assumptions = assumptions
        else:
            base_assumptions = Assumptions.model_validate(assumptions)

        # Overridden assumptions
        sim_assumptions = _build_overridden_assumptions(base_assumptions, parsed_overrides)

        ev_list = list(evidence) if evidence else []
        comp_list = list(competitors) if competitors else []
        an_list = list(competitor_analyses) if competitor_analyses else []

        # Run Baseline Pipeline
        base_ctx = StageContext(
            assumptions=base_assumptions,
            competitors=comp_list,
            evidence=ev_list,
            competitor_analyses=an_list,
            upstream={},
        )
        base_stages, base_readiness, _ = run_pipeline(base_ctx)
        base_profile = _extract_profile(base_stages, base_readiness)

        # Run Simulated Pipeline
        sim_ctx = StageContext(
            assumptions=sim_assumptions,
            competitors=comp_list,
            evidence=ev_list,
            competitor_analyses=an_list,
            upstream={},
        )
        sim_stages, sim_readiness, _ = run_pipeline(sim_ctx)
        sim_profile = _extract_profile(sim_stages, sim_readiness)

        # Compute Deltas for Key Metrics and Readiness Score
        deltas: Dict[str, Optional[str]] = {
            "readiness_score": _format_delta(
                base_profile.readiness.score, sim_profile.readiness.score, "score"
            ),
            "contribution_per_unit": _format_delta(
                base_profile.metrics.contribution_per_unit,
                sim_profile.metrics.contribution_per_unit,
                "money",
            ),
            "margin_fraction": _format_delta(
                base_profile.metrics.margin_fraction,
                sim_profile.metrics.margin_fraction,
                "fraction",
            ),
            "break_even_units": _format_delta(
                base_profile.metrics.break_even_units,
                sim_profile.metrics.break_even_units,
                "integer",
            ),
            "packaging_cost_fraction": _format_delta(
                base_profile.metrics.packaging_cost_fraction,
                sim_profile.metrics.packaging_cost_fraction,
                "fraction",
            ),
            "cac_to_contribution_ratio": _format_delta(
                base_profile.metrics.cac_to_contribution_ratio,
                sim_profile.metrics.cac_to_contribution_ratio,
                "fraction",
            ),
        }

        # Identify all changes that moved
        changes: List[SimulationChange] = []

        # 1. Readiness label
        if base_profile.readiness.label != sim_profile.readiness.label:
            changes.append(
                SimulationChange(
                    field="readiness.label",
                    baseline=base_profile.readiness.label,
                    simulated=sim_profile.readiness.label,
                )
            )

        # 2. Readiness score
        if base_profile.readiness.score != sim_profile.readiness.score:
            changes.append(
                SimulationChange(
                    field="readiness.score",
                    baseline=base_profile.readiness.score,
                    simulated=sim_profile.readiness.score,
                    delta=deltas["readiness_score"],
                )
            )

        # 3. Stage statuses and scores
        for stage_name in STAGE_ORDER:
            b_stage = base_profile.stages.get(stage_name)
            s_stage = sim_profile.stages.get(stage_name)
            if b_stage and s_stage:
                if b_stage.status != s_stage.status:
                    changes.append(
                        SimulationChange(
                            field=f"stages.{stage_name}.status",
                            baseline=b_stage.status,
                            simulated=s_stage.status,
                        )
                    )
                if b_stage.score != s_stage.score:
                    st_delta = _format_delta(b_stage.score, s_stage.score, "score")
                    changes.append(
                        SimulationChange(
                            field=f"stages.{stage_name}.score",
                            baseline=b_stage.score,
                            simulated=s_stage.score,
                            delta=st_delta,
                        )
                    )

        # 4. Key Metrics changes
        metric_pairs = [
            ("metrics.contribution_per_unit", base_profile.metrics.contribution_per_unit, sim_profile.metrics.contribution_per_unit, deltas["contribution_per_unit"]),
            ("metrics.margin_fraction", base_profile.metrics.margin_fraction, sim_profile.metrics.margin_fraction, deltas["margin_fraction"]),
            ("metrics.break_even_units", base_profile.metrics.break_even_units, sim_profile.metrics.break_even_units, deltas["break_even_units"]),
            ("metrics.packaging_cost_fraction", base_profile.metrics.packaging_cost_fraction, sim_profile.metrics.packaging_cost_fraction, deltas["packaging_cost_fraction"]),
            ("metrics.cac_to_contribution_ratio", base_profile.metrics.cac_to_contribution_ratio, sim_profile.metrics.cac_to_contribution_ratio, deltas["cac_to_contribution_ratio"]),
        ]

        for m_field, b_val, s_val, d_val in metric_pairs:
            if b_val != s_val:
                changes.append(
                    SimulationChange(
                        field=m_field,
                        baseline=b_val,
                        simulated=s_val,
                        delta=d_val,
                    )
                )

        return SimulationResult(
            baseline=base_profile,
            simulated=sim_profile,
            deltas=deltas,
            changes=changes,
        )
