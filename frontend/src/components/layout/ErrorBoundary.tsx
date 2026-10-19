import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card } from '../common/Card';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { ApiError } from '../../api/errors';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React application error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      const error = this.state.error;
      const requestId = error instanceof ApiError ? error.requestId : (error as any)?.request_id;

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <Card className="max-w-md w-full border-red-200 p-8 text-center" padding="none">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Application Error
            </h2>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              {error?.message ||
                'An unexpected client error occurred while rendering this view.'}
            </p>
            {requestId && (
              <div className="mb-6 p-2 bg-slate-100 rounded-lg text-left text-xs font-mono text-slate-600 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">
                  Request ID
                </span>
                <span className="break-all">{requestId}</span>
              </div>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry View
              </button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
