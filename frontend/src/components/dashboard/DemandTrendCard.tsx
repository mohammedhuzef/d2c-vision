import React, { useState } from 'react';
import { ChevronDown, TrendingUp, Sparkles, LineChart } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const DemandTrendCard: React.FC = () => {
  const [range, setRange] = useState('6 Months');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const data = [
    { month: 'Jan', demand: 34, projected: 30 },
    { month: 'Feb', demand: 42, projected: 38 },
    { month: 'Mar', demand: 39, projected: 44 },
    { month: 'Apr', demand: 58, projected: 52 },
    { month: 'May', demand: 64, projected: 61 },
    { month: 'Jun', demand: 88, projected: 75 },
  ];

  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-[rgba(20,39,62,0.72)] backdrop-blur-xl border border-[rgba(161,190,230,0.25)] shadow-xl flex flex-col justify-between h-full relative overflow-hidden transition-all duration-300 hover:border-[#25D9E8]/40">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/3 w-40 h-40 bg-[#7547FF]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-[rgba(161,190,230,0.18)]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#7547FF] to-[#A855F7] text-white flex items-center justify-center shadow-md shadow-[#7547FF]/30">
            <LineChart className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#F8FAFF] tracking-tight">Demand Trend</h3>
              <span className="text-[9px] font-medium text-[#25D9E8] bg-[#25D9E8]/10 px-1.5 py-0.5 rounded border border-[#25D9E8]/30">
                Sample Data
              </span>
            </div>
            <p className="text-[10px] text-[#9EADC2]">Aggregated consumer search volume & pre-order intent</p>
          </div>
        </div>

        {/* Period Selector (6 Months) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[rgba(8,24,44,0.7)] hover:bg-[rgba(20,39,62,0.9)] border border-[rgba(161,190,230,0.22)] text-[11px] font-medium text-[#F8FAFF] hover:border-[#25D9E8]/40 transition-all cursor-pointer"
          >
            <span>{range}</span>
            <ChevronDown
              className={`w-3 h-3 text-[#9EADC2] transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-[#25D9E8]' : ''
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-28 py-1 bg-[#08182C] border border-[rgba(161,190,230,0.25)] rounded-xl shadow-xl z-30 text-[11px] backdrop-blur-xl animate-in fade-in duration-150">
              {['30 Days', '3 Months', '6 Months', '1 Year'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setRange(item);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 transition-colors ${
                    range === item
                      ? 'text-[#25D9E8] font-bold bg-white/[0.06]'
                      : 'text-[#9EADC2] hover:text-[#F8FAFF] hover:bg-white/[0.04]'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Annotation Card: +42% Growing Demand */}
      <div className="relative z-10 mt-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-[#F8FAFF] font-mono-nums tracking-tight">
            88.4
          </span>
          <span className="text-xs text-[#9EADC2]">Demand Index</span>
        </div>

        {/* The required +42% Growing Demand annotation */}
        <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#7547FF]/20 to-[#25D9E8]/20 border border-[rgba(161,190,230,0.3)] shadow-[0_0_15px_rgba(117,71,255,0.25)] flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-[#28D7A0]" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 leading-none">
            <span className="text-xs font-bold text-[#28D7A0] font-mono-nums">+42%</span>
            <span className="text-[10px] font-semibold text-[#F8FAFF]">Growing Demand</span>
          </div>
        </div>
      </div>

      {/* Interactive Area Chart */}
      <div className="relative z-10 mt-3 w-full h-[155px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="d2cGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#25D9E8" stopOpacity={0.45} />
                <stop offset="60%" stopColor="#7547FF" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#7547FF" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            {/* Fine Grid Lines */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(161, 190, 230, 0.1)"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              stroke="#9EADC2"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#9EADC2"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
            />
            {/* Hover Tooltip */}
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-2.5 rounded-xl bg-[#08182C]/95 border border-[rgba(161,190,230,0.3)] shadow-2xl backdrop-blur-md text-xs">
                      <div className="font-bold text-[#F8FAFF] mb-1">{label} Overview</div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-[#25D9E8]" />
                        <span className="text-[#9EADC2]">Demand Score:</span>
                        <span className="font-bold text-[#25D9E8] font-mono-nums">
                          {payload[0].value}/100
                        </span>
                      </div>
                      <div className="text-[9px] text-[#9EADC2]/70 mt-1">Illustrative Sample Velocity</div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Smooth Curve Area */}
            <Area
              type="monotone"
              dataKey="demand"
              stroke="#25D9E8"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#d2cGradient)"
              dot={{ r: 3.5, fill: '#25D9E8', stroke: '#071426', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#FFFFFF', stroke: '#7547FF', strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="relative z-10 pt-2.5 mt-2 border-t border-[rgba(161,190,230,0.12)] flex items-center justify-between text-[10px] text-[#9EADC2]">
        <span>Modelled on search velocity, social impressions & direct inquiry momentum</span>
        <span className="text-[#25D9E8] font-mono">Sample Trajectory</span>
      </div>
    </div>
  );
};
