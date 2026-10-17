import type { StageName } from '../api/types';

/**
 * Display configuration rules.
 * Note: These are frontend presentation rules only and do not modify contract data.
 */

// Evidence badge threshold: Verified if source_url exists and confidence >= 0.70, otherwise Hypothesis.
export const EVIDENCE_VERIFIED_CONFIDENCE_THRESHOLD = 0.7;

// Six stages in exact backend canonical order
export const PIPELINE_STAGE_ORDER: readonly StageName[] = [
  'customer',
  'competitor',
  'product_packaging',
  'pricing',
  'financial',
  'marketing',
] as const;

export const STAGE_DISPLAY_META: Record<
  StageName,
  { number: number; title: string; shortName: string; description: string }
> = {
  customer: {
    number: 1,
    title: 'Customer Discovery & Validation',
    shortName: 'Customer',
    description: 'Target audience, problem severity, interviews, and willingness-to-pay signals.',
  },
  competitor: {
    number: 2,
    title: 'Competitor Landscape',
    shortName: 'Competitor',
    description: 'Market alternatives, pricing benchmarks, and positioning differentiation.',
  },
  product_packaging: {
    number: 3,
    title: 'Product & Packaging',
    shortName: 'Packaging',
    description: 'Materials, packaging cost ratios, and sustainability specifications.',
  },
  pricing: {
    number: 4,
    title: 'Pricing Strategy',
    shortName: 'Pricing',
    description: 'Retail price viability, market alignment, and margin thresholds.',
  },
  financial: {
    number: 5,
    title: 'Unit Economics & Financials',
    shortName: 'Financials',
    description: 'COGS, contribution margins, and break-even unit volumes.',
  },
  marketing: {
    number: 6,
    title: 'Marketing Feasibility',
    shortName: 'Marketing',
    description: 'Acquisition budget, CAC efficiency, and contribution-to-CAC ratios.',
  },
};
