"""Dependency mapping and change-driven stage invalidation for LaunchTwin AI.

Maps changed field paths to the stages that read them directly, then takes
the transitive closure through downstream dependencies to determine which
stages must be re-evaluated.
"""

from typing import Iterable, List, Sequence, Set

from backend.app.services.validation.rules_config import STAGE_ORDER

# Mapping from field path prefixes to directly affected stage names
PREFIX_STAGE_MAP: dict[str, tuple[str, ...]] = {
    "customer": ("customer",),
    "product": ("competitor",),
    "packaging": ("product_packaging", "pricing", "financial"),
    "pricing": ("product_packaging", "pricing", "financial"),
    "costs": ("pricing", "financial"),
    "marketing": ("marketing",),
    "competitor": ("competitor",),
    "competitors": ("competitor",),
    "evidence": ("competitor",),
}

# Mapping from a stage to the downstream stages that depend on its outputs
DOWNSTREAM_MAP: dict[str, tuple[str, ...]] = {
    "customer": (),
    "competitor": ("pricing",),
    "product_packaging": (),
    "pricing": (),
    "financial": ("marketing",),
    "marketing": (),
}


def _resolve_direct_stages(field_path: str) -> tuple[str, ...]:
    """Resolves the direct stages affected by a single field path.

    Raises:
        ValueError: If the field path has an unknown prefix.
    """
    cleaned = field_path.strip()
    if not cleaned:
        raise ValueError("Field path cannot be empty")

    root = cleaned.split(".")[0].strip()
    if root not in PREFIX_STAGE_MAP:
        raise ValueError(f"Unknown field path: {field_path}")

    return PREFIX_STAGE_MAP[root]


def affected_stages(changed_fields: Sequence[str]) -> List[str]:
    """Computes the list of stages affected by the given changed field paths.

    Computes direct stage readers and takes the transitive closure through
    downstream dependencies. Returns stage names ordered strictly by STAGE_ORDER.

    Args:
        changed_fields: Sequence of changed field paths (e.g. ['packaging.packaging_cost']).

    Returns:
        List of affected stage names in STAGE_ORDER. Empty if changed_fields is empty.

    Raises:
        ValueError: If any field path cannot be resolved to known stages.
    """
    if not changed_fields:
        return []

    direct_stages: Set[str] = set()
    for field_path in changed_fields:
        stages = _resolve_direct_stages(field_path)
        direct_stages.update(stages)

    # Transitive closure across DOWNSTREAM_MAP
    visited: Set[str] = set(direct_stages)
    queue: List[str] = list(direct_stages)

    while queue:
        current = queue.pop(0)
        for downstream in DOWNSTREAM_MAP.get(current, ()):
            if downstream not in visited:
                visited.add(downstream)
                queue.append(downstream)

    # Return ordered strictly according to STAGE_ORDER
    return [stage for stage in STAGE_ORDER if stage in visited]

