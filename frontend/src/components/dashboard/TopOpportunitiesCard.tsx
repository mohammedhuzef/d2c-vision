import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export interface OpportunityItem {
  id: string;
  name: string;
  tag: string;
  score: number;
  image: string;
}

export const TopOpportunitiesCard: React.FC = () => {
  const opportunities: OpportunityItem[] = [
    {
      id: '1',
      name: 'Healthy Chocolate',
      tag: 'High Demand',
      score: 92,
      image: '/images/cat-chocolates.jpg',
    },
    {
      id: '2',
      name: 'Makhana Snacks',
      tag: 'Growing Fast',
      score: 88,
      image: '/images/cat-snacks.jpg',
    },
    {
      id: '3',
      name: 'Plant Protein',
      tag: 'Trending',
      score: 85,
      image: '/images/cat-supplements.jpg',
    },
    {
      id: '4',
      name: 'Herbal Tea',
      tag: 'Steady Growth',
      score: 81,
      image: '/images/cat-beverages.jpg',
    },
  ];

  return (
    <div className="glass-panel rounded-2xl p-4 border border-white/[0.08] flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white tracking-tight">Top Opportunities</span>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">Viability Score</span>
      </div>

      {/* List */}
      <div className="mt-2 space-y-2">
        {opportunities.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] transition-all group cursor-pointer"
          >
            {/* Left: Thumbnail & Name */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-white/[0.08]">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                  {item.name}
                </div>
                <div className="text-[10px] text-slate-400">{item.tag}</div>
              </div>
            </div>

            {/* Right: Viability Score Pill */}
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xs font-extrabold text-emerald-400 font-mono-nums shadow-[0_0_8px_rgba(16,185,129,0.2)]">
              {item.score}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
