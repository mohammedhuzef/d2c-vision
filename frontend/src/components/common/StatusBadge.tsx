import React from 'react';
import type { ReadinessLabel, StageStatus } from '../../api/types';
import {
  STAGE_STATUS_CONFIG,
  REVALIDATION_REQUIRED_META,
  READINESS_CONFIG,
  getEvidenceMeta,
} from '../../utils/status';

export interface StageStatusBadgeProps {
  status: StageStatus;
  isRevalidationRequired?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const StageStatusBadge: React.FC<StageStatusBadgeProps> = ({
  status,
  isRevalidationRequired = false,
  className = '',
  size = 'md',
}) => {
  const meta = isRevalidationRequired
    ? REVALIDATION_REQUIRED_META
    : STAGE_STATUS_CONFIG[status] || STAGE_STATUS_CONFIG.NOT_RUN;

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${meta.bgClass} ${meta.textClass} ${meta.borderClass} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
      <span>{meta.label}</span>
    </span>
  );
};

export interface ReadinessBadgeProps {
  label: ReadinessLabel;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ReadinessBadge: React.FC<ReadinessBadgeProps> = ({
  label,
  className = '',
  size = 'md',
}) => {
  const config = READINESS_CONFIG[label] || READINESS_CONFIG.INSUFFICIENT_EVIDENCE;

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-2 font-semibold rounded-full border shadow-2xs ${config.bgClass} ${config.textClass} ${config.borderClass} ${sizeClasses} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.badgeBg}`} />
      <span>{config.label}</span>
    </span>
  );
};

export interface EvidenceBadgeProps {
  sourceUrl?: string | null;
  confidence?: number | null;
  className?: string;
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({
  sourceUrl,
  confidence,
  className = '',
}) => {
  const meta = getEvidenceMeta(sourceUrl, confidence);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md border ${meta.bgClass} ${meta.textClass} ${meta.borderClass} ${className}`}
      title={
        meta.label === 'Verified'
          ? `Verified source with confidence ${confidence ? `${(confidence * 100).toFixed(0)}%` : 'N/A'}`
          : 'Hypothesis requiring primary verification'
      }
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          meta.label === 'Verified' ? 'bg-emerald-500' : 'bg-amber-500'
        }`}
      />
      <span>{meta.label}</span>
    </span>
  );
};
