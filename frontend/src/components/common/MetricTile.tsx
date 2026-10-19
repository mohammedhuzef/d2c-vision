import React from 'react';
import { Card } from './Card';
import { deltaTone, type DeltaTone } from '../../utils/deltaTone';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

export interface MetricTileProps {
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  delta?: string | number | null;
  metricKey?: string;
  icon?: React.ReactNode;
  isMonospace?: boolean;
  className?: string;
}

export const MetricTile: React.FC<MetricTileProps> = ({
  label,
  value,
  subtitle,
  delta,
  metricKey,
  icon,
  isMonospace = true,
  className = '',
}) => {
  const tone: DeltaTone = metricKey && delta !== undefined && delta !== null
    ? deltaTone(metricKey, delta)
    : 'neutral';

  const toneClasses = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    negative: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  }[tone];

  const DeltaIcon =
    tone === 'positive' ? TrendingUp : tone === 'negative' ? TrendingDown : Minus;

  return (
    <Card className={`relative overflow-hidden ${className}`} padding="md">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div className="p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-100">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span
          className={`text-2xl font-bold text-slate-900 tracking-tight ${
            isMonospace ? 'font-mono-nums' : ''
          }`}
        >
          {value}
        </span>

        {delta !== undefined && delta !== null && delta !== '' && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${toneClasses}`}
          >
            <DeltaIcon className="w-3 h-3" />
            <span>{typeof delta === 'number' && delta > 0 ? `+${delta}` : delta}</span>
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 line-clamp-1">{subtitle}</p>
      )}
    </Card>
  );
};
