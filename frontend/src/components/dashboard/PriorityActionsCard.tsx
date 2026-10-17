import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '../common/Card';
import type { RecommendationItemResponse } from '../../api/types';
import { STAGE_DISPLAY_META } from '../../config/display';
import type { StageName } from '../../api/types';
import { ArrowUpRight, Target } from 'lucide-react';

export interface PriorityActionsCardProps {
  productId: string;
  recommendations?: RecommendationItemResponse[];
}

const PRIORITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export const PriorityActionsCard: React.FC<PriorityActionsCardProps> = ({
  productId,
  recommendations = [],
}) => {
  // Sort recommendations by priority and take top 5
  const topActions = [...recommendations]
    .sort((a, b) => {
      const orderA = PRIORITY_ORDER[a.priority] ?? 4;
      const orderB = PRIORITY_ORDER[b.priority] ?? 4;
      return orderA - orderB;
    })
    .slice(0, 5);

  const priorityStyles: Record<string, string> = {
    CRITICAL: 'bg-red-50 text-red-700 border-red-200',
    HIGH: 'bg-amber-50 text-amber-800 border-amber-200',
    MEDIUM: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    LOW: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <Card padding="md">
      <CardHeader
        title="Top Priority Engine Actions"
        subtitle="Ranked corrective actions to improve readiness score and pass blocked stages"
        action={
          <Link
            to={`/validation/${productId}`}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            All Recommendations
          </Link>
        }
      />

      <div className="mt-4 divide-y divide-slate-100">
        {topActions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No priority actions recommended. All stages passed benchmarks!
          </div>
        ) : (
          topActions.map((rec) => {
            const stageMeta = STAGE_DISPLAY_META[rec.stage as StageName];
            return (
              <div
                key={rec.id}
                className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        priorityStyles[rec.priority] || priorityStyles.LOW
                      }`}
                    >
                      {rec.priority}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {stageMeta?.shortName || rec.stage}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-900 leading-snug">
                    {rec.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {rec.detail}
                  </p>

                  {rec.suggested_value && (
                    <div className="pt-1 flex items-center gap-1.5 text-[11px]">
                      <Target className="w-3 h-3 text-indigo-600" />
                      <span className="text-slate-500">Suggested Target:</span>
                      <span className="font-semibold text-indigo-700 font-mono-nums bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        {rec.suggested_value}
                      </span>
                    </div>
                  )}
                </div>

                {rec.target_field && (
                  <Link
                    to={`/change-tracker/${productId}?field=${encodeURIComponent(rec.target_field)}`}
                    title="Simulate this change in Change Tracker"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0 mt-1"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
