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

  // Helper to render an SVG sparkline path
  const renderSparkline = (points: number[]) => {
    const min = Math.min(...points);
    const max = Math.max(...points);
    const width = 64;
    const height = 20;

    const coords = points.map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((val - min) / (max - min || 1)) * (height - 4) - 2;
      return `${x},${y}`;
    });

    const pathD = `M ${coords.join(' L ')}`;

    return (
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={pathD}
          fill="none"
          stroke="#28D7A0"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End glowing dot */}
        <circle
          cx={width}
          cy={height - ((points[points.length - 1] - min) / (max - min || 1)) * (height - 4) - 2}
          r="2.5"
          fill="#25D9E8"
          stroke="#08182C"
          strokeWidth="1"
        />
      </svg>
    );
  };

  return (
    <div
      id="trends"
      className="rounded-2xl p-4 sm:p-5 bg-[rgba(20,39,62,0.72)] backdrop-blur-xl border border-[rgba(161,190,230,0.25)] shadow-xl flex flex-col justify-between h-full relative overflow-hidden transition-all duration-300 hover:border-[#25D9E8]/40"
    >
      {/* Background ambient corner glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#25D9E8]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-[rgba(161,190,230,0.18)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#25D9E8] to-[#278BFF] text-white flex items-center justify-center shadow-md shadow-[#25D9E8]/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#F8FAFF] tracking-tight">Trending Products</h3>
              <span className="text-[9px] font-medium text-[#25D9E8] bg-[#25D9E8]/10 px-1.5 py-0.5 rounded border border-[#25D9E8]/30">
                Demo Data
              </span>
            </div>
            <p className="text-[10px] text-[#9EADC2]">Fastest rising consumer demand categories</p>
          </div>
        </div>

        {/* Action: See All -> */}
        <button
          type="button"
          onClick={() => navigate('/trends')}
          className="text-xs font-semibold text-[#25D9E8] hover:text-[#5cebf5] flex items-center gap-1 transition-colors cursor-pointer group"
        >
          <span>See All</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Grid of Four Image-Based Product Cards */}
      <div className="relative z-10 mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate('/trends')}
            className="group rounded-2xl p-2.5 bg-[rgba(8,24,44,0.6)] hover:bg-[rgba(20,39,62,0.9)] border border-[rgba(161,190,230,0.18)] hover:border-[#25D9E8]/50 transition-all flex flex-col justify-between cursor-pointer shadow-md hover:-translate-y-0.5"
          >
            {/* Product Image */}
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#08182C] mb-2.5 border border-[rgba(161,190,230,0.12)]">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out brightness-90 group-hover:brightness-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08182C]/70 via-transparent to-transparent pointer-events-none" />

              {/* Growth Pill in card */}
              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-[rgba(8,24,44,0.9)] backdrop-blur-md border border-[rgba(161,190,230,0.2)] text-[10px] font-bold text-[#28D7A0] font-mono-nums flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" />
                <span>{item.growth}</span>
              </div>
            </div>

            {/* Product Name & Category */}
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#F8FAFF] truncate leading-tight group-hover:text-white transition-colors">
                {item.name}
              </h4>
              <p className="text-[10px] text-[#9EADC2] truncate mt-0.5 font-medium">
                {item.category}
              </p>
            </div>

            {/* Mini Sparkline Chart */}
            <div className="mt-2.5 pt-2 border-t border-[rgba(161,190,230,0.12)] flex items-center justify-between">
              <span className="text-[9px] text-[#9EADC2] font-mono">6m Trend</span>
              <div className="shrink-0">{renderSparkline(item.sparkline)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Disclaimer */}
      <div className="relative z-10 pt-2.5 mt-3 border-t border-[rgba(161,190,230,0.12)] flex items-center justify-between text-[10px] text-[#9EADC2]">
        <span>Illustrative demo velocity data calculated over trailing 180 days</span>
        <span className="text-[#28D7A0] font-mono-nums font-semibold">+57% Avg Growth</span>
      </div>
    </div>
  );
};
