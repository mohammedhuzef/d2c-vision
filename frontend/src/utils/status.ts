import { EVIDENCE_VERIFIED_CONFIDENCE_THRESHOLD } from '../config/display';
import type { ReadinessLabel, StageStatus } from '../api/types';

export interface StatusMeta {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
}

export const STAGE_STATUS_CONFIG: Record<StageStatus, StatusMeta> = {
  PASSED: {
    label: 'Pass',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  WARNING: {
    label: 'Needs Improvement',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
    dotClass: 'bg-amber-500',
  },
  FAILED: {
    label: 'Failed',
    bgClass: 'bg-red-50',
    textClass: 'text-red-700',
    borderClass: 'border-red-200',
    dotClass: 'bg-red-500',
  },
  INSUFFICIENT_EVIDENCE: {
    label: 'Insufficient Evidence',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-300',
    dotClass: 'bg-slate-400',
  },
  NOT_RUN: {
    label: 'Not Run',
    bgClass: 'bg-slate-50',
    textClass: 'text-slate-500',
    borderClass: 'border-slate-200',
    dotClass: 'bg-slate-300',
  },
};

export const REVALIDATION_REQUIRED_META: StatusMeta = {
  label: 'Revalidation Required',
  bgClass: 'bg-purple-50',
  textClass: 'text-purple-700',
  borderClass: 'border-purple-200',
  dotClass: 'bg-purple-500',
};

export const READINESS_CONFIG: Record<
  ReadinessLabel,
  { label: string; description: string; bgClass: string; textClass: string; borderClass: string; badgeBg: string }
> = {
  READY: {
    label: 'Ready to Launch',
    description: 'All stages passed validation benchmarks with satisfactory evidence.',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-200',
    badgeBg: 'bg-emerald-600',
  },
  READY_WITH_WARNINGS: {
    label: 'Ready with Warnings',
    description: 'Core financial and pricing metrics pass, but non-blocking risks require attention.',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-900',
    borderClass: 'border-amber-200',
    badgeBg: 'bg-amber-600',
  },
  NOT_READY: {
    label: 'Not Ready to Launch',
    description: 'Critical stages failed or severe unit economic blockers detected.',
    bgClass: 'bg-red-50',
    textClass: 'text-red-900',
    borderClass: 'border-red-200',
    badgeBg: 'bg-red-600',
  },
  INSUFFICIENT_EVIDENCE: {
    label: 'Insufficient Evidence',
    description: 'Missing essential inputs or critical stage evidence required to calculate viability.',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-800',
    borderClass: 'border-slate-300',
    badgeBg: 'bg-slate-600',
  },
};

export function getEvidenceMeta(sourceUrl?: string | null, confidence?: number | null): {
  label: 'Verified' | 'Hypothesis';
  bgClass: string;
  textClass: string;
  borderClass: string;
} {
  const isVerified = Boolean(
    sourceUrl &&
      sourceUrl.trim() !== '' &&
      confidence !== null &&
      confidence !== undefined &&
      confidence >= EVIDENCE_VERIFIED_CONFIDENCE_THRESHOLD
  );

  if (isVerified) {
    return {
      label: 'Verified',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-700',
      borderClass: 'border-emerald-200',
    };
  }

  return {
    label: 'Hypothesis',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
  };
}

export function isRevalidationRequired(
  currentProductVersion?: number,
  latestRunVersion?: number
): boolean {
  if (currentProductVersion === undefined || latestRunVersion === undefined) {
    return false;
  }
  return currentProductVersion > latestRunVersion;
}
