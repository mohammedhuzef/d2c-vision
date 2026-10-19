from backend.app.services.validation.stages.customer import CustomerStage
from backend.app.services.validation.stages.competitor import CompetitorStage
from backend.app.services.validation.stages.product_packaging import ProductPackagingStage
from backend.app.services.validation.stages.pricing import PricingStage
from backend.app.services.validation.stages.financial import FinancialStage
from backend.app.services.validation.stages.marketing import MarketingStage

ALL_STAGES = [
    CustomerStage(),
    CompetitorStage(),
    ProductPackagingStage(),
    PricingStage(),
    FinancialStage(),
    MarketingStage(),
]

STAGE_MAP = {stage.name: stage for stage in ALL_STAGES}

ORDERED_STAGE_NAMES = [
    "customer",
    "competitor",
    "product_packaging",
    "pricing",
    "financial",
    "marketing",
]

__all__ = [
    "CustomerStage",
    "CompetitorStage",
    "ProductPackagingStage",
    "PricingStage",
    "FinancialStage",
    "MarketingStage",
    "ALL_STAGES",
    "STAGE_MAP",
    "ORDERED_STAGE_NAMES",
]
