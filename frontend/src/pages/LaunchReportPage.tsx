import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { queryKeys } from '../services/queryKeys';
import { formatScore, formatMoney, formatPercent, formatUnits, formatDate } from '../utils/formatters';
import { READINESS_CONFIG, STAGE_STATUS_CONFIG } from '../utils/status';
import { Card, CardHeader } from '../components/common/Card';
import { DashboardSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../components/common/Toast';
import type { ReportResponse, StageStatus } from '../api/types';
import {
  FileText,
  Download,
  Copy,
  Printer,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';

import { AnalysisNotFound } from '../components/layout/AnalysisNotFound';

export const LaunchReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const isUUID = (str?: string): boolean =>
    Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

  const [activeTab, setActiveTab] = useState<'visual' | 'markdown'>('visual');
  const [validationRequired409, setValidationRequired409] = useState<boolean>(false);

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

  // 2. Fetch reports list
  const {
    data: reportsData,
    isLoading: isReportsLoading,
  } = useQuery({
    queryKey: queryKeys.reports.list(id),
    queryFn: () => api.reports.list(id!),
    enabled: Boolean(id),
  });

  // Generate report mutation
  const generateMutation = useMutation({
    mutationFn: () => api.reports.create(id!),
    onSuccess: () => {
      setValidationRequired409(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.reports.list(id) });
      showToast({
        type: 'success',
        title: 'Launch Report Generated',
        message: 'Comprehensive launch dossier and executive summary are ready.',
      });
    },
    onError: (err: any) => {
      if (err?.status === 409 || err?.code === 'BAD_STATE') {
        setValidationRequired409(true);
      } else {
        showToast({
          type: 'error',
          title: 'Report Generation Failed',
          message: err instanceof Error ? err.message : 'Unknown generation error',
        });
      }
    },
  });

  // Run validation mutation (if user hits 409 and needs to run validation)
  const validateMutation = useMutation({
    mutationFn: () => api.validation.validate(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.validation.latest(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.validation.readiness(id) });
      setValidationRequired409(false);
      showToast({
        type: 'success',
        title: 'Validation Completed',
        message: 'Pipeline validated. You can now generate the launch report.',
      });
      // Automatically generate report after successful validation
      generateMutation.mutate();
    },
    onError: (err) => {
      showToast({
        type: 'error',
        title: 'Validation Failed',
        message: err instanceof Error ? err.message : 'Validation pipeline error',
      });
    },
  });

  if (!id || !isUUID(id)) {
    return <AnalysisNotFound id={id} />;
  }

  if (isProductLoading || isReportsLoading) {
    return <DashboardSkeleton />;
  }

  if (productError || !product) {
    return <AnalysisNotFound id={id} message="The requested analysis could not be found or does not exist." />;
  }

  const reports = reportsData?.items || [];
  const latestReport = reports[0] as ReportResponse | undefined;

  // Copy Markdown to Clipboard
  const handleCopyMarkdown = () => {
    if (!latestReport?.markdown) return;
    navigator.clipboard.writeText(latestReport.markdown);
    showToast({
      type: 'success',
      title: 'Copied to Clipboard',
      message: 'Markdown dossier copied to clipboard.',
    });
  };

  // Download Markdown file
  const handleDownloadMarkdown = () => {
    if (!latestReport?.markdown) return;
    const blob = new Blob([latestReport.markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    link.download = `${slug}-launch-report.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast({
      type: 'success',
      title: 'Download Started',
      message: `${slug}-launch-report.md downloaded.`,
    });
  };

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  const content = (latestReport?.content || {}) as Record<string, any>;
  const execSummary = (content.executive_summary || {}) as Record<string, any>;
  const unitEconomics = (content.unit_economics || {}) as Record<string, any>;
  const stageTable = (content.stage_table || []) as any[];
  const risks = (content.unresolved_risks || []) as any[];
  const recommendations = (content.strategic_recommendations || []) as any[];
  const evidenceQuality = (content.evidence_quality || {}) as Record<string, any>;
  const citations = (evidenceQuality.citations || []) as any[];

  const readinessVerdict = (execSummary.readiness_label || 'NOT_RUN') as string;
  const readinessMeta = READINESS_CONFIG[readinessVerdict as keyof typeof READINESS_CONFIG];

  return (
    <div className="space-y-6 pb-12 print:p-0 print:m-0 print:space-y-4">
      {/* 409 Validation Required Banner */}
      {validationRequired409 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Run validation first</span>
          </div>
          <p className="text-xs text-amber-800">
            Validation must be run on the latest product version before generating a launch readiness report.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => validateMutation.mutate()}
              disabled={validateMutation.isPending}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {validateMutation.isPending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>Run Validation Now</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(`/validation/${id}`)}
              className="text-xs text-amber-800 underline hover:text-amber-900 font-medium cursor-pointer"
            >
              View Pipeline Details →
            </button>
          </div>
        </div>
      )}

      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            <span>Executive Launch Dossier</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {product.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive audit report evaluating stage gates, unit economics, and launch risks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {generateMutation.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Generate Fresh Report</span>
          </button>

          {latestReport && (
            <>
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Copy Markdown to Clipboard"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Copy MD</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Download Markdown Dossier"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Download</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Print Report"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Print</span>
              </button>
            </>
          )}
        </div>
      </div>

      {!latestReport ? (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-indigo-600" />}
          title="No Launch Reports Generated Yet"
          description="Generate a formal dossier synthesizing your validation findings, financial models, and strategic recommendations."
          action={{
            label: generateMutation.isPending ? 'Generating...' : 'Generate Launch Report',
            onClick: () => generateMutation.mutate(),
            icon: <Sparkles className="w-4 h-4" />,
          }}
        />
      ) : (
        <>
          {/* View Toggle Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 print:hidden">
            <button
              type="button"
              onClick={() => setActiveTab('visual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'visual'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visual Executive Layout
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('markdown')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'markdown'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Raw Markdown Dossier
            </button>
          </div>

          {activeTab === 'visual' ? (
            <div className="space-y-6 print:space-y-4">
              {/* Executive Hero */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4 print:border-none print:p-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      LaunchTwin AI • Official Launch Dossier
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                      {product.name}
                    </h2>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>Category: {product.category}</span>
                      <span>•</span>
                      <span>Version {product.current_version}</span>
                      <span>•</span>
                      <span>Generated: {formatDate(latestReport.generated_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">Readiness Score</div>
                      <div className="text-3xl font-bold font-mono-nums text-slate-900">
                        {formatScore(execSummary.readiness_score)}/100
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs ${
                        readinessMeta?.badgeBg || 'bg-slate-700'
                      }`}
                    >
                      {readinessVerdict}
                    </span>
                  </div>
                </div>

                {execSummary.verdict && (
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {execSummary.verdict}
                  </p>
                )}
              </div>

              {/* Unit Economics Section */}
              <Card padding="md">
                <CardHeader
                  title="Unit Economics & Viability Profile"
                  subtitle="Key financial benchmarks verified by Stage 5 financial engine"
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400">Target Retail Price</span>
                    <div className="text-base font-bold font-mono-nums text-slate-900 mt-0.5">
                      {formatMoney(unitEconomics.selling_price)}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400">Variable Cost / Unit</span>
                    <div className="text-base font-bold font-mono-nums text-slate-900 mt-0.5">
                      {formatMoney(unitEconomics.variable_cost_per_unit)}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400">Contribution Margin</span>
                    <div className="text-base font-bold font-mono-nums text-indigo-600 mt-0.5">
                      {formatPercent(unitEconomics.contribution_margin)}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400">Break-Even Units</span>
                    <div className="text-base font-bold font-mono-nums text-slate-900 mt-0.5">
                      {formatUnits(unitEconomics.break_even_units)}
                    </div>
                  </div>
                </div>
              </Card>

              {/* 6 Stage Breakdown Table */}
              <Card padding="md">
                <CardHeader
                  title="Sequential Stage Gate Evaluation"
                  subtitle="Gate outcomes and scores across all 6 validation dimensions"
                />

                <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Stage</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Score</th>
                        <th className="p-3">Findings</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stageTable.map((st: any) => {
                        const status = (st.status || 'NOT_RUN') as StageStatus;
                        const meta = STAGE_STATUS_CONFIG[status];
                        return (
                          <tr key={st.stage}>
                            <td className="p-3 font-semibold text-slate-900 capitalize">
                              {st.stage.replace(/_/g, ' ')}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                              >
                                {meta.label}
                              </span>
                            </td>
                            <td className="p-3 font-mono-nums font-bold text-slate-800">
                              {formatScore(st.score)}/100
                            </td>
                            <td className="p-3 text-slate-500 font-mono-nums">
                              {st.findings_count} findings
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Unresolved Risks & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Risks */}
                <Card padding="md">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Unresolved Risks ({risks.length})
                    </h3>
                  </div>

                  <div className="space-y-2 mt-3">
                    {risks.length === 0 ? (
                      <div className="text-xs text-emerald-600 py-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Zero critical or warning risks detected.</span>
                      </div>
                    ) : (
                      risks.map((r: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                            r.severity === 'critical'
                              ? 'bg-red-50 text-red-800 border-red-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                            <span>{r.stage}</span>
                            <span>{r.code}</span>
                          </div>
                          <p>{r.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                {/* Recommendations */}
                <Card padding="md">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Strategic Recommendations ({recommendations.length})
                    </h3>
                  </div>

                  <div className="space-y-2 mt-3">
                    {recommendations.length === 0 ? (
                      <div className="text-xs text-slate-400 py-2">
                        No pending strategic improvements logged.
                      </div>
                    ) : (
                      recommendations.map((rec: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg border border-indigo-100 bg-indigo-50/50 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{rec.title}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-200 text-indigo-800">
                              {rec.priority}
                            </span>
                          </div>
                          <p className="text-slate-600 leading-relaxed">{rec.detail}</p>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>

              {/* Evidence Quality Section */}
              <Card padding="md">
                <CardHeader
                  title="Evidence Quality Index (EQI)"
                  subtitle="Verification rigor and citation provenance supporting validation scores"
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400">Total Evidence Items</span>
                    <div className="text-base font-bold font-mono-nums text-slate-900 mt-0.5">
                      {evidenceQuality.total_evidence_items || 0}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400">Average Confidence</span>
                    <div className="text-base font-bold font-mono-nums text-emerald-600 mt-0.5">
                      {evidenceQuality.average_confidence
                        ? formatPercent(evidenceQuality.average_confidence)
                        : '—'}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400">With Web Source URL</span>
                    <div className="text-base font-bold font-mono-nums text-indigo-600 mt-0.5">
                      {evidenceQuality.share_with_source_url
                        ? formatPercent(evidenceQuality.share_with_source_url)
                        : '—'}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-400">Deficient Stages</span>
                    <div className="text-base font-bold font-mono-nums text-slate-900 mt-0.5">
                      {evidenceQuality.stages_missing_evidence?.length || 0}
                    </div>
                  </div>
                </div>

                {citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="text-xs font-bold text-slate-800">
                      Primary Supporting Citations
                    </div>
                    <div className="space-y-1.5">
                      {citations.slice(0, 5).map((c: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-2 bg-slate-50 rounded border border-slate-100 text-xs flex items-center justify-between"
                        >
                          <div className="truncate max-w-lg">
                            <span className="font-semibold text-slate-800">{c.title}: </span>
                            <span className="text-slate-500">{c.excerpt}</span>
                          </div>
                          {c.source_url && (
                            <a
                              href={c.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline flex items-center gap-1 shrink-0 ml-2"
                            >
                              <span>Source</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            /* Raw Markdown Tab */
            <div className="bg-slate-900 text-slate-100 p-6 rounded-xl border border-slate-800 overflow-x-auto font-mono text-xs leading-relaxed">
              <pre>{latestReport.markdown}</pre>
            </div>
          )}
        </>
      )}
    </div>
  );
};
