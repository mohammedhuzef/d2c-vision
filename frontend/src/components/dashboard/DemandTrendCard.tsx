import React, { useState } from 'react';
import { ChevronDown, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export const DemandTrendCard: React.FC = () => {
  const [range, setRange] = useState('6 Months');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const data = [
    { month: 'Jan', demand: 32 },
    { month: 'Feb', demand: 42 },
    { month: 'Mar', demand: 38 },
    { month: 'Apr', demand: 58 },
    { month: 'May', demand: 62 },
    { month: 'Jun', demand: 86 },
  ];

  return (
    <div className="glass-panel rounded-2xl p-4 border border-white/[0.08] flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white tracking-tight">Demand Trend</span>
        </div>

        {/* Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[11px] text-slate-300 transition-colors"
          >
            <span>{range}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-28 py-1 glass-panel rounded-xl shadow-xl z-20 text-[11px]">
              {['30 Days', '3 Months', '6 Months', '1 Year'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setRange(item);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-slate-300 hover:text-white hover:bg-white/[0.08]"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Demand Callout */}
      <div className="mt-2 flex items-center justify-end">
        <div className="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-[11px] font-semibold text-purple-300 flex items-center gap-1.5 shadow-[0_0_12px_rgba(168,85,247,0.25)]">
          <TrendingUp className="w-3 h-3 text-purple-400" />
          <span>+ 42% Growing Demand</span>
        </div>
      </div>

      {/* Area Chart */}
      <div className="mt-2 w-full h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#A855F7" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-2 glass-panel rounded-lg border border-purple-500/40 text-[11px] text-white shadow-xl">
                      <span className="text-purple-300 font-bold">{payload[0].value}%</span> Demand Index
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="demand"
              stroke="#C084FC"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#purpleGradient)"
              dot={{ r: 4, fill: '#E879F9', stroke: '#581C87', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#FFFFFF', stroke: '#A855F7', strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
