import React from 'react';
import { Target, Award, ArrowUpRight, TrendingUp } from 'lucide-react';

export interface OpportunityItem {
  id: string;
  name: string;
  status: string;
  score: number;
  image: string;
  badgeColor: string;
  badgeBg: string;
}

export const TopOpportunitiesCard: React.FC = () => {
  const opportunities: OpportunityItem[] = [
    {
      id: '1',
      name: 'Healthy Chocolate',
      status: 'High Demand',
      score: 92,
      image: '/images/cat-chocolates.jpg',
      badgeColor: '#28D7A0',
      badgeBg: 'rgba(40, 215, 160, 0.15)',
    },
    {
      id: '2',
      name: 'Makhana Snacks',
      status: 'Growing Fast',
      score: 88,
      image: '/images/cat-snacks.jpg',
      badgeColor: '#25D9E8',
      badgeBg: 'rgba(37, 217, 232, 0.15)',
    },
    {
      id: '3',
      name: 'Protein Snacks',
      status: 'Trending Niche',
      score: 84,
      image: '/images/cat-supplements.jpg',
      badgeColor: '#7547FF',
      badgeBg: 'rgba(117, 71, 255, 0.15)',
    },
    {
      id: '4',
      name: 'Herbal Tea',
      status: 'Steady Growth',
      score: 81,
      image: '/images/cat-beverages.jpg',
      badgeColor: '#FFBE58',
      badgeBg: 'rgba(255, 190, 88, 0.15)',
    },
  ];

  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-[rgba(20,39,62,0.72)] backdrop-blur-xl border border-[rgba(161,190,230,0.25)] shadow-xl flex flex-col justify-between h-full relative overflow-hidden transition-all duration-300 hover:border-[#25D9E8]/40">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-[#FFBE58]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-[rgba(161,190,230,0.18)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#FFBE58] to-[#28D7A0] text-[#08182C] flex items-center justify-center shadow-md shadow-[#FFBE58]/25 font-bold">
            <Target className="w-4 h-4 text-[#08182C]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#F8FAFF] tracking-tight">Top Opportunities</h3>
              <span className="text-[9px] font-medium text-[#25D9E8] bg-[#25D9E8]/10 px-1.5 py-0.5 rounded border border-[#25D9E8]/30">
                Sample Scores
              </span>
            </div>
            <p className="text-[10px] text-[#9EADC2]">Composite viability ranking from margin & competition index</p>
          </div>
        </div>

        <span className="text-[10px] text-[#9EADC2] font-mono-nums">
          Top 4 Rated
        </span>
      </div>

      {/* Four Opportunity Rows */}
      <div className="relative z-10 mt-3.5 space-y-2">
        {opportunities.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2.5 rounded-xl bg-[rgba(8,24,44,0.55)] hover:bg-[rgba(20,39,62,0.85)] border border-[rgba(161,190,230,0.15)] hover:border-[#25D9E8]/40 transition-all group cursor-pointer"
          >
            {/* Left: Thumbnail, Name, Short Status */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-[rgba(161,190,230,0.2)] bg-[#08182C] group-hover:scale-105 transition-transform">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover object-center brightness-90 group-hover:brightness-100"
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-[#F8FAFF] truncate group-hover:text-white transition-colors">
                  {item.name}
                </div>
                <div className="text-[10.5px] text-[#9EADC2] font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25D9E8]" />
                  <span>{item.status}</span>
                </div>
              </div>
            </div>

            {/* Right: Colorful Score Badge */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs font-mono-nums border shadow-sm transition-transform group-hover:scale-105"
                style={{
                  color: item.badgeColor,
                  backgroundColor: item.badgeBg,
                  borderColor: `${item.badgeColor}40`,
                  boxShadow: `0 0 10px ${item.badgeColor}25`,
                }}
              >
                {item.score}
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#9EADC2] group-hover:text-[#25D9E8] transition-colors" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="relative z-10 pt-2.5 mt-3 border-t border-[rgba(161,190,230,0.12)] flex items-center justify-between text-[10px] text-[#9EADC2]">
        <span>Illustrative viability score out of 100 based on initial product parameters</span>
        <span className="text-[#28D7A0] font-mono-nums">Ranked by Viability</span>
      </div>
    </div>
  );
};
