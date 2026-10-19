import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { queryKeys } from '../services/queryKeys';
import { formatScore, formatMoney, formatPercent, formatUnits } from '../utils/formatters';
import { STAGE_STATUS_CONFIG, READINESS_CONFIG, isRevalidationRequired } from '../utils/status';
import { DashboardSkeleton } from '../components/common/Skeleton';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/Toast';
import type { StageName } from '../api/types';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { AnalysisNotFound } from '../components/layout/AnalysisNotFound';

const STAGE_ORDER: StageName[] = [
  'customer',
  'competitor',
  'product_packaging',
  'pricing',
  'financial',
  'marketing',
];

const STAGE_TITLES: Record<StageName, { title: string; subtitle: string }> = {
  customer: {
    title: 'Stage 1: Customer Validation',
    subtitle: 'Interviews, customer segment clarity, and willingness-to-pay signals',
  },
  competitor: {
    title: 'Stage 2: Competitor Intelligence',
    subtitle: 'Market alternatives, feature matrices, and price positioning',
  },
  product_packaging: {
    title: 'Stage 3: Product & Packaging',
    subtitle: 'BOM materials, packaging costs, and differentiation features',
  },
  pricing: {
    title: 'Stage 4: Pricing Strategy',
    subtitle: 'Corridor placement, margin targets, and consumer price elasticity',
  },
  financial: {
    title: 'Stage 5: Unit Economics & Viability',
    subtitle: 'COGS, contribution margins, and fixed cost break-even volumes',
  },
  marketing: {
    title: 'Stage 6: Marketing & CAC Efficiency',
    subtitle: 'Budget allocation, blended CAC, and conversion rate assumptions',
  },
};

export const ValidationPipelinePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const isUUID = (str?: string): boolean =>
    Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

  const [isRevalidateDialogOpen, setIsRevalidateDialogOpen] = useState(false);

  // Fetch product detail
  const {
    data: product,
    isLoading: isProductLoading,
    error: productError,
  } = useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => api.products.get(id!),
    enabled: Boolean(id),
  });

  // Fetch readiness
  const {
    data: readiness,
    isLoading: isReadinessLoading,
  } = useQuery({
    queryKey: queryKeys.validation.readiness(id),
    queryFn: () => api.validation.readiness(id!),
    enabled: Boolean(id),
  });

  // Fetch latest validation run
  const {
    data: latestRun,
    isLoading: isRunLoading,
    error: _runError,
  } = useQuery({
    queryKey: queryKeys.validation.latest(id),
    queryFn: () => api.validation.latest(id!),
    enabled: Boolean(id),
  });

  // Fetch recommendations
  const { data: recommendationsData } = useQuery({
    queryKey: queryKeys.validation.latestRecommendations(id),
    queryFn: () => api.validation.latestRecommendations(id!),
    enabled: Boolean(id),
  });

  // Re-run validation mutation
  const revalidateMutation = useMutation({
    mutationFn: () => api.validation.revalidate(id!),
    onSuccess: (run) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.validation.readiness(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.validation.latest(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.validation.latestRecommendations(id) });
      showToast({
        type: 'success',
        title: 'Validation Pipeline Executed',
        message: `Pipeline revalidated for version ${run.version_number}. Readiness score: ${formatScore(run.readiness_score)}/100`,
      });
      setIsRevalidateDialogOpen(false);
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Validation Execution Failed',
        message: err instanceof Error ? err.message : 'Unknown validation error',
      });
      setIsRevalidateDialogOpen(false);
    },
  });

  if (!id || !isUUID(id)) {
    return <AnalysisNotFound id={id} />;
  }

  if (isProductLoading || isReadinessLoading || isRunLoading) {
    return <DashboardSkeleton />;
  }

  if (productError || !product) {
    return <AnalysisNotFound id={id} message="The requested analysis could not be found or does not exist." />;
  }

  const results = latestRun?.results || [];
  const recommendations = recommendationsData?.items || [];
  const revalidationNeeded = isRevalidationRequired(
    product.current_version,
    latestRun?.version_number
  );

  const readinessMeta = readiness?.label ? READINESS_CONFIG[readiness.label] : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Hero Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>6-Stage Sequential Gatekeeper</span>
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-mono font-medium">
                Version {product.current_version}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1">{product.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Topological evaluation order: Customer → Competitor → Product Packaging → Pricing → Financial → Marketing
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsRevalidateDialogOpen(true)}
              disabled={revalidateMutation.isPending}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {revalidateMutation.isPending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Re-running Pipeline...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-run Validation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Readiness Overview Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[11px] text-slate-500 font-medium">Readiness Verdict</div>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  readinessMeta?.badgeBg || 'bg-slate-600'
                } text-white`}
              >
                {readiness?.label || 'PENDING'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {readinessMeta?.description || 'Evaluating gate requirements'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[11px] text-slate-500 font-medium">Readiness Score</div>
            <div className="mt-1 text-2xl font-bold text-slate-900 font-mono-nums">
              {formatScore(readiness?.overall_score)}/100
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Aggregated across 6 stages
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[11px] text-slate-500 font-medium">Pipeline Status</div>
            <div className="mt-1 text-sm font-bold text-slate-800">
              {revalidationNeeded ? (
                <span className="text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Revalidation Required</span>
                </span>
              ) : (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Synchronized</span>
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Run v{latestRun?.version_number ?? '—'} vs Product v{product.current_version}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[11px] text-slate-500 font-medium">Active Recommendations</div>
            <div className="mt-1 text-2xl font-bold text-indigo-600 font-mono-nums">
              {recommendations.length}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Prioritized improvements
            </span>
          </div>
        </div>
      </div>

      {/* 6 Stage Cards in Topological Order */}
      <div className="space-y-4">
        {STAGE_ORDER.map((stageKey) => {
          const stageInfo = STAGE_TITLES[stageKey];
          const result = results.find((r) => r.stage === stageKey);
          const status = result?.status || 'NOT_RUN';
          const statusMeta = STAGE_STATUS_CONFIG[status];
          const score = result?.score;
          const carriedForwardFrom = result?.carried_forward_from;
          const findings = result?.findings || [];
          const metrics = (result?.metrics || {}) as Record<string, any>;
          const stageRecs = recommendations.filter((rec) => rec.stage === stageKey);

          return (
            <div
              key={stageKey}
              id={`stage-${stageKey}`}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
            >
              {/* Stage Header */}
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {status === 'PASSED' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    )}
                    {status === 'WARNING' && (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    )}
                    {status === 'FAILED' && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    {status === 'INSUFFICIENT_EVIDENCE' && (
                      <HelpCircle className="w-5 h-5 text-slate-400" />
                    )}
                    {status === 'NOT_RUN' && (
                      <HelpCircle className="w-5 h-5 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">{stageInfo.title}</h2>
                      {carriedForwardFrom !== null && carriedForwardFrom !== undefined && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                          Reused from version {carriedForwardFrom}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{stageInfo.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Stage Score</div>
                    <div className="text-sm font-bold font-mono-nums text-slate-800">
                      {formatScore(score)}/100
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.bgClass} ${statusMeta.textClass} ${statusMeta.borderClass}`}
                  >
                    {statusMeta.label}
                  </span>
                </div>
              </div>

              {/* Stage Metrics Grid */}
              {Object.keys(metrics).length > 0 && (
                <div className="p-4 bg-white border-b border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Evaluated Stage Metrics
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {stageKey === 'financial' && (
                      <>
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400">Selling Price</span>
                          <div className="text-xs font-bold font-mono-nums text-slate-900">
                            {formatMoney(metrics.selling_price)}
                          </div>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400">Variable Cost</span>
                          <div className="text-xs font-bold font-mono-nums text-slate-900">
                            {formatMoney(metrics.variable_cost_per_unit)}
                          </div>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400">Contribution Margin</span>
                          <div className="text-xs font-bold font-mono-nums text-indigo-600">
                            {formatPercent(metrics.contribution_margin)}
                          </div>
                        </div>
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-[10px] text-slate-400">Break-Even Units</span>
                          <div className="text-xs font-bold font-mono-nums text-slate-900">
                            {formatUnits(metrics.break_even_units)}
                          </div>
                        </div>
                      </>
                    )}

                    {stageKey !== 'financial' &&
                      Object.entries(metrics)
                        .slice(0, 4)
                        .map(([k, v]) => (
                          <div
                            key={k}
                            className="p-2.5 bg-slate-50 rounded-lg border border-slate-100"
                          >
                            <span className="text-[10px] text-slate-400 truncate block">
                              {k.replace(/_/g, ' ')}
                            </span>
                            <div className="text-xs font-bold font-mono-nums text-slate-900 truncate">
                              {typeof v === 'number'
                                ? v < 1 && v > 0
                                  ? formatPercent(v)
                                  : formatUnits(v)
                                : String(v ?? '—')}
                            </div>
                          </div>
                        ))}
                  </div>
                </div>
              )}

              {/* Stage Findings */}
              <div className="p-5 space-y-3">
                <div className="text-xs font-bold text-slate-800">
                  Findings ({findings.length})
                </div>

                {findings.length === 0 ? (
                  <div className="text-xs text-slate-400 py-1">
                    No findings recorded for this stage.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {findings.map((f, fIdx) => {
                      const isMissingInput = f.code.startsWith('MISSING_INPUT');
                      const missingField = isMissingInput
                        ? f.code.replace('MISSING_INPUT:', '').trim()
                        : null;

                      const severityColor =
                        f.severity === 'critical'
                          ? 'bg-red-50 text-red-800 border-red-200'
                          : f.severity === 'warning'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200';

                      return (
                        <div
                          key={fIdx}
                          className={`p-3 rounded-lg border text-xs space-y-1.5 ${severityColor}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                              {f.code}
                            </span>
                            <span className="text-[10px] font-bold uppercase">
                              Severity: {f.severity}
                            </span>
                          </div>
                          <p className="leading-relaxed">{f.message}</p>

                          {/* Link to Change Tracker prefilled */}
                          {missingField && (
                            <div className="pt-1">
                              <Link
                                to={`/change-tracker/${id}?field=${missingField}`}
                                className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                              >
                                <span>Add missing input "{missingField}" in Change Tracker</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Stage Recommendations */}
                {stageRecs.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Recommended Actions ({stageRecs.length})</span>
                    </div>

                    <div className="space-y-2">
                      {stageRecs.map((rec, rIdx) => (
                        <div
                          key={rIdx}
                          className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-100 flex items-start justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-200 text-indigo-800">
                                {rec.priority}
                              </span>
                              <span className="font-bold text-slate-900">{rec.title}</span>
                            </div>
                            <p className="text-slate-600 mt-1">{rec.action_type}</p>
                            {rec.suggested_value && (
                              <div className="text-[11px] text-slate-500 mt-1">
                                Suggested Value:{' '}
                                <span className="font-mono font-semibold text-slate-800">
                                  {rec.suggested_value}
                                </span>
                              </div>
                            )}
                          </div>

                          <Link
                            to={`/change-tracker/${id}${
                              rec.suggested_value ? `?suggested=${encodeURIComponent(rec.suggested_value)}` : ''
                            }`}
                            className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 text-[11px] font-semibold rounded border border-indigo-200 shrink-0 shadow-xs flex items-center gap-1"
                          >
                            <span>Simulate</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm Dialog for Revalidation */}
      <ConfirmDialog
        isOpen={isRevalidateDialogOpen}
        title="Execute Validation Pipeline?"
        message={`This will re-run the 6 sequential gatekeeper stages for ${product.name} (version ${product.current_version}). Recomputed metrics will immediately update the readiness score.`}
        confirmLabel="Run Revalidation"
        isLoading={revalidateMutation.isPending}
        onConfirm={() => revalidateMutation.mutate()}
        onCancel={() => setIsRevalidateDialogOpen(false)}
      />
    </div>
  );
};
