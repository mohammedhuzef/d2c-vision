import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { queryKeys } from '../services/queryKeys';
import { formatMoney, formatDate } from '../utils/formatters';
import { getEvidenceMeta } from '../utils/status';
import { Card, CardHeader } from '../components/common/Card';
import { DashboardSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { MockProviderBanner } from '../components/layout/MockProviderBanner';
import { useToast } from '../components/common/Toast';
import {
  Users2,
  ExternalLink,
  Search,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';

import { AnalysisNotFound } from '../components/layout/AnalysisNotFound';

export const CompetitorIntelligencePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const isUUID = (str?: string): boolean =>
    Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

  const [isResearchConfirmOpen, setIsResearchConfirmOpen] = useState(false);
  const [evidenceFilter, setEvidenceFilter] = useState<'all' | 'verified' | 'hypothesis'>('all');

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

  // Fetch competitors
  const {
    data: competitorsData,
    isLoading: isCompetitorsLoading,
  } = useQuery({
    queryKey: queryKeys.competitors.list(id),
    queryFn: () => api.competitors.list(id!),
    enabled: Boolean(id),
  });

  // Fetch latest validation run (for competitor stage metrics)
  const { data: latestRun } = useQuery({
    queryKey: queryKeys.validation.latest(id),
    queryFn: () => api.validation.latest(id!),
    enabled: Boolean(id),
  });

  // Fetch evidence list
  const {
    data: evidenceData,
    isLoading: _isEvidenceLoading,
  } = useQuery({
    queryKey: queryKeys.evidence.list(id),
    queryFn: () => api.evidence.list(id!),
    enabled: Boolean(id),
  });

  // Run Research mutation
  const researchMutation = useMutation({
    mutationFn: () => api.research.start(id!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.competitors.list(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.evidence.list(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.validation.latest(id) });
      showToast({
        type: 'success',
        title: 'Research Engine Finished',
        message: `Extracted fresh intelligence for tracked competitors. Discovered ${data.evidence_count} evidence items.`,
      });
      setIsResearchConfirmOpen(false);
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Research Engine Failed',
        message: err instanceof Error ? err.message : 'Unknown research failure',
      });
      setIsResearchConfirmOpen(false);
    },
  });

  if (!id || !isUUID(id)) {
    return <AnalysisNotFound id={id} />;
  }

  if (isProductLoading || isCompetitorsLoading) {
    return <DashboardSkeleton />;
  }

  if (productError || !product) {
    return <AnalysisNotFound id={id} message="The requested analysis could not be found or does not exist." />;
  }

  const competitors = competitorsData?.items || [];
  const evidenceItems = evidenceData?.items || [];

  // Competitor stage metrics from latest validation run
  const compResult = latestRun?.results?.find((r) => r.stage === 'competitor');
  const compMetrics = compResult?.metrics as Record<string, any> | undefined;

  const yourPriceStr = product.assumptions?.pricing?.selling_price;
  const yourPriceNum = yourPriceStr ? Number(yourPriceStr) : null;
  const medianPrice = compMetrics?.competitor_price_median
    ? Number(compMetrics.competitor_price_median)
    : null;
  const minPrice = compMetrics?.competitor_price_min
    ? Number(compMetrics.competitor_price_min)
    : null;
  const maxPrice = compMetrics?.competitor_price_max
    ? Number(compMetrics.competitor_price_max)
    : null;

  // Chart data
  const chartData = [
    ...(yourPriceNum !== null
      ? [
          {
            name: 'Your Product',
            price: yourPriceNum,
            isYourProduct: true,
          },
        ]
      : []),
    ...competitors
      .map((c) => {
        const obsPrice = c.analyses?.[0]?.price_observed;
        return {
          name: c.name,
          price: obsPrice !== undefined && obsPrice !== null ? Number(obsPrice) : null,
          isYourProduct: false,
        };
      })
      .filter((item): item is { name: string; price: number; isYourProduct: boolean } => item.price !== null),
  ];

  // Provider badge & mock banner condition
  const isMockProvider = product.research_provider === 'mock';

  // Filtered evidence
  const filteredEvidence = evidenceItems.filter((e) => {
    if (evidenceFilter === 'all') return true;
    const meta = getEvidenceMeta(e.source_url, e.confidence);
    return meta.label.toLowerCase() === evidenceFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Sample Data Banner (Mock Provider only) */}
      <MockProviderBanner isMock={isMockProvider} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
              <Users2 className="w-4 h-4" />
              <span>Competitor Intelligence & Pricing Corridor</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isMockProvider
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              {isMockProvider ? 'Provider: Mock Engine' : 'Provider: Real AI Engine'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {product.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Category: <span className="font-semibold text-slate-700">{product.category}</span> • Target: {product.target_market || 'Direct Consumers'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsResearchConfirmOpen(true)}
            disabled={researchMutation.isPending}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {researchMutation.isPending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Research...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Run Research</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Metric Summary Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Tracked Alternatives</div>
          <div className="text-2xl font-bold text-slate-900 font-mono-nums mt-1">
            {competitors.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">In current analysis</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Your Selling Price</div>
          <div className="text-2xl font-bold text-indigo-600 font-mono-nums mt-1">
            {formatMoney(yourPriceStr)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Target unit retail</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Market Median Price</div>
          <div className="text-2xl font-bold text-slate-800 font-mono-nums mt-1">
            {medianPrice !== null ? formatMoney(medianPrice) : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {minPrice !== null && maxPrice !== null
              ? `Range: ${formatMoney(minPrice)} - ${formatMoney(maxPrice)}`
              : 'Benchmark corridor'}
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">Evidence Snippets</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono-nums mt-1">
            {evidenceItems.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Verified & market signals</div>
        </div>
      </div>

      {/* Price Corridor Chart */}
      <Card padding="md">
        <CardHeader
          title="Price Corridor & Market Positioning"
          subtitle="Direct comparison of your target retail price against surveyed market competitors"
        />

        <div className="h-72 w-full mt-4">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No competitor pricing points logged yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  interval={0}
                  tickFormatter={(val) => (val.length > 14 ? `${val.slice(0, 12)}...` : val)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  formatter={(value: any) => [formatMoney(value), 'Observed Price']}
                  labelStyle={{ fontWeight: 600, color: '#0F172A' }}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                  }}
                />
                {yourPriceNum !== null && (
                  <ReferenceLine
                    y={yourPriceNum}
                    stroke="#4F46E5"
                    strokeDasharray="4 4"
                    label={{
                      value: `Your Price: ₹${yourPriceNum}`,
                      position: 'insideTopRight',
                      fill: '#4F46E5',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                )}
                {medianPrice !== null && (
                  <ReferenceLine
                    y={medianPrice}
                    stroke="#D97706"
                    strokeDasharray="2 2"
                    label={{
                      value: `Median: ₹${medianPrice}`,
                      position: 'insideBottomRight',
                      fill: '#D97706',
                      fontSize: 10,
                    }}
                  />
                )}
                <Bar dataKey="price" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isYourProduct ? '#4F46E5' : '#94A3B8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* Competitors List Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Users2 className="w-4 h-4 text-slate-600" />
            <span>Monitored Competitors ({competitors.length})</span>
          </h2>
        </div>

        {competitors.length === 0 ? (
          <EmptyState
            icon={<Users2 className="w-8 h-8 text-slate-400" />}
            title="No Competitors Logged"
            description="Add competitor brands to benchmark pricing corridors, features, and market positioning."
            action={{
              label: 'Add Competitors via Wizard',
              onClick: () => navigate('/new-analysis'),
              icon: <PlusCircle className="w-4 h-4" />,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {competitors.map((c) => {
              const analysis = (c.analyses?.[0] || {}) as Record<string, any>;
              const obsPrice = analysis?.price_observed as string | number | undefined;
              const strengths = (Array.isArray(analysis?.strengths) ? analysis.strengths : []) as string[];
              const weaknesses = (Array.isArray(analysis?.weaknesses) ? analysis.weaknesses : []) as string[];
              const summaryText = typeof analysis?.summary === 'string' ? analysis.summary : '';
              const producedByText = typeof analysis?.produced_by === 'string' ? analysis.produced_by : 'manual';

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
                        {c.website_url && (
                          <a
                            href={c.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-indigo-600"
                            title="Visit website"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      {c.product_name && (
                        <div className="text-xs text-slate-500 mt-0.5">{c.product_name}</div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">Observed Price</div>
                      <div className="text-base font-bold font-mono-nums text-slate-900">
                        {obsPrice !== undefined && obsPrice !== null ? formatMoney(obsPrice) : '—'}
                      </div>
                    </div>
                  </div>

                  {c.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {c.notes}
                    </p>
                  )}

                  {summaryText && (
                    <div className="text-xs text-slate-700">
                      <span className="font-semibold text-slate-800">Intelligence Summary: </span>
                      {summaryText}
                    </div>
                  )}

                  {/* Strengths & Weaknesses */}
                  {(strengths.length > 0 || weaknesses.length > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      {strengths.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            <span>Strengths</span>
                          </span>
                          <ul className="text-[11px] text-slate-600 space-y-0.5">
                            {strengths.map((s: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-emerald-500 font-bold">•</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {weaknesses.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-red-700 uppercase flex items-center gap-1">
                            <ThumbsDown className="w-3 h-3" />
                            <span>Weaknesses</span>
                          </span>
                          <ul className="text-[11px] text-slate-600 space-y-0.5">
                            {weaknesses.map((w: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-red-500 font-bold">•</span>
                                <span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
                    <span>Evidence items: {c.evidence_count}</span>
                    <span>Produced by: {producedByText}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Evidence Ledger Section */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-600" />
              <span>Evidence Repository ({evidenceItems.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified citations, web extractions, and market benchmarks collected for validation.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg text-xs">
            {(['all', 'verified', 'hypothesis'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setEvidenceFilter(filter)}
                className={`px-2.5 py-1 rounded-md font-medium capitalize cursor-pointer transition-colors ${
                  evidenceFilter === filter
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {filteredEvidence.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No evidence matching selected filter.
            </div>
          ) : (
            filteredEvidence.map((ev) => {
              const meta = getEvidenceMeta(ev.source_url, ev.confidence);
              const confPct = ev.confidence !== null && ev.confidence !== undefined
                ? Math.round(Number(ev.confidence) * 100)
                : null;

              return (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                      >
                        {meta.label}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{ev.title}</h4>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
                      {confPct !== null && (
                        <span className="font-mono-nums font-semibold text-slate-700">
                          {confPct}% confidence
                        </span>
                      )}
                      <span>{formatDate(ev.created_at)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{ev.excerpt}</p>

                  {ev.source_url && (
                    <div className="pt-1 flex items-center gap-1.5 text-[11px] text-indigo-600">
                      <ExternalLink className="w-3 h-3" />
                      <a
                        href={ev.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline truncate max-w-lg"
                      >
                        {ev.source_url}
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Confirm Dialog for Run Research */}
      <ConfirmDialog
        isOpen={isResearchConfirmOpen}
        title="Execute Market Research Run?"
        message={`This will trigger automated web discovery and competitor extraction for ${product.name} using the ${product.research_provider} provider.`}
        confirmLabel="Run Research Now"
        isLoading={researchMutation.isPending}
        onConfirm={() => researchMutation.mutate()}
        onCancel={() => setIsResearchConfirmOpen(false)}
      />
    </div>
  );
};
