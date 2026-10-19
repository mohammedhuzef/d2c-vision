import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { queryKeys } from '../services/queryKeys';
import { formatScore } from '../utils/formatters';
import { isRevalidationRequired } from '../utils/status';
import { DashboardSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ReadinessHero } from '../components/common/ReadinessHero';
import { MetricTile } from '../components/common/MetricTile';
import { PipelineStrip } from '../components/dashboard/PipelineStrip';
import { FinancialSnapshotCard } from '../components/dashboard/FinancialSnapshotCard';
import { CompetitorPriceChart } from '../components/dashboard/CompetitorPriceChart';
import { PriorityActionsCard } from '../components/dashboard/PriorityActionsCard';
import { ChangeHistoryCard } from '../components/dashboard/ChangeHistoryCard';
import { QuickActions } from '../components/dashboard/QuickActions';
import { useToast } from '../components/common/Toast';
import {
  Sparkles,
  CheckCircle,
  Users,
  AlertTriangle,
  PlusCircle,
} from 'lucide-react';
import { AnalysisNotFound } from '../components/layout/AnalysisNotFound';
import { NotFound } from '../components/layout/NotFound';

export const DashboardPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isRevalidateDialogOpen, setIsRevalidateDialogOpen] = useState(false);

  // Helper to validate UUID format
  const isUUID = (str?: string): boolean =>
    Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

  // Fallback context from Shell
  const outletCtx = useOutletContext<{ selectedProductId?: string }>();
  const hasIdParam = Boolean(id);
  const isValidParamId = hasIdParam && isUUID(id);
  const activeProductId = isValidParamId ? id : (!hasIdParam ? outletCtx?.selectedProductId : undefined);

  // 1. Fetch product detail
  const {
    data: product,
    isLoading: isProductLoading,
    error: productError,
  } = useQuery({
    queryKey: queryKeys.products.detail(activeProductId),
    queryFn: () => api.products.get(activeProductId!),
    enabled: Boolean(activeProductId && isUUID(activeProductId)),
  });

  // 2. Fetch readiness
  const { data: readiness } = useQuery({
    queryKey: queryKeys.validation.readiness(activeProductId),
    queryFn: () => api.validation.readiness(activeProductId!),
    enabled: Boolean(activeProductId && isUUID(activeProductId)),
  });

  // 3. Fetch latest validation run
  const { data: latestRun } = useQuery({
    queryKey: queryKeys.validation.latest(activeProductId),
    queryFn: () => api.validation.latest(activeProductId!),
    enabled: Boolean(activeProductId && isUUID(activeProductId)),
  });

  // 4. Fetch recommendations
  const { data: recommendationsData } = useQuery({
    queryKey: queryKeys.validation.latestRecommendations(activeProductId),
    queryFn: () => api.validation.latestRecommendations(activeProductId!),
    enabled: Boolean(activeProductId && isUUID(activeProductId)),
  });

  // 5. Fetch competitors
  const { data: competitorData } = useQuery({
    queryKey: queryKeys.competitors.list(activeProductId),
    queryFn: () => api.competitors.list(activeProductId!),
    enabled: Boolean(activeProductId && isUUID(activeProductId)),
  });

  // 6. Fetch versions
  const { data: versionsData } = useQuery({
    queryKey: queryKeys.versions.list(activeProductId),
    queryFn: () => api.versions.list(activeProductId!),
    enabled: Boolean(activeProductId && isUUID(activeProductId)),
  });

  // Revalidate mutation
  const revalidateMutation = useMutation({
    mutationFn: () => api.validation.revalidate(activeProductId!),
    onSuccess: (run) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.validation.readiness(activeProductId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.validation.latest(activeProductId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.validation.latestRecommendations(activeProductId) });
      showToast({
        type: 'success',
        title: 'Revalidation Completed',
        message: `Pipeline revalidated for version ${run.version_number}. Readiness score: ${formatScore(run.readiness_score)}/100`,
      });
      setIsRevalidateDialogOpen(false);
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Revalidation Failed',
        message: err instanceof Error ? err.message : 'Unknown validation error',
      });
    },
  });

  if (hasIdParam && !isValidParamId) {
    return <NotFound />;
  }

  if (!activeProductId && !isProductLoading) {
    return (
      <div className="py-12">
        <EmptyState
          icon={<Sparkles className="w-8 h-8 text-indigo-600" />}
          title="No Analyses Found"
          description="Create your first D2C product analysis to evaluate launch readiness, unit economics, and competitive pricing."
          action={{
            label: 'Create Your First Analysis',
            onClick: () => navigate('/new-analysis'),
            icon: <PlusCircle className="w-4 h-4" />,
          }}
        />
      </div>
    );
  }

  if (isProductLoading) {
    return <DashboardSkeleton />;
  }

  if (productError) {
    return <AnalysisNotFound id={activeProductId} message="The requested analysis could not be found or does not exist." />;
  }

  if (!product) return null;

  // Derivations for Dashboard
  const revalidationNeeded = isRevalidationRequired(
    product.current_version,
    latestRun?.version_number
  );

  const stageResults = latestRun?.results || [];
  const passedStagesCount = stageResults.filter((r) => r.status === 'PASSED').length;
  const competitorsCount = competitorData?.items?.length || 0;

  // Missing evidence & risks count: stages with INSUFFICIENT_EVIDENCE + MISSING_INPUT findings
  const insufficientStagesCount = stageResults.filter(
    (r) => r.status === 'INSUFFICIENT_EVIDENCE'
  ).length;

  const missingInputsCount = stageResults.reduce((acc, r) => {
    const missingInStage = (r.findings || []).filter(
      (f) => f.code.startsWith('MISSING_INPUT') || f.severity === 'critical'
    ).length;
    return acc + missingInStage;
  }, 0);

  const missingEvidenceAndRisks = insufficientStagesCount + missingInputsCount;

  // Financial stage result
  const financialResult = stageResults.find((r) => r.stage === 'financial');

  // Competitor stage metrics
  const competitorResult = stageResults.find((r) => r.stage === 'competitor');
  const competitorMetrics = competitorResult?.metrics as any;

  return (
    <div className="space-y-6">
      {/* Header / Hero */}
      <ReadinessHero
        productName={product.name}
        category={product.category}
        targetMarket={product.target_market}
        readiness={readiness}
        isRevalidationRequired={revalidationNeeded}
        onRevalidate={() => setIsRevalidateDialogOpen(true)}
        isRevalidating={revalidateMutation.isPending}
      />

      {/* Four Core Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricTile
          label="Launch Readiness"
          value={`${formatScore(readiness?.overall_score)}/100`}
          subtitle={readiness?.label ? `Verdict: ${readiness.label}` : 'Pending validation'}
          metricKey="readiness_score"
          icon={<Sparkles className="w-4 h-4 text-indigo-600" />}
        />

        <MetricTile
          label="Passed Stages"
          value={`${passedStagesCount} of 6`}
          subtitle={
            passedStagesCount === 6
              ? 'All stage gates cleared'
              : `${6 - passedStagesCount} stages need action`
          }
          icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}
        />

        <MetricTile
          label="Competitors Tracked"
          value={competitorsCount}
          subtitle="Monitored alternatives"
          icon={<Users className="w-4 h-4 text-slate-600" />}
        />

        <MetricTile
          label="Missing Evidence & Risks"
          value={missingEvidenceAndRisks}
          subtitle={
            missingEvidenceAndRisks > 0
              ? `${insufficientStagesCount} insufficient stages, ${missingInputsCount} input gaps`
              : 'Zero missing inputs detected'
          }
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
        />
      </div>

      {/* 6-Stage Progress Strip */}
      <PipelineStrip productId={product.id} stageResults={stageResults} />

      {/* Middle Grid: Financial Snapshot & Competitor Price Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialSnapshotCard
          financialResult={financialResult}
          assumptions={product.assumptions}
        />
        <CompetitorPriceChart
          sellingPrice={product.assumptions?.pricing?.selling_price}
          competitors={competitorData?.items}
          competitorMetrics={competitorMetrics}
        />
      </div>

      {/* Bottom Grid: Priority Actions & Recent Change History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PriorityActionsCard
          productId={product.id}
          recommendations={recommendationsData?.items}
        />
        <ChangeHistoryCard
          productId={product.id}
          versions={versionsData?.items}
        />
      </div>

      {/* Quick Action Dock */}
      <div className="pt-2 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          Showing analysis for <span className="font-semibold text-slate-800">{product.name}</span> (v{product.current_version})
        </div>
        <QuickActions productId={product.id} />
      </div>

      {/* Confirm Dialog for Revalidation */}
      <ConfirmDialog
        isOpen={isRevalidateDialogOpen}
        title="Execute Validation Pipeline?"
        message={`This will execute the 6-stage sequential gatekeeper on ${product.name} (version ${product.current_version}). Recomputed metrics will update financial and readiness scores immediately.`}
        confirmLabel="Run Revalidation"
        isLoading={revalidateMutation.isPending}
        onConfirm={() => revalidateMutation.mutate()}
        onCancel={() => setIsRevalidateDialogOpen(false)}
      />
    </div>
  );
};
