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
    <div className="rounded-2xl p-4 sm:p-5 bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between h-full relative overflow-hidden transition-all duration-200 hover:border-slate-300">
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-xs">
            <LineChart className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Demand Trend</h3>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                Sample Data
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500">Aggregated consumer search volume & pre-order intent</p>
          </div>
        </div>

        {/* Period Selector (6 Months) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700 transition-all cursor-pointer"
          >
            <span>{range}</span>
            <ChevronDown
              className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-emerald-600' : ''
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-28 py-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 text-[11px] animate-in fade-in duration-150">
              {['30 Days', '3 Months', '6 Months', '1 Year'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setRange(item);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 font-medium transition-colors ${
                    range === item
                      ? 'text-emerald-700 font-bold bg-emerald-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
          <span className="text-2xl font-extrabold text-slate-900 font-mono-nums tracking-tight">
            88.4
          </span>
          <span className="text-xs text-slate-500 font-medium">Demand Index</span>
        </div>

        {/* The required +42% Growing Demand annotation */}
        <div className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <div className="flex items-center gap-1 leading-none">
            <span className="text-xs font-bold text-emerald-700 font-mono-nums">+42%</span>
            <span className="text-[11px] font-semibold text-emerald-900">Growing Demand</span>
          </div>
        </div>
      </div>

      {/* Interactive Area Chart */}
      <div className="relative z-10 mt-3 w-full h-[155px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            {/* Fine Grid Lines */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F1F5F9"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              stroke="#94A3B8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94A3B8"
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
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xl text-xs">
                      <div className="font-bold text-slate-900 mb-1">{label} Overview</div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-slate-500">Demand Score:</span>
                        <span className="font-bold text-emerald-700 font-mono-nums">
                          {payload[0].value}/100
                        </span>
                      </div>
                      <div className="text-[9.5px] text-slate-400 mt-1">Illustrative Sample Velocity</div>
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
              stroke="#059669"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#emeraldGradient)"
              dot={{ r: 3.5, fill: '#059669', stroke: '#FFFFFF', strokeWidth: 2 }}
              activeDot={{ r: 5, fill: '#059669', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="relative z-10 pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
        <span>Modelled on search velocity, social impressions & direct inquiry momentum</span>
        <span className="text-emerald-700 font-mono font-medium">Sample Trajectory</span>
      </div>
    </div>
  );
};
