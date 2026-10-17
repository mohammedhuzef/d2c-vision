import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '../common/Card';
import { formatDate } from '../../utils/formatters';
import type { ProductVersionResponse } from '../../api/types';
import { History, GitCommit, ArrowRight } from 'lucide-react';

export interface ChangeHistoryCardProps {
  productId: string;
  versions?: ProductVersionResponse[];
}

export const ChangeHistoryCard: React.FC<ChangeHistoryCardProps> = ({
  productId,
  versions = [],
}) => {
  const recentVersions = [...versions].slice(0, 5);

  return (
    <Card padding="md">
      <CardHeader
        title="Recent Change History"
        subtitle="Last 5 immutable assumption versions and recorded impact events"
        action={
          <Link
            to={`/change-tracker/${productId}`}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Full Ledger
          </Link>
        }
      />

      <div className="mt-4 space-y-3">
        {recentVersions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No change events recorded yet.
          </div>
        ) : (
          recentVersions.map((v) => {
            const changes = v.change_summary
              ? Object.entries(v.change_summary)
              : [];

            return (
              <div
                key={v.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3"
              >
                <div className="p-2 bg-white rounded-lg border border-slate-200 text-indigo-600 shrink-0">
                  <GitCommit className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 font-mono-nums">
                      Version {v.version_number}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDate(v.created_at)}
                    </span>
                  </div>

                  {changes.length > 0 ? (
                    <ul className="mt-1 space-y-0.5 text-[11px] text-slate-600 font-mono">
                      {changes.map(([field, delta]: [string, any]) => (
                        <li key={field} className="truncate">
                          <span className="text-slate-800 font-medium">{field}:</span>{' '}
                          <span className="text-slate-500 line-through">
                            {delta?.old ?? '—'}
                          </span>{' '}
                          <span className="text-indigo-600 font-bold">
                            → {delta?.new ?? '—'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Initial baseline assumption configuration
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
