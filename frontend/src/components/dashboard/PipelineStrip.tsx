import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../common/Card';
import { PIPELINE_STAGE_ORDER, STAGE_DISPLAY_META } from '../../config/display';
import { STAGE_STATUS_CONFIG } from '../../utils/status';
import type { StageResultDetailResponse, StageStatus } from '../../api/types';
import { ArrowRight, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

export interface PipelineStripProps {
  productId: string;
  stageResults?: StageResultDetailResponse[];
}

export const PipelineStrip: React.FC<PipelineStripProps> = ({
  productId,
  stageResults = [],
}) => {
  const stageMap = new Map<string, StageResultDetailResponse>();
  for (const res of stageResults) {
    stageMap.set(res.stage, res);
  }

  const getStatusIcon = (status: StageStatus) => {
    switch (status) {
      case 'PASSED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'INSUFFICIENT_EVIDENCE':
        return <HelpCircle className="w-4 h-4 text-slate-500" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-slate-300" />;
    }
  };

  return (
    <Card padding="md">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            6-Stage Validation Pipeline
          </h3>
          <p className="text-xs text-slate-500">
            Sequential evaluation gates from customer signal to marketing feasibility
          </p>
        </div>
        <Link
          to={`/validation/${productId}`}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
        >
          View Full Pipeline
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {PIPELINE_STAGE_ORDER.map((stageKey) => {
          const meta = STAGE_DISPLAY_META[stageKey];
          const result = stageMap.get(stageKey);
          const status: StageStatus = result?.status || 'NOT_RUN';
          const statusConfig = STAGE_STATUS_CONFIG[status] || STAGE_STATUS_CONFIG.NOT_RUN;

          return (
            <Link
              key={stageKey}
              to={`/validation/${productId}#stage-${stageKey}`}
              className={`p-3 rounded-xl border transition-all hover:shadow-xs group flex flex-col justify-between ${statusConfig.bgClass} ${statusConfig.borderClass}`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[11px] font-bold text-slate-500 font-mono-nums">
                  0{meta.number}
                </span>
                {getStatusIcon(status)}
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {meta.shortName}
                </span>
                <span className={`block text-[11px] font-medium mt-0.5 ${statusConfig.textClass}`}>
                  {statusConfig.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
};
