import { ValidationStageInfo } from '../types';

export const VALIDATION_STAGES: ValidationStageInfo[] = [
  {
    id: 'customer',
    name: 'Customer Discovery',
    weight: 0.15,
    weightLabel: '15%',
    isCritical: false,
    oneLineDescription: 'Validates customer interview depth and core problem statement resonance.',
    ruleFromFacts: 'Minimum 5 interviews required (< 5 is INSUFFICIENT_EVIDENCE); 10+ recommended (5–9 triggers WARNING, ≥ 10 PASSED).',
  },
  {
    id: 'competitor',
    name: 'Competitor Landscape',
    weight: 0.15,
    weightLabel: '15%',
    isCritical: false,
    oneLineDescription: 'Benchmarks offerings, pricing corridors, and market claims against real competitors.',
    ruleFromFacts: 'Minimum 2 competitors required (< 2 is DEFICIENT), each requiring ≥ 1 verified evidence citation from public pages.',
    dependencies: [],
  },
  {
    id: 'product_packaging',
    name: 'Product & Packaging',
    weight: 0.15,
    weightLabel: '15%',
    isCritical: false,
    oneLineDescription: 'Prevents custom packaging and unboxing overhead from eroding unit margin.',
    ruleFromFacts: 'Packaging cost ratio > 15% of retail price triggers WARNING; ratio > 25% triggers FAILED.',
  },
  {
    id: 'pricing',
    name: 'Pricing Strategy',
    weight: 0.20,
    weightLabel: '20%',
    isCritical: true,
    oneLineDescription: 'Enforces competitive market corridor alignment and gross margin floors.',
    ruleFromFacts: 'Price > 15% above competitor max or > 20% below min triggers WARNING; margin < 15% triggers FAILED; < 40% triggers WARNING.',
    vetoBehavior: 'CRITICAL VETO: Failure in pricing unconditionally halts launch readiness (NOT_READY verdict) regardless of overall score.',
    dependencies: ['competitor'],
  },
  {
    id: 'financial',
    name: 'Financial Unit Economics',
    weight: 0.20,
    weightLabel: '20%',
    isCritical: true,
    oneLineDescription: 'Verifies positive unit contribution and realistic working capital break-even volume.',
    ruleFromFacts: 'Unit contribution ≤ ₹0.00 triggers FAILED; break-even volume > 2,500 units triggers WARNING for working capital risk.',
    vetoBehavior: 'CRITICAL VETO: Failure in financial unconditionally halts launch readiness (NOT_READY verdict) regardless of overall score.',
  },
  {
    id: 'marketing',
    name: 'Marketing Feasibility',
    weight: 0.15,
    weightLabel: '15%',
    isCritical: false,
    oneLineDescription: 'Checks customer acquisition cost sustainability against realized unit contribution.',
    ruleFromFacts: 'CAC to unit contribution ratio > 60% triggers WARNING; ratio > 100% triggers FAILED (brand loses money on first order).',
    dependencies: ['financial'],
  },
];

export const SAMPLE_READINESS_CARD = {
  badge: 'Example / Proved Test Vector A',
  title: 'EcoGlow Face Serum 50ml',
  verdict: 'READY',
  verdictTone: 'success' as const,
  overallScore: '85.00',
  sellingPrice: '₹500.00',
  variableCost: '₹230.00',
  breakdown: [
    { label: 'COGS', value: '₹150.00' },
    { label: 'Packaging', value: '₹30.00' },
    { label: 'Shipping', value: '₹40.00' },
    { label: 'Payment Fee (2%)', value: '₹10.00' },
  ],
  contribution: '₹270.00',
  margin: '54.00%',
  fixedCosts: '₹50,000.00',
  breakEven: '186 units',
  stages: [
    { name: 'Customer (15%)', status: 'PASSED', note: '12 interviews recorded' },
    { name: 'Competitor (15%)', status: 'PASSED', note: '3 verified benchmarks' },
    { name: 'Packaging (15%)', status: 'PASSED', note: '6.0% packaging ratio (≤ 15%)' },
    { name: 'Pricing (20% - Critical)', status: 'PASSED', note: '54% margin (≥ 40% target)' },
    { name: 'Financial (20% - Critical)', status: 'PASSED', note: '₹270 contribution, 186 break-even' },
    { name: 'Marketing (15%)', status: 'WARNING', note: 'CAC ₹180 (66.7% ratio > 60%)' },
  ],
};

export const AI_INVESTIGATOR_SPECS = [
  {
    title: 'Safe Scraper & Anti-SSRF Suite',
    description: 'Enforces strict network safety: blocks loopback (127.0.0.1), private IPv4/IPv6, hex/decimal integer IPs, AWS/cloud metadata (169.254.169.254), max 3 redirects, and max 1MB payload.',
    source: 'backend/app/services/page_fetcher.py',
  },
  {
    title: 'Verbatim Excerpt Verification',
    description: 'Every competitor claim or feature cited by the LLM must match a verbatim substring from the crawled webpage text after whitespace normalization.',
    source: 'backend/app/services/ai_research_provider.py:306',
  },
  {
    title: 'Observed Price Grounding',
    description: 'Any competitor price returned by AI must numerically appear inside the cited excerpt string. Unverifiable numbers are immediately discarded.',
    source: 'backend/app/services/ai_research_provider.py:321',
  },
  {
    title: 'Strict Confidence Ceiling (0.80)',
    description: 'AI model confidence is programmatically capped at a maximum of 80% (0.80). The platform never assumes 100% certainty from web research.',
    source: 'backend/app/core/config.py:100',
  },
  {
    title: 'Zero Decision-Making Authority',
    description: 'AI only collects raw text excerpts, prices, and qualitative competitor notes. AI models never compute scores, margins, or launch readiness verdicts.',
    source: 'backend/app/services/ai_research_provider.py',
  },
];

export const PYTHON_JUDGE_SPECS = [
  {
    title: 'Exact Decimal Arithmetic (50-Digit)',
    description: 'Financial calculations run under pure Python Decimal context with 50-digit precision (prec=50, ROUND_HALF_UP). Zero floating-point rounding errors.',
    source: 'backend/app/services/finance.py:19-30',
  },
  {
    title: 'Centralized Deterministic Scoring',
    description: 'Every rule, threshold, and score penalty is defined in centralized constants. Scoring starts at 100.00 with fixed deductions (-25 for warning, -30 for critical).',
    source: 'backend/app/services/validation/rules_config.py',
  },
  {
    title: 'Absolute Critical Veto Authority',
    description: 'Pricing and Financial stages carry absolute veto power. If either stage fails, the overall verdict is unconditionally NOT_READY, overriding any score.',
    source: 'backend/app/services/readiness.py:129',
  },
  {
    title: 'Immutable Audit Trail',
    description: 'Product versions and validation runs are locked at creation with database triggers preventing UPDATE or DELETE. Historical verdicts cannot be altered.',
    source: 'backend/app/services/validation/service.py',
  },
  {
    title: 'Topological DAG & Carry-Forward',
    description: 'Direct and downstream dependencies (pricing -> competitor, marketing -> financial) are modeled as a DAG. Only invalidated stages re-run upon assumption edits.',
    source: 'backend/app/services/validation/rules_config.py:96',
  },
];
