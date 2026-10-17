import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from './Card';
import { ArrowLeft, Construction } from 'lucide-react';

interface ViewPlaceholderProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export const ViewPlaceholder: React.FC<ViewPlaceholderProps> = ({
  title,
  description,
  icon,
}) => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  return (
    <div className="py-8 max-w-3xl mx-auto space-y-6">
      <Card className="p-8 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
          {icon || <Construction className="w-6 h-6" />}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
          <p className="mt-1.5 text-xs text-slate-500 max-w-md mx-auto">{description}</p>
        </div>

        {id && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Product ID:
            </span>
            <span>{id}</span>
          </div>
        )}

        <div className="pt-4 flex justify-center">
          <button
            type="button"
            onClick={() => navigate(id ? `/${id}` : '/')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </Card>
    </div>
  );
};
