import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export interface MockProviderBannerProps {
  isMock: boolean;
  className?: string;
}

export const MockProviderBanner: React.FC<MockProviderBannerProps> = ({ isMock, className = '' }) => {
  if (!isMock) return null;

  return (
    <div
      role="status"
      className={`bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-900 ${className}`}
    >
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-semibold">Sample research data (mock provider)</span>
        <span className="text-amber-700 hidden sm:inline">
          — Insights and competitor pricing shown are seeded simulation benchmarks.
        </span>
      </div>
    </div>
  );
};
