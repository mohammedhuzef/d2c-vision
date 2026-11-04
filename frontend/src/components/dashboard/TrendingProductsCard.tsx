import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, TrendingUp } from 'lucide-react';

export interface TrendingProductItem {
  id: string;
  name: string;
  category: string;
  growth: string;
  image: string;
  sparkline: number[];
}

export const TrendingProductsCard: React.FC = () => {
  const navigate = useNavigate();

  const items: TrendingProductItem[] = [
    {
      id: '1',
      name: 'Healthy Chocolate',
      category: 'Gourmet Wellness',
      growth: '+82%',
      image: '/images/cat-chocolates.jpg',
      sparkline: [22, 28, 35, 42, 58, 82],
    },
    {
      id: '2',
      name: 'Makhana Snacks',
      category: 'Healthy Snacks',
      growth: '+65%',
      image: '/images/cat-snacks.jpg',
      sparkline: [20, 24, 30, 48, 52, 65],
    },
    {
      id: '3',
      name: 'Herbal Tea',
      category: 'Functional Beverages',
      growth: '+48%',
      image: '/images/cat-beverages.jpg',
      sparkline: [15, 22, 26, 32, 40, 48],
    },
    {
      id: '4',
      name: 'Skincare',
      category: 'Personal Care',
      growth: '+36%',
      image: '/images/cat-personal-care.jpg',
      sparkline: [14, 18, 22, 28, 31, 36],
    },
  ];

  // Helper to render an SVG sparkline path with emerald stroke
  const renderSparkline = (points: number[]) => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const width = 64;
    const height = 20;

    const coords = points.map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((val - min) / (max - min || 1)) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathD = `M ${coords.join(' L ')}`;

    return (
      <svg className="w-16 h-5 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="emeraldSparkline" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
        </defs>
        <path
          d={pathD}
          fill="none"
          stroke="url(#emeraldSparkline)"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End dot */}
        {points.length > 0 && (
          <circle
            cx={coords[coords.length - 1].split(',')[0]}
            cy={coords[coords.length - 1].split(',')[1]}
            r="2.5"
            fill="#059669"
          />
        )}
      </svg>
    );
  };

  return (
    <div
      id="trends"
      className="rounded-2xl p-4 sm:p-5 bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between h-full relative overflow-hidden transition-all duration-200 hover:border-slate-300"
    >
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Trending Products</h3>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                Demo Data
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500">Fastest rising consumer demand categories</p>
          </div>
        </div>

        {/* Action: Validate Idea -> */}
        <button
          type="button"
          onClick={() => navigate('/validation')}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors cursor-pointer group"
        >
          <span>Validate Idea</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Grid of Four Image-Based Product Cards */}
      <div className="relative z-10 mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate('/validation')}
            className="group rounded-xl p-2.5 bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer"
          >
            {/* Product Image */}
            <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-100 mb-2.5 border border-slate-200/60">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out brightness-95 group-hover:brightness-100"
              />
              <span className="absolute top-1.5 right-1.5 bg-white/95 backdrop-blur-xs px-1.5 py-0.5 rounded text-[10px] font-bold text-emerald-700 border border-slate-200/80 font-mono-nums shadow-2xs">
                {item.growth}
              </span>
            </div>

            {/* Product Details */}
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                {item.name}
              </div>
              <div className="text-[10.5px] text-slate-500 truncate">
                {item.category}
              </div>
            </div>

            {/* Mini Sparkline Chart */}
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[9.5px] text-slate-400 uppercase tracking-wider font-semibold">Trend</span>
              {renderSparkline(item.sparkline)}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Disclaimer */}
      <div className="relative z-10 pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
        <span>Illustrative demo data for market analysis</span>
        <span className="text-emerald-700 font-mono font-medium">Top 4 Velocity Categories</span>
      </div>
    </div>
  );
};
