import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { queryKeys } from '../services/queryKeys';
import { formatMoney, formatPercent, formatUnits, formatDate, formatScore } from '../utils/formatters';
import { Card, CardHeader } from '../components/common/Card';
import { DashboardSkeleton } from '../components/common/Skeleton';
import { useToast } from '../components/common/Toast';
import type {
  SimulationResponse,
  AssumptionsPatchResponse,
  StageStatus,
} from '../api/types';
import {
  SlidersHorizontal,
  Play,
  Save,
  CheckCircle2,
  ArrowRight,
  GitCompare,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';

import { AnalysisNotFound } from '../components/layout/AnalysisNotFound';

export const ChangeTrackerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const isUUID = (str?: string): boolean =>
    Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

  // Prefill parameter from URL if coming from recommendations or missing inputs
  const prefillField = searchParams.get('field') || '';
  const prefillSuggested = searchParams.get('suggested') || '';

  // Simulation overrides state
  const [sellingPriceOverride, setSellingPriceOverride] = useState<string>('');
  const [cogsOverride, setCogsOverride] = useState<string>('');
  const [packagingCostOverride, setPackagingCostOverride] = useState<string>('');
  const [shippingCostOverride, setShippingCostOverride] = useState<string>('');
  const [otherVarOverride, setOtherVarOverride] = useState<string>('');
  const [monthlyBudgetOverride, setMonthlyBudgetOverride] = useState<string>('');
  const [expectedCacOverride, setExpectedCacOverride] = useState<string>('');
  const [targetMarginOverride, setTargetMarginOverride] = useState<string>('');
  const [fixedCostsOverride, setFixedCostsOverride] = useState<string>('');

  // Simulation result state
  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null);

  // Applied patch outcome state
  const [patchOutcome, setPatchOutcome] = useState<AssumptionsPatchResponse | null>(null);

  // Version compare state
  const [compareVersionA, setCompareVersionA] = useState<number | null>(null);
  const [compareVersionB, setCompareVersionB] = useState<number | null>(null);

  // 1. Fetch product detail
  const {
    data: product,
    isLoading: isProductLoading,
    error: productError,
  } = useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => api.products.get(id!),
    enabled: Boolean(id),
  });

  // 2. Fetch versions history
  const {
    data: versionsData,
    isLoading: isVersionsLoading,
  } = useQuery({
    queryKey: queryKeys.versions.list(id),
    queryFn: () => api.versions.list(id!),
    enabled: Boolean(id),
  });

  // 3. Fetch recommendations for quick "Try this value"
  const { data: recommendationsData } = useQuery({
    queryKey: queryKeys.validation.latestRecommendations(id),
    queryFn: () => api.validation.latestRecommendations(id!),
    enabled: Boolean(id),
  });

  // 4. Version comparison query
  const { data: compareData, isLoading: _isCompareLoading } = useQuery({
    queryKey: queryKeys.versions.compare(id, compareVersionA ?? undefined, compareVersionB ?? undefined),
    queryFn: () =>
      api.versions.compare(id!, compareVersionA!, compareVersionB!),
    enabled: Boolean(id && compareVersionA !== null && compareVersionB !== null && compareVersionA !== compareVersionB),
  });

  // Populate default override fields from baseline product
  useEffect(() => {
    if (product) {
      const a = product.assumptions || {};
      setSellingPriceOverride(a.pricing?.selling_price ? String(a.pricing.selling_price) : '');
      setCogsOverride(a.costs?.cogs_per_unit ? String(a.costs.cogs_per_unit) : '');
      setPackagingCostOverride(
        a.packaging?.packaging_cost
          ? String(a.packaging.packaging_cost)
          : a.costs?.packaging_cost
          ? String(a.costs.packaging_cost)
          : ''
      );
      setShippingCostOverride(a.costs?.shipping_cost_per_unit ? String(a.costs.shipping_cost_per_unit) : '');
      setOtherVarOverride(a.costs?.other_variable_cost_per_unit ? String(a.costs.other_variable_cost_per_unit) : '0');
      setMonthlyBudgetOverride(a.marketing?.monthly_budget ? String(a.marketing.monthly_budget) : '');
      setExpectedCacOverride(a.marketing?.expected_cac ? String(a.marketing.expected_cac) : '');
      setTargetMarginOverride(a.pricing?.target_margin_fraction ? String(a.pricing.target_margin_fraction) : '0.40');
      setFixedCostsOverride(a.costs?.fixed_costs_total ? String(a.costs.fixed_costs_total) : '');
    }
  }, [product]);

  // Handle URL prefill
  useEffect(() => {
    if (prefillField && prefillSuggested) {
      if (prefillField === 'selling_price') setSellingPriceOverride(prefillSuggested);
      else if (prefillField === 'cogs_per_unit') setCogsOverride(prefillSuggested);
      else if (prefillField === 'packaging_cost') setPackagingCostOverride(prefillSuggested);
      else if (prefillField === 'shipping_cost_per_unit') setShippingCostOverride(prefillSuggested);
      else if (prefillField === 'monthly_budget') setMonthlyBudgetOverride(prefillSuggested);
      else if (prefillField === 'expected_cac') setExpectedCacOverride(prefillSuggested);
      else if (prefillField === 'target_margin_fraction') setTargetMarginOverride(prefillSuggested);
    }
  }, [prefillField, prefillSuggested]);

  // Set default compare versions when versions load
  useEffect(() => {
    const list = versionsData?.items || [];
    if (list.length >= 2 && compareVersionA === null && compareVersionB === null) {
      // Compare current version with previous
      setCompareVersionA(list[list.length - 2].version_number);
      setCompareVersionB(list[list.length - 1].version_number);
    }
  }, [versionsData, compareVersionA, compareVersionB]);

  // Helper to build overrides dictionary
  const buildOverrides = (): Record<string, any> => {
    const overrides: Record<string, any> = {};
    if (sellingPriceOverride.trim()) overrides.selling_price = sellingPriceOverride.trim();
    if (cogsOverride.trim()) overrides.cogs_per_unit = cogsOverride.trim();
    if (packagingCostOverride.trim()) overrides.packaging_cost = packagingCostOverride.trim();
    if (shippingCostOverride.trim()) overrides.shipping_cost_per_unit = shippingCostOverride.trim();
    if (otherVarOverride.trim()) overrides.other_variable_cost_per_unit = otherVarOverride.trim();
    if (monthlyBudgetOverride.trim()) overrides.monthly_budget = monthlyBudgetOverride.trim();
    if (expectedCacOverride.trim()) overrides.expected_cac = expectedCacOverride.trim();
    if (targetMarginOverride.trim()) overrides.target_margin_fraction = targetMarginOverride.trim();
    if (fixedCostsOverride.trim()) overrides.fixed_costs_total = fixedCostsOverride.trim();
    return overrides;
  };

  // Helper to build nested patch for PATCH /assumptions
  const buildNestedPatch = () => {
    const patch: Record<string, any> = {};

    if (sellingPriceOverride.trim() || targetMarginOverride.trim()) {
      patch.pricing = {
        ...(sellingPriceOverride.trim() ? { selling_price: sellingPriceOverride.trim() } : {}),
        ...(targetMarginOverride.trim() ? { target_margin_fraction: targetMarginOverride.trim() } : {}),
      };
    }

    if (packagingCostOverride.trim()) {
      patch.packaging = {
        packaging_cost: packagingCostOverride.trim(),
      };
    }

    const costsPatch: Record<string, any> = {};
    if (cogsOverride.trim()) costsPatch.cogs_per_unit = cogsOverride.trim();
    if (packagingCostOverride.trim()) costsPatch.packaging_cost = packagingCostOverride.trim();
    if (shippingCostOverride.trim()) costsPatch.shipping_cost_per_unit = shippingCostOverride.trim();
    if (otherVarOverride.trim()) costsPatch.other_variable_cost_per_unit = otherVarOverride.trim();
    if (fixedCostsOverride.trim()) costsPatch.fixed_costs_total = fixedCostsOverride.trim();
    if (Object.keys(costsPatch).length > 0) {
      patch.costs = costsPatch;
    }

    const marketingPatch: Record<string, any> = {};
    if (monthlyBudgetOverride.trim()) marketingPatch.monthly_budget = monthlyBudgetOverride.trim();
    if (expectedCacOverride.trim()) marketingPatch.expected_cac = expectedCacOverride.trim();
    if (Object.keys(marketingPatch).length > 0) {
      patch.marketing = marketingPatch;
    }

    return patch;
  };

  // Simulate mutation
  const simulateMutation = useMutation({
    mutationFn: () => {
      const overrides = buildOverrides();
      return api.validation.simulate(id!, { overrides });
    },
    onSuccess: (data) => {
      setSimulationResult(data);
      showToast({
        type: 'success',
        title: 'Simulation Computed',
        message: 'Previewing hypothetical deltas without modifying saved versions.',
      });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Simulation Failed',
        message: err instanceof Error ? err.message : 'Invalid assumption parameters',
      });
    },
  });

  // Apply as new version mutation
  const applyVersionMutation = useMutation({
    mutationFn: () => {
      const patch = buildNestedPatch();
      return api.assumptions.patch(id!, { patch, revalidate: true });
    },
    onSuccess: (res) => {
      setPatchOutcome(res);
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.versions.list(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.validation.readiness(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.validation.latest(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.validation.latestRecommendations(id) });

      showToast({
        type: 'success',
        title: `Version ${res.new_version} Created & Validated`,
        message: `Affected ${res.affected_stages.length} stages. Ready for deployment.`,
      });
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Version Increment Failed',
        message: err instanceof Error ? err.message : 'Failed to apply patch',
      });
    },
  });

  if (!id || !isUUID(id)) {
    return <AnalysisNotFound id={id} />;
  }

  if (isProductLoading || isVersionsLoading) {
    return <DashboardSkeleton />;
  }

  if (productError || !product) {
    return <AnalysisNotFound id={id} message="The requested analysis could not be found or does not exist." />;
  }

  const versions = versionsData?.items || [];
  const recs = recommendationsData?.items || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>What-If Simulation & Version Ledger</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">
          {product.name} — Change Tracker
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Simulate hypothetical changes to retail price, COGS, and CAC without saving, or apply
          updates as a new immutable version with automatic pipeline revalidation.
        </p>
      </div>

      {/* Applied Version Impact Banner */}
      {patchOutcome && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-emerald-950">
                Applied as Version {patchOutcome.new_version}
              </h3>
            </div>
            <span className="text-xs text-emerald-700 font-mono">
              Version ID: {patchOutcome.version_id}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white/80 rounded-lg border border-emerald-100">
              <div className="font-semibold text-emerald-900 mb-1">
                Affected Stages ({patchOutcome.affected_stages.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {patchOutcome.affected_stages.map((st) => (
                  <span
                    key={st}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800"
                  >
                    {st}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 bg-white/80 rounded-lg border border-emerald-100">
              <div className="font-semibold text-emerald-900 mb-1">
                Changed Fields ({patchOutcome.changed_fields.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {patchOutcome.changed_fields.map((f) => (
                  <span
                    key={f}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 font-mono"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Split Layout: Simulator Form (Left) & Live Simulated Impact (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Overrides Form & Recommendations */}
        <div className="lg:col-span-5 space-y-4">
          <Card padding="md">
            <CardHeader
              title="Assumption Parameters"
              subtitle={`Current Baseline: Version ${product.current_version}`}
            />

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Selling Price (₹)
                </label>
                <input
                  type="text"
                  value={sellingPriceOverride}
                  onChange={(e) => setSellingPriceOverride(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                  placeholder="270.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    COGS per Unit (₹)
                  </label>
                  <input
                    type="text"
                    value={cogsOverride}
                    onChange={(e) => setCogsOverride(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                    placeholder="70.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Packaging Cost (₹)
                  </label>
                  <input
                    type="text"
                    value={packagingCostOverride}
                    onChange={(e) => setPackagingCostOverride(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                    placeholder="20.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shipping per Unit (₹)
                  </label>
                  <input
                    type="text"
                    value={shippingCostOverride}
                    onChange={(e) => setShippingCostOverride(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                    placeholder="30.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Other Variable (₹)
                  </label>
                  <input
                    type="text"
                    value={otherVarOverride}
                    onChange={(e) => setOtherVarOverride(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                    placeholder="5.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Monthly Budget (₹)
                  </label>
                  <input
                    type="text"
                    value={monthlyBudgetOverride}
                    onChange={(e) => setMonthlyBudgetOverride(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                    placeholder="50000.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected CAC (₹)
                  </label>
                  <input
                    type="text"
                    value={expectedCacOverride}
                    onChange={(e) => setExpectedCacOverride(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                    placeholder="500.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fixed Costs Total (₹)
                </label>
                <input
                  type="text"
                  value={fixedCostsOverride}
                  onChange={(e) => setFixedCostsOverride(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono-nums"
                  placeholder="25000.00"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => simulateMutation.mutate()}
                  disabled={simulateMutation.isPending}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {simulateMutation.isPending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>Simulate (No Save)</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyVersionMutation.mutate()}
                  disabled={applyVersionMutation.isPending}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {applyVersionMutation.isPending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Apply as Version {product.current_version + 1}</span>
                </button>
              </div>
            </div>
          </Card>

          {/* Recommendations: "Try this value" list */}
          {recs.length > 0 && (
            <Card padding="md">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-slate-900">
                  Targeted Suggestions ({recs.length})
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Click "Try this value" to populate simulator inputs from validation findings.
              </p>

              <div className="space-y-2">
                {recs.slice(0, 4).map((rec, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{rec.title}</div>
                      {rec.suggested_value && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          Target: {rec.suggested_value}
                        </div>
                      )}
                    </div>
                    {rec.suggested_value && (
                      <button
                        type="button"
                        onClick={() => {
                          const val = rec.suggested_value!;
                          // Infer field from stage or title
                          if (rec.stage === 'pricing') setSellingPriceOverride(val);
                          else if (rec.stage === 'financial' && val.includes('COGS')) setCogsOverride(val.replace(/[^\d.]/g, ''));
                          else if (rec.stage === 'marketing') setExpectedCacOverride(val.replace(/[^\d.]/g, ''));
                          else setSellingPriceOverride(val.replace(/[^\d.]/g, ''));
                          showToast({
                            type: 'info',
                            title: 'Input Applied',
                            message: `Prefilled ${val} into simulator.`,
                          });
                        }}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-indigo-700 text-[11px] font-semibold rounded border border-indigo-200 shrink-0 cursor-pointer shadow-xs"
                      >
                        Try this value
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Simulation Before vs After Display */}
        <div className="lg:col-span-7 space-y-4">
          <Card padding="md">
            <CardHeader
              title="Simulation Impact: Before vs After"
              subtitle="Comparison of key financial metrics, stage gate outcomes, and readiness score"
            />

            {!simulationResult ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                <SlidersHorizontal className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Modify any assumption on the left and click "Simulate (No Save)" to test impact.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-5">
                {/* Readiness Score Delta Banner */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">
                      Readiness Score Impact
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xl font-bold font-mono-nums text-slate-600">
                        {formatScore(simulationResult.baseline.readiness.score)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span className="text-2xl font-bold font-mono-nums text-slate-900">
                        {formatScore(simulationResult.simulated.readiness.score)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">
                      Verdict Shift
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-200 text-slate-700">
                        {simulationResult.baseline.readiness.label}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-600 text-white">
                        {simulationResult.simulated.readiness.label}
                      </span>
                    </div>
                    {/* Score delta indicator */}
                    {simulationResult.deltas?.readiness_score && (
                      <span
                        className={`text-xs font-bold font-mono-nums inline-flex items-center gap-0.5 mt-1 ${
                          simulationResult.deltas.readiness_score.startsWith('+')
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }`}
                      >
                        {simulationResult.deltas.readiness_score.startsWith('+') ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        <span>{simulationResult.deltas.readiness_score} pts</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Key Metrics Comparison Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Financial Metric</th>
                        <th className="p-3">Baseline</th>
                        <th className="p-3">Simulated</th>
                        <th className="p-3 text-right">Delta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-3 font-medium text-slate-900">Contribution per Unit</td>
                        <td className="p-3 font-mono-nums text-slate-600">
                          {formatMoney(simulationResult.baseline.metrics.contribution_per_unit)}
                        </td>
                        <td className="p-3 font-mono-nums font-bold text-slate-900">
                          {formatMoney(simulationResult.simulated.metrics.contribution_per_unit)}
                        </td>
                        <td className="p-3 font-mono-nums text-right">
                          <DeltaChip delta={simulationResult.deltas?.contribution_per_unit} isMoney />
                        </td>
                      </tr>

                      <tr>
                        <td className="p-3 font-medium text-slate-900">Contribution Margin</td>
                        <td className="p-3 font-mono-nums text-slate-600">
                          {formatPercent(simulationResult.baseline.metrics.margin_fraction)}
                        </td>
                        <td className="p-3 font-mono-nums font-bold text-indigo-600">
                          {formatPercent(simulationResult.simulated.metrics.margin_fraction)}
                        </td>
                        <td className="p-3 font-mono-nums text-right">
                          <DeltaChip delta={simulationResult.deltas?.margin_fraction} isPercent />
                        </td>
                      </tr>

                      <tr>
                        <td className="p-3 font-medium text-slate-900">Break-Even Units</td>
                        <td className="p-3 font-mono-nums text-slate-600">
                          {formatUnits(simulationResult.baseline.metrics.break_even_units)}
                        </td>
                        <td className="p-3 font-mono-nums font-bold text-slate-900">
                          {formatUnits(simulationResult.simulated.metrics.break_even_units)}
                        </td>
                        <td className="p-3 font-mono-nums text-right">
                          <DeltaChip
                            delta={simulationResult.deltas?.break_even_units}
                            invertColors // lower break-even is better!
                          />
                        </td>
                      </tr>

                      <tr>
                        <td className="p-3 font-medium text-slate-900">CAC to Contribution Ratio</td>
                        <td className="p-3 font-mono-nums text-slate-600">
                          {simulationResult.baseline.metrics.cac_to_contribution_ratio || '—'}
                        </td>
                        <td className="p-3 font-mono-nums font-bold text-slate-900">
                          {simulationResult.simulated.metrics.cac_to_contribution_ratio || '—'}
                        </td>
                        <td className="p-3 font-mono-nums text-right">
                          <DeltaChip
                            delta={simulationResult.deltas?.cac_to_contribution_ratio}
                            invertColors
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Stage Gate Status Transitions */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-800">
                    Stage Status Transitions
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(simulationResult.simulated.stages).map(([stageName, sData]) => {
                      const baseStage = simulationResult.baseline.stages[stageName];
                      const baseStatus = (baseStage?.status || 'NOT_RUN') as StageStatus;
                      const simStatus = (sData.status || 'NOT_RUN') as StageStatus;
                      const isShifted = baseStatus !== simStatus;

                      return (
                        <div
                          key={stageName}
                          className={`p-2.5 rounded-lg border text-xs ${
                            isShifted
                              ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400/20'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="text-[10px] text-slate-500 font-semibold uppercase truncate">
                            {stageName.replace(/_/g, ' ')}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 font-bold">
                            <span className="text-[10px] text-slate-500">{baseStatus}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span
                              className={`text-[11px] ${
                                simStatus === 'PASSED'
                                  ? 'text-emerald-700'
                                  : simStatus === 'WARNING'
                                  ? 'text-amber-700'
                                  : 'text-red-700'
                              }`}
                            >
                              {simStatus}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Version Comparison Section */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-indigo-600" />
              <span>Version Side-by-Side Comparison</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspect status diffs and findings between any two saved analysis iterations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={compareVersionA ?? ''}
              onChange={(e) => setCompareVersionA(Number(e.target.value))}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
            >
              <option value="">Select Version A</option>
              {versions.map((v) => (
                <option key={v.version_number} value={v.version_number}>
                  Version {v.version_number}
                </option>
              ))}
            </select>

            <span className="text-xs text-slate-400">vs</span>

            <select
              value={compareVersionB ?? ''}
              onChange={(e) => setCompareVersionB(Number(e.target.value))}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
            >
              <option value="">Select Version B</option>
              {versions.map((v) => (
                <option key={v.version_number} value={v.version_number}>
                  Version {v.version_number}
                </option>
              ))}
            </select>
          </div>
        </div>

        {compareData && (
          <div className="mt-4 space-y-3">
            <div className="text-xs font-semibold text-slate-600">
              Comparing Version {compareData.version_a} → Version {compareData.version_b}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(compareData.stages).map(([stage, delta]) => {
                return (
                  <div
                    key={stage}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      {stage.replace(/_/g, ' ')}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-600">
                        {delta.status_before || 'NOT_RUN'}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span
                        className={`text-[11px] font-bold ${
                          delta.status_after === 'PASSED'
                            ? 'text-emerald-700'
                            : delta.status_after === 'WARNING'
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }`}
                      >
                        {delta.status_after || 'NOT_RUN'}
                      </span>
                    </div>

                    {(delta.findings_added?.length || 0) > 0 && (
                      <div className="text-[10px] text-red-600">
                        +{(delta.findings_added?.length || 0)} findings added
                      </div>
                    )}
                    {(delta.findings_removed?.length || 0) > 0 && (
                      <div className="text-[10px] text-emerald-600">
                        -{(delta.findings_removed?.length || 0)} findings resolved
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Change Ledger History */}
      <Card padding="md">
        <CardHeader
          title={`Version Ledger (${versions.length} Iterations)`}
          subtitle="Audit log of historical assumption revisions and revalidations"
        />

        <div className="mt-4 space-y-2">
          {versions.map((ver) => (
            <div
              key={ver.id}
              className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold font-mono text-slate-800">
                  v{ver.version_number}
                </span>
                <div>
                  <div className="font-semibold text-slate-900">
                    Version {ver.version_number}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Created: {formatDate(ver.created_at)}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                  Immutable Snapshot
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// Helper component for delta chips
interface DeltaChipProps {
  delta?: string | null;
  isMoney?: boolean;
  isPercent?: boolean;
  invertColors?: boolean;
}

const DeltaChip: React.FC<DeltaChipProps> = ({
  delta,
  isMoney: _isMoney,
  isPercent: _isPercent,
  invertColors = false,
}) => {
  if (!delta || delta === '0' || delta === '0.00' || delta === '+0.00' || delta === '+0.0000') {
    return <span className="text-slate-400">—</span>;
  }

  const isPositive = delta.startsWith('+');
  const isGood = invertColors ? !isPositive : isPositive;

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
        isGood ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      <span>{delta}</span>
    </span>
  );
};
