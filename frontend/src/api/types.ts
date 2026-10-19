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
