import React from 'react';

export const Skeleton: React.FC<{
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
}> = ({ className = '', variant = 'rectangular' }) => {
  const variantClasses = {
    text: 'h-4 rounded-md',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  }[variant];

  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-slate-200/80 ${variantClasses} ${className}`}
    />
  );
};

export const CardSkeleton: React.FC<{ className?: string; height?: string }> = ({
  className = '',
  height = 'h-48',
}) => (
  <div
    className={`bg-white rounded-[14px] border border-slate-200 p-6 flex flex-col justify-between ${height} ${className}`}
  >
    <div className="space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse">
    {/* Hero skeleton */}
    <div className="bg-white rounded-[14px] border border-slate-200 p-6 h-36" />
    {/* Metrics grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <CardSkeleton height="h-32" />
      <CardSkeleton height="h-32" />
      <CardSkeleton height="h-32" />
      <CardSkeleton height="h-32" />
    </div>
    {/* Pipeline strip skeleton */}
    <div className="bg-white rounded-[14px] border border-slate-200 p-6 h-28" />
    {/* Two column grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <CardSkeleton height="h-64" />
        <CardSkeleton height="h-64" />
      </div>
      <div className="space-y-6">
        <CardSkeleton height="h-64" />
        <CardSkeleton height="h-64" />
      </div>
    </div>
  </div>
);
