import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { queryKeys } from '../services/queryKeys';
import { computeUnitEconomics } from '../services/estimates';
import { formatMoney, formatPercent, formatUnits } from '../utils/formatters';
import { mapApiErrorsToForm, extractErrorDetails } from '../utils/errorMapper';
import { useToast } from '../components/common/Toast';
import { Card } from '../components/common/Card';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  RefreshCw,
} from 'lucide-react';

interface WizardFormData {
  // Step 1: Basics & Customer
  name: string;
  category: string;
  description: string;
  target_customer: string;
  target_market: string;
  problem_statement: string;
  customer_interviews_count: number | string;
  willingness_to_pay_signal: string;
  features_raw: string;

  // Step 2: Economics & Pricing
  selling_price: number | string;
  cogs_per_unit: number | string;
  packaging_cost: number | string;
  packaging_material: string;
  shipping_cost_per_unit: number | string;
  other_variable_cost_per_unit: number | string;
  payment_fee_fraction: number | string;
  fixed_costs_total: number | string;
  target_margin_fraction: number | string;

  // Step 3: Marketing
  monthly_budget: number | string;
  expected_cac: number | string;
  channels_raw: string;
  expected_conversion_rate_fraction: number | string;

  // Step 4: Competitors
  competitors: Array<{
    name: string;
    product_name?: string;
    website_url?: string;
    observed_price?: number | string;
    notes?: string;
  }>;
}

const CATEGORY_OPTIONS = [
  'Drinkware',
  'Food & Beverage',
  'Health & Wellness',
  'Beauty & Personal Care',
  'Apparel & Accessories',
  'Home & Living',
  'Consumer Electronics',
  'Pet Care',
  'Other',
];

const WILLINGNESS_OPTIONS = [
  { value: 'strong', label: 'Strong (Paid pre-orders / deposits)' },
  { value: 'moderate', label: 'Moderate (Verbal intent from interviews)' },
  { value: 'weak', label: 'Weak (Survey responses only)' },
  { value: 'untested', label: 'Untested / Hypothesis' },
];

export const NewAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submissionProgress, setSubmissionProgress] = useState<{
    inProgress: boolean;
    stepName: string;
    stepIndex: number;
    error: string | null;
    createdProductId: string | null;
    competitorsAdded: boolean;
    researchStarted: boolean;
    validationRun: boolean;
  }>({
    inProgress: false,
    stepName: '',
    stepIndex: 0,
    error: null,
    createdProductId: null,
    competitorsAdded: false,
    researchStarted: false,
    validationRun: false,
  });

  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<WizardFormData>({
    mode: 'onBlur',
    defaultValues: {
      name: '',
      category: 'Drinkware',
      description: '',
      target_customer: '',
      target_market: '',
      problem_statement: '',
      customer_interviews_count: '',
      willingness_to_pay_signal: 'untested',
      features_raw: 'Vacuum Insulated, BPA Free, Dishwasher Safe',
      selling_price: '270.00',
      cogs_per_unit: '70.00',
      packaging_cost: '20.00',
      packaging_material: 'Recycled Kraft Cardboard',
      shipping_cost_per_unit: '30.00',
      other_variable_cost_per_unit: '5.00',
      payment_fee_fraction: '0.02',
      fixed_costs_total: '25000.00',
      target_margin_fraction: '0.40',
      monthly_budget: '50000.00',
      expected_cac: '500.00',
      channels_raw: 'Meta Ads, Google Search, Influencer',
      expected_conversion_rate_fraction: '0.03',
      competitors: [
        {
          name: 'HydroMax',
          product_name: 'Insulated Bottle 32oz',
          website_url: 'https://example.com/hydromax',
          observed_price: '299.00',
          notes: 'Leading market incumbent with established distribution',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'competitors',
  });

  // Watch fields for live economics calculation
  const watchedPrice = watch('selling_price');
  const watchedCogs = watch('cogs_per_unit');
  const watchedPkgCost = watch('packaging_cost');
  const watchedShipping = watch('shipping_cost_per_unit');
  const watchedOtherVar = watch('other_variable_cost_per_unit');
  const watchedFeeFrac = watch('payment_fee_fraction');
  const watchedFixedCosts = watch('fixed_costs_total');
  const watchedTargetMargin = watch('target_margin_fraction');

  const liveEstimate = computeUnitEconomics({
    selling_price: watchedPrice,
    cogs_per_unit: watchedCogs,
    packaging_cost: watchedPkgCost,
    shipping_cost_per_unit: watchedShipping,
    other_variable_cost_per_unit: watchedOtherVar,
    payment_fee_fraction: watchedFeeFrac,
    fixed_costs_total: watchedFixedCosts,
    target_margin_fraction: watchedTargetMargin,
  });

  // Derived customer acquisition preview
  const watchedBudget = watch('monthly_budget');
  const watchedCac = watch('expected_cac');
  let derivedCustomers: number | null = null;
  if (watchedBudget && watchedCac && Number(watchedCac) > 0) {
    const b = Number(watchedBudget);
    const c = Number(watchedCac);
    if (!isNaN(b) && !isNaN(c) && c > 0) {
      derivedCustomers = Math.floor(b / c);
    }
  }

  // Validate current step before advancing
  const handleNextStep = () => {
    setServerErrors([]);
    if (currentStep === 1) {
      const nameVal = watch('name')?.trim();
      if (!nameVal) {
        setError('name', { type: 'required', message: 'Product name is required' });
        return;
      }
    } else if (currentStep === 2) {
      const priceVal = Number(watch('selling_price'));
      if (isNaN(priceVal) || priceVal <= 0) {
        setError('selling_price', {
          type: 'min',
          message: 'Selling price must be greater than zero',
        });
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setServerErrors([]);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Orchestrated sequential submission with idempotent retry
  const executeSubmission = async (data: WizardFormData) => {
    setSubmissionProgress((prev) => ({
      ...prev,
      inProgress: true,
      error: null,
    }));
    setServerErrors([]);

    let productId = submissionProgress.createdProductId;

    // STEP 1: Create Product with all assumptions
    if (!productId) {
      setSubmissionProgress((prev) => ({
        ...prev,
        stepIndex: 1,
        stepName: 'Step 1/4: Creating Product & Registering Assumptions',
      }));

      const features = data.features_raw
        ? data.features_raw.split(',').map((f) => f.trim()).filter(Boolean)
        : [];
      const channels = data.channels_raw
        ? data.channels_raw.split(',').map((c) => c.trim()).filter(Boolean)
        : [];

      const payload = {
        name: data.name.trim(),
        category: data.category || 'Drinkware',
        description: data.description?.trim() || null,
        target_market: data.target_market?.trim() || null,
        assumptions: {
          customer: {
            problem_statement: data.problem_statement?.trim() || null,
            customer_interviews_count: data.customer_interviews_count
              ? Number(data.customer_interviews_count)
              : null,
            willingness_to_pay_signal: data.willingness_to_pay_signal || null,
            target_customer: data.target_customer?.trim() || null,
          },
          product: {
            features: features,
            unique_selling_points: features.slice(0, 3),
            differentiation_vs_competitors: data.target_market?.trim() || null,
          },
          packaging: {
            material: data.packaging_material?.trim() || null,
            packaging_cost: data.packaging_cost ? String(data.packaging_cost) : null,
          },
          pricing: {
            selling_price: String(data.selling_price),
            target_margin_fraction: data.target_margin_fraction
              ? String(data.target_margin_fraction)
              : null,
          },
          costs: {
            cogs_per_unit: data.cogs_per_unit ? String(data.cogs_per_unit) : null,
            shipping_cost_per_unit: data.shipping_cost_per_unit
              ? String(data.shipping_cost_per_unit)
              : null,
            packaging_cost: data.packaging_cost ? String(data.packaging_cost) : null,
            payment_fee_fraction: data.payment_fee_fraction
              ? String(data.payment_fee_fraction)
              : '0.02',
            fixed_costs_total: data.fixed_costs_total ? String(data.fixed_costs_total) : null,
            other_variable_cost_per_unit: data.other_variable_cost_per_unit
              ? String(data.other_variable_cost_per_unit)
              : '0',
          },
          marketing: {
            monthly_budget: data.monthly_budget ? String(data.monthly_budget) : null,
            expected_cac: data.expected_cac ? String(data.expected_cac) : null,
            channels: channels,
            expected_conversion_rate_fraction: data.expected_conversion_rate_fraction
              ? String(data.expected_conversion_rate_fraction)
              : '0.03',
          },
        },
      };

      try {
        const createdProduct = await api.products.create(payload as any);
        productId = createdProduct.id;
        setSubmissionProgress((prev) => ({
          ...prev,
          createdProductId: productId,
        }));
      } catch (err) {
        const { message } = extractErrorDetails(err);
        const unmapped = mapApiErrorsToForm(err, setError);
        setServerErrors(unmapped.length > 0 ? unmapped : [message]);
        setSubmissionProgress((prev) => ({
          ...prev,
          inProgress: false,
          error: `Step 1 Failed (Product Creation): ${message}`,
        }));
        showToast({
          type: 'error',
          title: 'Product Creation Failed',
          message,
        });
        return;
      }
    }

    // STEP 2: Add Competitors
    if (productId && !submissionProgress.competitorsAdded && data.competitors.length > 0) {
      setSubmissionProgress((prev) => ({
        ...prev,
        stepIndex: 2,
        stepName: 'Step 2/4: Registering Competitor Benchmarks & Price Observations',
      }));

      // Filter out any blank competitors
      const validComps = data.competitors
        .filter((c) => c.name && c.name.trim().length > 0)
        .map((c) => ({
          name: c.name.trim(),
          product_name: c.product_name?.trim() || null,
          website_url: c.website_url?.trim() || null,
          observed_price: c.observed_price ? String(c.observed_price) : null,
          notes: c.notes?.trim() || null,
        }));

      if (validComps.length > 0) {
        try {
          await api.competitors.create(productId, { competitors: validComps });
          setSubmissionProgress((prev) => ({
            ...prev,
            competitorsAdded: true,
          }));
        } catch (err) {
          const { message } = extractErrorDetails(err);
          const unmapped = mapApiErrorsToForm(err, setError);
          setServerErrors(unmapped.length > 0 ? unmapped : [message]);
          setSubmissionProgress((prev) => ({
            ...prev,
            inProgress: false,
            error: `Step 2 Failed (Competitor Ingestion): ${message}`,
          }));
          showToast({
            type: 'error',
            title: 'Competitor Ingestion Failed',
            message,
          });
          return;
        }
      } else {
        setSubmissionProgress((prev) => ({
          ...prev,
          competitorsAdded: true,
        }));
      }
    }

    // STEP 3: Start Research
    if (productId && !submissionProgress.researchStarted) {
      setSubmissionProgress((prev) => ({
        ...prev,
        stepIndex: 3,
        stepName: 'Step 3/4: Initiating Evidence Research Engine',
      }));

      try {
        await api.research.start(productId);
        setSubmissionProgress((prev) => ({
          ...prev,
          researchStarted: true,
        }));
      } catch (err) {
        const { message } = extractErrorDetails(err);
        setSubmissionProgress((prev) => ({
          ...prev,
          inProgress: false,
          error: `Step 3 Failed (Research Execution): ${message}`,
        }));
        showToast({
          type: 'error',
          title: 'Research Start Failed',
          message,
        });
        return;
      }
    }

    // STEP 4: Run Initial Validation
    if (productId && !submissionProgress.validationRun) {
      setSubmissionProgress((prev) => ({
        ...prev,
        stepIndex: 4,
        stepName: 'Step 4/4: Executing 6-Stage Sequential Validation Pipeline',
      }));

      try {
        await api.validation.validate(productId);
        setSubmissionProgress((prev) => ({
          ...prev,
          validationRun: true,
          inProgress: false,
        }));

        // Refresh React Query product list
        queryClient.invalidateQueries({ queryKey: queryKeys.products.all });

        showToast({
          type: 'success',
          title: 'Analysis Initialized & Validated',
          message: 'All 6 stages evaluated. Redirecting to validation pipeline...',
        });

        // Navigate to validation pipeline
        navigate(`/validation/${productId}`);
      } catch (err) {
        const { message } = extractErrorDetails(err);
        setSubmissionProgress((prev) => ({
          ...prev,
          inProgress: false,
          error: `Step 4 Failed (Validation Pipeline): ${message}`,
        }));
        showToast({
          type: 'error',
          title: 'Validation Run Failed',
          message,
        });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb & Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>New Analysis Wizard</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">
          Create D2C Product Launch Twin
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Provide your target product assumptions, cost parameters, and competitors. Our 6-stage
          pipeline evaluates unit economics and market viability.
        </p>
      </div>

      {/* Wizard Step Indicator Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="grid grid-cols-4 gap-2">
          {[
            { num: 1, title: 'Basics & Customer', subtitle: 'Target audience' },
            { num: 2, title: 'Unit Economics', subtitle: 'Price & costs' },
            { num: 3, title: 'Marketing & CAC', subtitle: 'Budgets & channels' },
            { num: 4, title: 'Competitors', subtitle: 'Benchmarks & URLs' },
          ].map((s) => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (isCompleted) setCurrentStep(s.num);
                }}
                disabled={!isCompleted && !isActive}
                className={`text-left p-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-indigo-50 border border-indigo-200 ring-1 ring-indigo-500/20'
                    : isCompleted
                    ? 'bg-slate-50 hover:bg-slate-100 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.num}
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate">{s.title}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 ml-7 truncate">{s.subtitle}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress / Failure Alert Banner */}
      {submissionProgress.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>Submission Interrupted</span>
          </div>
          <p className="text-xs text-red-700">{submissionProgress.error}</p>
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit(executeSubmission)}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry from Failed Step</span>
            </button>
            <span className="text-[11px] text-red-600">
              {submissionProgress.createdProductId
                ? 'Product is already created; retry will not duplicate records.'
                : 'Will retry product registration.'}
            </span>
          </div>
        </div>
      )}

      {/* Server Validation Errors List */}
      {serverErrors.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-amber-900">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Please resolve the following issues:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 ml-2 text-amber-800">
            {serverErrors.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Form Form */}
      <form onSubmit={handleSubmit(executeSubmission)} className="space-y-6">
        {/* STEP 1: Basics & Customer */}
        {currentStep === 1 && (
          <Card padding="lg">
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <span>Step 1: Product Definition & Customer Signals</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Establish the core product identity and target customer thesis.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('name', { required: 'Product name is required' })}
                    placeholder="e.g. TerraFlask 32oz Eco-Insulated Tumbler"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.name && (
                    <span className="text-xs text-red-600 mt-1 block">
                      {errors.name.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Market / Demographics
                  </label>
                  <input
                    type="text"
                    {...register('target_market')}
                    placeholder="e.g. Urban eco-conscious commuters & gymgoers"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Description
                  </label>
                  <textarea
                    rows={2}
                    {...register('description')}
                    placeholder="Describe the product value proposition and packaging form factor..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Key Features (comma separated)
                  </label>
                  <input
                    type="text"
                    {...register('features_raw')}
                    placeholder="e.g. 24hr cold retention, leakproof lid, ceramic interior"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Comma-separated list converted to feature tags during analysis.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Interviews Conducted
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('customer_interviews_count')}
                    placeholder="e.g. 15"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Stage 1 benchmarks recommend 10+ interviews for Pass status.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Willingness to Pay Signal
                  </label>
                  <select
                    {...register('willingness_to_pay_signal')}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {WILLINGNESS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 2: Economics & Pricing + Live Estimate */}
        {currentStep === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card padding="lg">
                <div className="space-y-5">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>Step 2: Pricing & Unit Economics</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure your retail price, Bill of Materials, and per-unit fulfillment costs.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Target Selling Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        {...register('selling_price', {
                          required: 'Selling price is required',
                        })}
                        placeholder="270.00"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                      />
                      {errors.selling_price && (
                        <span className="text-xs text-red-600 mt-1 block">
                          {errors.selling_price.message}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        COGS per Unit (₹)
                      </label>
                      <input
                        type="text"
                        {...register('cogs_per_unit')}
                        placeholder="70.00"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Packaging Cost per Unit (₹)
                      </label>
                      <input
                        type="text"
                        {...register('packaging_cost')}
                        placeholder="20.00"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Packaging Material
                      </label>
                      <input
                        type="text"
                        {...register('packaging_material')}
                        placeholder="e.g. Recycled Kraft Box"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Shipping Cost per Unit (₹)
                      </label>
                      <input
                        type="text"
                        {...register('shipping_cost_per_unit')}
                        placeholder="30.00"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Other Variable Cost per Unit (₹)
                      </label>
                      <input
                        type="text"
                        {...register('other_variable_cost_per_unit')}
                        placeholder="5.00"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Payment Gateway Fee Fraction
                      </label>
                      <input
                        type="text"
                        {...register('payment_fee_fraction')}
                        placeholder="0.02"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Default 0.02 (2% gateway processing fee).
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Monthly Fixed Costs (₹)
                      </label>
                      <input
                        type="text"
                        {...register('fixed_costs_total')}
                        placeholder="25000.00"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Target Contribution Margin Fraction
                      </label>
                      <input
                        type="text"
                        {...register('target_margin_fraction')}
                        placeholder="0.40"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Enter 0.40 for a 40% margin benchmark.
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Live Economics Estimate Card */}
            <div className="lg:col-span-1">
              <div className="bg-slate-900 text-white rounded-xl p-5 shadow-lg space-y-4 sticky top-24">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Live Economics
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono font-medium">
                    Client Decimal.js
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] text-slate-400">Total Variable Cost</div>
                    <div className="text-xl font-bold font-mono-nums text-white">
                      {liveEstimate.variableCostPerUnit
                        ? formatMoney(liveEstimate.variableCostPerUnit)
                        : '—'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400">Contribution Per Unit</div>
                    <div className="text-xl font-bold font-mono-nums text-emerald-400">
                      {liveEstimate.contributionPerUnit
                        ? formatMoney(liveEstimate.contributionPerUnit)
                        : '—'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400">Contribution Margin %</div>
                    <div className="text-xl font-bold font-mono-nums text-indigo-300">
                      {liveEstimate.contributionMargin !== null
                        ? formatPercent(liveEstimate.contributionMargin)
                        : '—'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400">Break-Even Sales Volume</div>
                    <div className="text-xl font-bold font-mono-nums text-amber-300">
                      {liveEstimate.breakEvenUnits !== null
                        ? `${formatUnits(liveEstimate.breakEvenUnits)} units`
                        : '—'}
                    </div>
                  </div>
                </div>

                {liveEstimate.notes.length > 0 && (
                  <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
                    {liveEstimate.notes.map((note, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Marketing & CAC */}
        {currentStep === 3 && (
          <Card padding="lg">
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Step 3: Marketing Budget & Customer Acquisition</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set planned ad budgets and target acquisition metrics for Stage 6 validation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Marketing Budget (₹)
                  </label>
                  <input
                    type="text"
                    {...register('monthly_budget')}
                    placeholder="50000.00"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected CAC (Customer Acquisition Cost) (₹)
                  </label>
                  <input
                    type="text"
                    {...register('expected_cac')}
                    placeholder="500.00"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Marketing Channels (comma separated)
                  </label>
                  <input
                    type="text"
                    {...register('channels_raw')}
                    placeholder="e.g. Meta Ads, Google Search, Influencer Marketing"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected E-commerce Conversion Rate Fraction
                  </label>
                  <input
                    type="text"
                    {...register('expected_conversion_rate_fraction')}
                    placeholder="0.03"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Default 0.03 (3% store visitors convert to orders).
                  </span>
                </div>
              </div>

              {/* Derived Customers Preview */}
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span className="text-slate-700 font-medium">Estimated New Customers / Mo:</span>
                  <span className="font-bold font-mono-nums text-indigo-900 text-sm">
                    {derivedCustomers !== null ? `${formatUnits(derivedCustomers)} orders` : '—'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-800 font-semibold">
                    derived
                  </span>
                </div>
                <span className="text-[11px] text-indigo-600">
                  (Monthly Budget ÷ Expected CAC)
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 4: Competitor Intelligence */}
        {currentStep === 4 && (
          <Card padding="lg">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Step 4: Competitor Benchmarks & Market Observations</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Add direct alternative products and observed retail prices for market corridor analysis.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    append({
                      name: '',
                      product_name: '',
                      website_url: '',
                      observed_price: '',
                      notes: '',
                    })
                  }
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Competitor</span>
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 relative space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        Competitor #{idx + 1}
                      </span>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(idx)}
                          className="text-slate-400 hover:text-red-600 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Company / Brand Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register(`competitors.${idx}.name` as const, {
                            required: 'Brand name is required',
                          })}
                          placeholder="e.g. HydroMax"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Product Name
                        </label>
                        <input
                          type="text"
                          {...register(`competitors.${idx}.product_name` as const)}
                          placeholder="e.g. 32oz Insulated Tumbler"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Observed Price (₹)
                        </label>
                        <input
                          type="text"
                          {...register(`competitors.${idx}.observed_price` as const)}
                          placeholder="299.00"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Website / Product URL
                        </label>
                        <input
                          type="url"
                          {...register(`competitors.${idx}.website_url` as const)}
                          placeholder="https://example.com/product"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Notes / Analysis
                        </label>
                        <input
                          type="text"
                          {...register(`competitors.${idx}.notes` as const)}
                          placeholder="Key strengths, customer sentiment, distribution channels..."
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Wizard Controls Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={submissionProgress.inProgress}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submissionProgress.inProgress}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submissionProgress.inProgress ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{submissionProgress.stepName || 'Executing Workflow...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Launch Pipeline & Validation</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
