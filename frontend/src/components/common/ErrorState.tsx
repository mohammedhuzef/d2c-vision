import React from 'react';
import { Card } from './Card';
import { ApiError } from '../../api/errors';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  title?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  title = 'Something went wrong',
  className = '',
}) => {
  const isApiError = error instanceof ApiError;
  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred';
  const requestId = isApiError ? error.requestId : undefined;
  const code = isApiError ? error.code : undefined;

  return (
    <Card
      className={`border-red-200 bg-red-50/40 p-6 ${className}`}
      padding="none"
    >
      <div className="flex items-start gap-4 p-6">
        <div className="p-2.5 rounded-full bg-red-100 text-red-600 shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-red-900">{title}</h4>
            {code && (
              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-medium">
                {code}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-red-800 leading-relaxed">{message}</p>

          {requestId && (
            <div className="mt-2 text-xs text-red-700 font-mono">
              <span className="text-red-500">Request ID:</span> {requestId}
            </div>
          )}

          {isApiError && error.details && error.details.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-red-700 bg-white/80 p-3 rounded-lg border border-red-200">
              {error.details.map((d, idx) => (
                <li key={idx} className="flex gap-1.5">
                  <span className="font-mono font-medium text-slate-800">
                    {d.field ? `${d.field}:` : '•'}
                  </span>
                  <span>{d.issue}</span>
                </li>
              ))}
            </ul>
          )}

          {onRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
