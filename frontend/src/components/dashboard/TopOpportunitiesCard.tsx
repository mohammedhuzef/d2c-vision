import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, ArrowUpRight } from 'lucide-react';

export interface OpportunityItem {
  id: string;
  name: string;
  status: string;
  score: number;
  image: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
}

export const TopOpportunitiesCard: React.FC = () => {
  const navigate = useNavigate();

  const opportunities: OpportunityItem[] = [
    {
      id: '1',
      name: 'Healthy Chocolate',
      status: 'High Demand',
      score: 92,
      image: '/images/cat-chocolates.jpg',
      badgeColor: '#047857',
      badgeBg: '#ECFDF5',
      badgeBorder: '#A7F3D0',
    },
    {
      id: '2',
      name: 'Makhana Snacks',
      status: 'Growing Fast',
      score: 88,
      image: '/images/cat-snacks.jpg',
      badgeColor: '#0284C7',
      badgeBg: '#F0F9FF',
      badgeBorder: '#BAE6FD',
    },
    {
      id: '3',
      name: 'Protein Snacks',
      status: 'Trending Niche',
      score: 84,
      image: '/images/cat-supplements.jpg',
      badgeColor: '#0F172A',
      badgeBg: '#F1F5F9',
      badgeBorder: '#CBD5E1',
    },
    {
      id: '4',
      name: 'Herbal Tea',
      status: 'Steady Growth',
      score: 81,
      image: '/images/cat-beverages.jpg',
      badgeColor: '#B45309',
      badgeBg: '#FFFBEB',
      badgeBorder: '#FDE68A',
    },
  ];

  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between h-full relative overflow-hidden transition-all duration-200 hover:border-slate-300">
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-xs">
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Top Opportunities</h3>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                Sample Scores
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500">Composite viability ranking from margin & competition index</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/validation')}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>Validate</span>
        </button>
      </div>

      {/* Four Opportunity Rows */}
      <div className="relative z-10 mt-3.5 space-y-2">
        {opportunities.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate('/validation')}
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all group cursor-pointer"
          >
            {/* Left: Thumbnail, Name, Short Status */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-100 group-hover:scale-105 transition-transform">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover object-center brightness-95 group-hover:brightness-100"
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                  {item.name}
                </div>
                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{item.status}</span>
                </div>
              </div>
            </div>

            {/* Right: Colorful Score Badge */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-xs font-mono-nums border shadow-2xs transition-transform group-hover:scale-105"
                style={{
                  color: item.badgeColor,
                  backgroundColor: item.badgeBg,
                  borderColor: item.badgeBorder,
                }}
              >
                {item.score}
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="relative z-10 pt-2.5 mt-3 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
        <span>Click any product opportunity to test viability</span>
        <span className="text-emerald-700 font-mono font-medium">Ranked by Viability</span>
      </div>
    </div>
  );
};
