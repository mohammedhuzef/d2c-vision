import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, TrendingUp } from 'lucide-react';

export interface TrendingProductItem {
  id: string;
  name: string;
  category: string;
  growth: string;
  image: string;
}

export const TrendingProductsCard: React.FC = () => {
  const navigate = useNavigate();
  const items: TrendingProductItem[] = [
    {
      id: '1',
      name: 'Protein Snacks',
      category: 'Supplements',
      growth: '+ 82%',
      image: '/images/cat-supplements.jpg',
    },
    {
      id: '2',
      name: 'Makhana Snacks',
      category: 'Snacks',
      growth: '+ 65%',
      image: '/images/cat-snacks.jpg',
    },
    {
      id: '3',
      name: 'Herbal Tea',
      category: 'Beverages',
      growth: '+ 48%',
      image: '/images/cat-beverages.jpg',
    },
    {
      id: '4',
      name: 'Skincare',
      category: 'Personal Care',
      growth: '+ 36%',
      image: '/images/cat-personal-care.jpg',
    },
  ];

  return (
    <div id="trends" className="glass-panel rounded-2xl p-4 border border-white/[0.08] flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white tracking-tight">Trending Products</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/trends')}
          className="text-[11px] font-medium text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>See All</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Grid of 4 Trending Products */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="group rounded-xl p-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.05] hover:border-indigo-500/30 transition-all flex flex-col justify-between cursor-pointer"
          >
            {/* Thumbnail */}
            <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-black/40 mb-2">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            </div>

            {/* Info */}
            <div>
              <h4 className="text-[11px] font-bold text-white truncate leading-tight group-hover:text-indigo-300 transition-colors">
                {item.name}
              </h4>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.category}</p>
            </div>

            {/* Growth Pill with sparkline icon */}
            <div className="mt-2 flex items-center justify-between pt-1 border-t border-white/[0.04]">
              <span className="text-[10px] font-bold text-emerald-400 font-mono-nums flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                <TrendingUp className="w-2.5 h-2.5" />
                {item.growth}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
