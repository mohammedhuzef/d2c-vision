import React from 'react';
import { Card, CardHeader } from '../common/Card';
import { formatMoney, formatPercent, formatUnits } from '../../utils/formatters';
import type { StageResultDetailResponse, AssumptionsOutput } from '../../api/types';
import { IndianRupee, Layers, PieChart, Users } from 'lucide-react';

export interface FinancialSnapshotCardProps {
  financialResult?: StageResultDetailResponse;
  assumptions?: AssumptionsOutput | null;
}

export const FinancialSnapshotCard: React.FC<FinancialSnapshotCardProps> = ({
  financialResult,
  assumptions,
}) => {
  const metrics = (financialResult?.metrics || {}) as Record<string, any>;
  const sellingPrice = metrics.selling_price as string | number | undefined;
  const variableCost = metrics.variable_cost_per_unit as string | number | undefined;
  const contributionMargin = metrics.contribution_margin as string | number | undefined;
  const breakEvenUnits = metrics.break_even_units as string | number | undefined;

  // Derive customers per month from marketing assumptions if present: monthly_budget / expected_cac
  const monthlyBudget = assumptions?.marketing?.monthly_budget;
  const expectedCac = assumptions?.marketing?.expected_cac;

  let derivedCustomers: number | null = null;
  if (
    monthlyBudget !== undefined &&
    monthlyBudget !== null &&
    expectedCac !== undefined &&
    expectedCac !== null &&
    Number(expectedCac) > 0
  ) {
    derivedCustomers = Math.floor(Number(monthlyBudget) / Number(expectedCac));
  }

  return (
    <Card padding="md">
      <CardHeader
        title="Unit Economics & Financial Snapshot"
        subtitle="Calculated metrics verified by the Stage 5 financial validation engine"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
        {/* Selling Price */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
            <span>Selling Price</span>
          </div>
          <div className="mt-1.5 text-lg font-bold text-slate-900 font-mono-nums">
            {formatMoney(sellingPrice)}
          </div>
          <span className="text-[10px] text-slate-400">Target retail</span>
        </div>

        {/* Variable Cost Per Unit */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Variable Cost</span>
          </div>
          <div className="mt-1.5 text-lg font-bold text-slate-900 font-mono-nums">
            {formatMoney(variableCost)}
          </div>
          <span className="text-[10px] text-slate-400">COGS + pack + ship + fees</span>
        </div>

        {/* Contribution Margin % */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <PieChart className="w-3.5 h-3.5 text-slate-400" />
            <span>Contribution Margin</span>
          </div>
          <div className="mt-1.5 text-lg font-bold text-indigo-600 font-mono-nums">
            {formatPercent(contributionMargin)}
          </div>
          <span className="text-[10px] text-slate-400">Net unit profitability</span>
        </div>

        {/* Break-Even Units */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Break-Even Volume</span>
          </div>
          <div className="mt-1.5 text-lg font-bold text-slate-900 font-mono-nums">
            {formatUnits(breakEvenUnits)}
          </div>
          <span className="text-[10px] text-slate-400">Units to cover fixed costs</span>
        </div>
      </div>

      {/* Derived Customers / Mo footnote */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>Estimated Customers / Mo:</span>
          <span className="font-semibold text-slate-800 font-mono-nums">
            {derivedCustomers !== null ? `${formatUnits(derivedCustomers)} users` : '—'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
            derived
          </span>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          (monthly budget ÷ expected CAC)
        </span>
      </div>
    </Card>
  );
};
