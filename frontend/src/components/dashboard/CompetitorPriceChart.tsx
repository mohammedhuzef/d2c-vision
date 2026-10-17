import React from 'react';
import { Card, CardHeader } from '../common/Card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import type { CompetitorDetailResponse } from '../../api/types';
import { formatMoney } from '../../utils/formatters';

export interface CompetitorPriceChartProps {
  sellingPrice?: string | number | null;
  competitors?: CompetitorDetailResponse[];
  competitorMetrics?: {
    competitor_price_min?: number | string | null;
    competitor_price_median?: number | string | null;
    competitor_price_max?: number | string | null;
  };
}

export const CompetitorPriceChart: React.FC<CompetitorPriceChartProps> = ({
  sellingPrice,
  competitors = [],
  competitorMetrics,
}) => {
  const yourPriceNum = sellingPrice ? Number(sellingPrice) : null;

  // Prepare chart data: your product + competitors with observed prices
  const chartData = [
    ...(yourPriceNum !== null
      ? [
          {
            name: 'Your Product',
            price: yourPriceNum,
            isYourProduct: true,
          },
        ]
      : []),
    ...competitors
      .map((c) => {
        const obsPrice = c.analyses?.[0]?.price_observed;
        return {
          name: c.name,
          price: obsPrice !== undefined && obsPrice !== null ? Number(obsPrice) : null,
          isYourProduct: false,
        };
      })
      .filter((item): item is { name: string; price: number; isYourProduct: boolean } => item.price !== null),
  ];

  const minBand = competitorMetrics?.competitor_price_min
    ? Number(competitorMetrics.competitor_price_min)
    : undefined;
  const medianBand = competitorMetrics?.competitor_price_median
    ? Number(competitorMetrics.competitor_price_median)
    : undefined;
  const maxBand = competitorMetrics?.competitor_price_max
    ? Number(competitorMetrics.competitor_price_max)
    : undefined;

  const textSummary = `Price comparison chart with ${chartData.length} data points. Your product selling price is ${
    yourPriceNum !== null ? formatMoney(yourPriceNum) : 'unspecified'
  }. Market median price is ${medianBand !== undefined ? formatMoney(medianBand) : 'unspecified'}.`;

  return (
    <Card padding="md">
      <CardHeader
        title="Competitor Price Positioning"
        subtitle="Benchmark of your target selling price against observed market competitors"
      />

      <div
        className="mt-4 h-64 w-full"
        role="region"
        aria-label="Competitor price comparison chart"
      >
        <span className="sr-only">{textSummary}</span>
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            No competitor pricing data logged yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748B' }}
                interval={0}
                tickFormatter={(val) => (val.length > 12 ? `${val.slice(0, 10)}...` : val)}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip
                formatter={(value: any) => [formatMoney(value), 'Observed Price']}
                labelStyle={{ fontWeight: 600, color: '#0F172A' }}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  fontSize: '12px',
                }}
              />
              {yourPriceNum !== null && (
                <ReferenceLine
                  y={yourPriceNum}
                  stroke="#4F46E5"
                  strokeDasharray="4 4"
                  label={{
                    value: `Your Price: ₹${yourPriceNum}`,
                    position: 'insideTopRight',
                    fill: '#4F46E5',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
              )}
              {medianBand !== undefined && (
                <ReferenceLine
                  y={medianBand}
                  stroke="#D97706"
                  strokeDasharray="2 2"
                  label={{
                    value: `Median: ₹${medianBand}`,
                    position: 'insideBottomRight',
                    fill: '#D97706',
                    fontSize: 10,
                  }}
                />
              )}
              <Bar dataKey="price" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isYourProduct ? '#4F46E5' : '#94A3B8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block" />
            Your Selling Price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block" />
            Competitors
          </span>
        </div>
        {minBand !== undefined && maxBand !== undefined && (
          <span className="text-slate-400">
            Market Range: {formatMoney(minBand)} - {formatMoney(maxBand)}
          </span>
        )}
      </div>
    </Card>
  );
};
