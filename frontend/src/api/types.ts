import type { components, paths } from './schema';

export type Schemas = components['schemas'];

// Products
export type ProductCreate = Schemas['ProductCreate'];
export type ProductResponse = Schemas['ProductResponse'];
export type ProductDetailResponse = Schemas['ProductDetailResponse'];
export type ProductListResponse = Schemas['ProductListResponse'];

// Assumptions
export type AssumptionsPatchRequest = Schemas['AssumptionsPatchRequest'];
export type AssumptionsPatchResponse = Schemas['AssumptionsPatchResponse'];
export type AssumptionsInput = Schemas['Assumptions-Input'];
export type AssumptionsOutput = Schemas['Assumptions-Output'];

// Competitors
export type CompetitorCreate = Schemas['CompetitorCreate'];
export type CompetitorItem = Schemas['CompetitorItem'];
export type CompetitorListResponse = Schemas['CompetitorListResponse'];
export type CompetitorDetailResponse = Schemas['CompetitorDetailResponse'];

// Research
export type ResearchStartResponse = Schemas['ResearchStartResponse'];
export type ResearchStatusResponse = Schemas['ResearchStatusResponse'];
export type ResearchIngestRequest = Schemas['ResearchIngestRequest'];
export type ResearchIngestResponse = Schemas['ResearchIngestResponse'];
export type AnalysisIn = Schemas['AnalysisIn'];
export type EvidenceIn = Schemas['EvidenceIn'];

// Validation
export type ValidationRunResponse = Schemas['ValidationRunResponse'];
export type ValidationRunDetailResponse = Schemas['ValidationRunDetailResponse'];
export type ValidationRunListResponse = Schemas['ValidationRunListResponse'];
export type ValidationRunSummaryResponse = Schemas['ValidationRunDetailResponse'];
export type StageResultDetailResponse = Schemas['StageResultDetailResponse'];
export type StageResultResponse = Schemas['StageResultResponse'];
export type FindingResponse = Schemas['FindingResponse'];
export type ReadinessResponse = Schemas['ReadinessResponse'];
export type RunRecommendationListResponse = Schemas['RunRecommendationListResponse'];
export type RecommendationItemResponse = Schemas['RecommendationItemResponse'];
export type SimulationRequest = Schemas['SimulationRequest'];
export type SimulationResponse = Schemas['SimulationResponse'];
export type SimulationProfileResponse = Schemas['SimulationProfileResponse'];

// Versions & Reports
export type ProductVersionListResponse = Schemas['ProductVersionListResponse'];
export type ProductVersionResponse = Schemas['ProductVersionResponse'];
export type VersionCompareResponse = Schemas['VersionCompareResponse'];
export type ImpactEventResponse = Schemas['ImpactEventResponse'];
export type ReportResponse = Schemas['ReportResponse'];
export type ReportListResponse = Schemas['ReportListResponse'];

// Influencers
export interface InfluencerResponse {
  id: string;
  name: string;
  handle: string;
  avatar_url?: string | null;
  platform: string;
  category: string;
  bio?: string | null;
  location?: string | null;
  follower_count: number;
  follower_tier: string;
  engagement_rate: number;
  avg_views: number;
  avg_likes: number;
  niche_tags: string[];
  audience_demographics: Record<string, any>;
  estimated_cost_per_post: string;
  deliverables_summary: string;
  sample_content_url?: string | null;
  notes?: string | null;
  product_id?: string | null;
  status: string;
  created_at: string;
}

export interface InfluencerCreate {
  name: string;
  handle: string;
  avatar_url?: string | null;
  platform?: string;
  category: string;
  bio?: string | null;
  location?: string | null;
  follower_count?: number;
  follower_tier?: string;
  engagement_rate?: number;
  avg_views?: number;
  avg_likes?: number;
  niche_tags?: string[];
  audience_demographics?: Record<string, any>;
  estimated_cost_per_post?: string | number;
  deliverables_summary?: string;
  sample_content_url?: string | null;
  notes?: string | null;
  product_id?: string | null;
}

export interface InfluencerListResponse {
  items: InfluencerResponse[];
  total: number;
}

export interface CustomMatchRequest {
  product_name: string;
  category: string;
  description?: string;
  target_market?: string;
  selling_price?: number;
  target_cac?: number;
  marketing_budget?: number;
  platform_preference?: string;
  follower_tier?: string;
}

export interface MatchScoreBreakdown {
  overall_match_score: number;
  category_fit_score: number;
  audience_fit_score: number;
  economics_fit_score: number;
  engagement_fit_score: number;
  roi_verdict: string;
  implied_cac: number;
  target_cac: number;
  cac_difference: number;
  predicted_reach: number;
  predicted_clicks: number;
  predicted_orders: number;
  estimated_revenue: number;
  estimated_roas: number;
  why_it_matches: string[];
  suggested_deliverables: string;
}

export interface InfluencerMatchResult {
  influencer: InfluencerResponse;
  match_analytics: MatchScoreBreakdown;
}

export interface InfluencerMatchListResponse {
  product_id?: string | null;
  product_name: string;
  product_category: string;
  target_cac: number;
  total_matched: number;
  matches: InfluencerMatchResult[];
  is_sample: boolean;
  disclaimer: string;
}

export interface InfluencerUpdate {
  status?: string;
  notes?: string;
  estimated_cost_per_post?: string | number;
  deliverables_summary?: string;
}

export interface PitchRequest {
  influencer_id: string;
  product_id?: string;
  custom_product?: CustomMatchRequest;
  outreach_tone?: string;
}

export interface PitchResponse {
  influencer_id: string;
  influencer_name: string;
  influencer_handle: string;
  dm_template: string;
  email_template: string;
  suggested_offer: string;
  key_talking_points: string[];
  subject_lines: string[];
}

// Projects
export interface ProjectItem {
  id: string;
  name: string;
  category: string;
  targetMarket?: string;
  sellingPrice: number;
  mfgCost: number;
  moq?: number;
  marketingBudget?: number;
  margin: number;
  description?: string;
  ingredients?: string;
  targetAudience?: string;
  image: string;
  status: 'In Progress' | 'Completed' | 'Research' | 'Idea Stage';
  viabilityScore: number;
  viabilityGrade?: string;
  report?: any;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListResponse {
  items: ProjectItem[];
  total: number;
  limit: number;
  offset: number;
}

// Enums / Literals
export type StageName =
  | 'customer'
  | 'competitor'
  | 'product_packaging'
  | 'pricing'
  | 'financial'
  | 'marketing';

export type StageStatus =
  | 'PASSED'
  | 'WARNING'
  | 'FAILED'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NOT_RUN';

export type ReadinessLabel =
  | 'READY'
  | 'READY_WITH_WARNINGS'
  | 'NOT_READY'
  | 'INSUFFICIENT_EVIDENCE';

export type FindingSeverity = 'info' | 'warning' | 'critical';
export type RecommendationPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type { paths };
