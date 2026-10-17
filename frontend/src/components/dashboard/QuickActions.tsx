import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ShieldCheck, FileText } from 'lucide-react';

export interface QuickActionsProps {
  productId: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ productId }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => navigate('/new-analysis')}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
      >
        <PlusCircle className="w-4 h-4" />
        New Analysis
      </button>

      <button
        type="button"
        onClick={() => navigate(`/validation/${productId}`)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shadow-2xs transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
      >
        <ShieldCheck className="w-4 h-4 text-indigo-600" />
        View Validation
      </button>

      <button
        type="button"
        onClick={() => navigate(`/reports/${productId}`)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl shadow-2xs transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
      >
        <FileText className="w-4 h-4 text-indigo-600" />
        Generate Report
      </button>
    </div>
  );
};
