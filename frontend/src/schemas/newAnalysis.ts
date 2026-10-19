import { z } from 'zod';

export const step1ProductSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  category: z.string().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).default([]),
  target_customer: z.string().optional(),
  target_market: z.string().optional(),
  differentiation: z.string().optional(),
  problem_statement: z.string().optional(),
  customer_interviews_count: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().int().min(0, 'Must be 0 or more interviews').optional()
  ),
  willingness_to_pay_signal: z.string().optional(),
});

export const step2EconomicsSchema = z.object({
  selling_price: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().positive('Selling price must be greater than 0').optional()
  ),
  cogs_per_unit: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(0, 'COGS cannot be negative').optional()
  ),
  packaging_cost: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(0, 'Packaging cost cannot be negative').optional()
  ),
  packaging_material: z.string().optional(),
  shipping_cost_per_unit: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(0, 'Shipping cost cannot be negative').optional()
  ),
  other_variable_cost_per_unit: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(0, 'Other variable costs cannot be negative').optional()
  ),
  payment_fee_fraction: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(0).max(1, 'Fee fraction must be between 0 and 1 (e.g. 0.02 for 2%)').optional()
  ),
  fixed_costs_total: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(0, 'Fixed costs cannot be negative').optional()
  ),
  target_margin_fraction: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(0).max(1, 'Margin fraction must be between 0 and 1 (e.g. 0.40 for 40%)').optional()
  ),
});

export const step3MarketingSchema = z.object({
  monthly_budget: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(0, 'Monthly budget cannot be negative').optional()
  ),
  channels: z.array(z.string()).default([]),
  expected_cac: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(0, 'Expected CAC cannot be negative').optional()
  ),
  expected_conversion_rate_fraction: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().min(0).max(1, 'Conversion rate must be between 0 and 1 (e.g. 0.03 for 3%)').optional()
  ),
});

export const competitorEntrySchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Competitor company name is required'),
  product_name: z.string().optional(),
  website_url: z
    .string()
    .trim()
    .refine((url) => !url || /^https?:\/\/.+/.test(url), 'Must be a valid URL starting with http:// or https://')
    .optional(),
  observed_price: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().positive('Price must be greater than zero').optional()
  ),
  notes: z.string().optional(),
});

export const step4CompetitorsSchema = z.object({
  competitors: z
    .array(competitorEntrySchema)
    .refine(
      (items) => {
        const names = items.map((i) => i.name.trim().toLowerCase());
        return new Set(names).size === names.length;
      },
      { message: 'Competitor names must be unique (case-insensitively)' }
    ),
});

export type Step1Data = z.infer<typeof step1ProductSchema>;
export type Step2Data = z.infer<typeof step2EconomicsSchema>;
export type Step3Data = z.infer<typeof step3MarketingSchema>;
export type CompetitorEntry = z.infer<typeof competitorEntrySchema>;
export type Step4Data = z.infer<typeof step4CompetitorsSchema>;

export interface FullWizardData {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
}
