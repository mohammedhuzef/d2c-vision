import fnmatch
from typing import Dict, List, Set

from backend.app.services.validation.stages import ORDERED_STAGE_NAMES

# Explicit map: input field pattern -> stages reading it directly
# 1. packaging.packaging_cost -> product_packaging, pricing, financial
# 2. packaging.* (other fields) -> product_packaging, financial
FIELD_TO_DIRECT_STAGES: Dict[str, Set[str]] = {
    "customer.*": {"customer"},
    "product.*": {"product_packaging", "competitor"},
    "packaging.packaging_cost": {"product_packaging", "pricing", "financial"},
    "packaging.*": {"product_packaging", "financial"},
    "pricing.selling_price": {"pricing", "financial", "product_packaging"},
    "pricing.target_margin_fraction": {"pricing", "financial"},
    "pricing.*": {"pricing", "financial"},
    "costs.packaging_cost": {"product_packaging", "pricing", "financial"},
    "costs.*": {"financial", "pricing"},
    "marketing.*": {"marketing"},
    "competitors.*": {"competitor"},
    "evidence.*": {"competitor"},
}

# Upstream output dependency graph: stage -> what it directly depends on
# STAGE_DEPENDS_ON: pricing<-competitor, financial<-pricing, marketing<-financial
STAGE_DEPENDS_ON: Dict[str, Set[str]] = {
    "customer": set(),
    "competitor": set(),
    "product_packaging": set(),
    "pricing": {"competitor"},
    "financial": {"pricing"},
    "marketing": {"financial"},
}

# Forward downstream dependency graph (exact inverse of STAGE_DEPENDS_ON)
STAGE_DOWNSTREAM: Dict[str, Set[str]] = {
    "customer": set(),
    "competitor": {"pricing"},
    "product_packaging": set(),
    "pricing": {"financial"},
    "financial": {"marketing"},
    "marketing": set(),
}


def get_direct_stages_for_field(field_path: str) -> Set[str]:
    """Finds all stages directly reading a given dotted field path."""
    direct = set()
    for pattern, stages in FIELD_TO_DIRECT_STAGES.items():
        if fnmatch.fnmatch(field_path, pattern):
            direct.update(stages)
    return direct


def get_affected_stages(changed_fields: List[str]) -> List[str]:
    """
    Computes transitive closure of affected stages given changed fields:
    affected_stages = direct stages + all stages transitively downstream.
    Returned in canonical execution order.
    """
    direct_stages: Set[str] = set()
    for field_path in changed_fields:
        direct_stages.update(get_direct_stages_for_field(field_path))

    # Transitive closure over forward STAGE_DOWNSTREAM
    visited: Set[str] = set(direct_stages)
    queue: List[str] = list(direct_stages)

    while queue:
        curr = queue.pop(0)
        for downstream in STAGE_DOWNSTREAM.get(curr, set()):
            if downstream not in visited:
                visited.add(downstream)
                queue.append(downstream)

    # Return ordered list matching canonical stage pipeline
    return [stage for stage in ORDERED_STAGE_NAMES if stage in visited]
