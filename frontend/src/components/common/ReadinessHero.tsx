import React from 'react';
import { Card } from './Card';
import { ReadinessBadge } from './StatusBadge';
import type { ReadinessResponse } from '../../api/types';
import { formatScore } from '../../utils/formatters';
import { STAGE_DISPLAY_META } from '../../config/display';
import type { StageName } from '../../api/types';
import { AlertCircle, AlertTriangle, HelpCircle, RefreshCw } from 'lucide-react';

export interface ReadinessHeroProps {
  productName: string;
  category?: string | null;
  targetMarket?: string | null;
  readiness?: ReadinessResponse | null;
  isRevalidationRequired?: boolean;
  onRevalidate?: () => void;
  isRevalidating?: boolean;
  className?: string;
}

export const ReadinessHero: React.FC<ReadinessHeroProps> = ({
  productName,
  category,
  targetMarket,
  readiness,
  isRevalidationRequired,
  onRevalidate,
  isRevalidating,
  className = '',
}) => {
  const label = readiness?.label || 'INSUFFICIENT_EVIDENCE';
  const score = readiness?.overall_score;
  const blockingStages = (readiness?.blocking_stages || []) as StageName[];
  const warningStages = (readiness?.warning_stages || []) as StageName[];
  const missingStages = (readiness?.missing_stages || []) as StageName[];

  return (
    <Card className={`relative overflow-hidden border-slate-200 ${className}`} padding="lg">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Product identification & readiness */}
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              {category || 'D2C Product'}
            </span>
            {targetMarket && (
              <span className="text-xs text-slate-500 font-medium">
                • {targetMarket}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {productName}
          </h1>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <ReadinessBadge label={label} size="lg" />

            {isRevalidationRequired && onRevalidate && (
              <button
                type="button"
                onClick={onRevalidate}
                disabled={isRevalidating}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-full shadow-xs transition-colors focus:ring-2 focus:ring-purple-500 focus:outline-hidden disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? 'animate-spin' : ''}`} />
                {isRevalidating ? 'Revalidating...' : 'Run Revalidation'}
              </button>
            )}
          </div>
        </div>

        {/* Right: Score and stage breakdown */}
        <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
          <div className="text-center pr-6 border-r border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Launch Score
            </div>
            <div className="mt-1 flex items-baseline justify-center gap-1">
              <span className="text-3xl font-extrabold text-slate-900 font-mono-nums">
                {formatScore(score)}
              </span>
              <span className="text-xs font-medium text-slate-400">/100</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            {blockingStages.length > 0 && (
              <div className="flex items-center gap-1.5 text-red-700 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Blocking: {blockingStages.map((s) => STAGE_DISPLAY_META[s]?.shortName || s).join(', ')}
                </span>
              </div>
            )}
            {warningStages.length > 0 && (
              <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Warnings: {warningStages.map((s) => STAGE_DISPLAY_META[s]?.shortName || s).join(', ')}
                </span>
              </div>
            )}
            {missingStages.length > 0 && (
              <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Missing: {missingStages.map((s) => STAGE_DISPLAY_META[s]?.shortName || s).join(', ')}
                </span>
              </div>
            )}
            {blockingStages.length === 0 && warningStages.length === 0 && missingStages.length === 0 && (
              <div className="text-emerald-700 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>All pipeline benchmarks met</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
