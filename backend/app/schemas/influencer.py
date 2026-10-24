from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class InfluencerBase(BaseModel):
    name: str = Field(..., description="Creator full name or brand name")
    handle: str = Field(..., description="Social handle (e.g. @priya.fits)")
    avatar_url: Optional[str] = None
    platform: str = Field(default="instagram", description="instagram, youtube, or tiktok")
    category: str = Field(..., description="Content vertical e.g. Fitness & Active, Eco-Living")
    bio: Optional[str] = None
    location: Optional[str] = "Global"

    follower_count: int = Field(default=10000, ge=100)
    follower_tier: str = Field(default="micro", description="nano, micro, mid, macro")
    engagement_rate: float = Field(default=3.5, ge=0.1, le=50.0)
    avg_views: int = Field(default=15000, ge=0)
    avg_likes: int = Field(default=1200, ge=0)

    niche_tags: List[str] = Field(default_factory=list)
    audience_demographics: Dict[str, Any] = Field(default_factory=dict)

    estimated_cost_per_post: Decimal = Field(default=Decimal("15000.00"), ge=0)
    deliverables_summary: str = Field(default="1x Dedicated Reel + 2x Stories")
    sample_content_url: Optional[str] = None

    status: str = Field(default="discovered", description="discovered, shortlisted, contacted, negotiating, signed, declined")
    notes: Optional[str] = None


class InfluencerCreate(InfluencerBase):
    product_id: Optional[UUID] = None


class InfluencerUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    estimated_cost_per_post: Optional[Decimal] = None
    deliverables_summary: Optional[str] = None


class InfluencerResponse(InfluencerBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: Optional[UUID] = None
    created_at: datetime


class MatchScoreBreakdown(BaseModel):
    overall_match_score: int = Field(..., ge=0, le=100)
    category_fit_score: int = Field(..., ge=0, le=100)
    audience_fit_score: int = Field(..., ge=0, le=100)
    economics_fit_score: int = Field(..., ge=0, le=100)
    engagement_fit_score: int = Field(..., ge=0, le=100)

    roi_verdict: str = Field(..., description="EXCELLENT_CAC, VIABLE, or HIGH_CAC_RISK")
    implied_cac: float
    target_cac: float
    cac_difference: float
    predicted_reach: int
    predicted_clicks: int
    predicted_orders: int
    estimated_revenue: float
    estimated_roas: float
    why_it_matches: List[str]
    suggested_deliverables: str


class InfluencerMatchResult(BaseModel):
    influencer: InfluencerResponse
    match_analytics: MatchScoreBreakdown


class InfluencerListResponse(BaseModel):
    items: List[InfluencerResponse]
    total: int


class InfluencerMatchListResponse(BaseModel):
    product_id: Optional[str] = None
    product_name: str
    product_category: str
    target_cac: float
    total_matched: int
    matches: List[InfluencerMatchResult]


class CustomMatchRequest(BaseModel):
    product_name: str
    category: str
    description: Optional[str] = None
    target_market: Optional[str] = None
    selling_price: float = 1299.0
    target_cac: float = 400.0
    marketing_budget: float = 50000.0
    platform_preference: Optional[str] = None  # all, instagram, youtube, tiktok
    follower_tier: Optional[str] = None  # all, nano, micro, mid, macro


class PitchRequest(BaseModel):
    influencer_id: UUID
    product_id: Optional[UUID] = None
    custom_product: Optional[CustomMatchRequest] = None
    outreach_tone: Optional[str] = "enthusiastic_founder"  # enthusiastic_founder, professional_direct, creative_story


class PitchResponse(BaseModel):
    influencer_id: UUID
    influencer_name: str
    influencer_handle: str
    dm_template: str
    email_template: str
    suggested_offer: str
    key_talking_points: List[str]
    subject_lines: List[str]
