import { describe, it, expect } from 'vitest';
import { computeUnitEconomics } from '../services/estimates';

describe('computeUnitEconomics service', () => {
  it('computes variable cost, contribution, margin, and break-even accurately', () => {
    const result = computeUnitEconomics({
      selling_price: '270.00',
      cogs_per_unit: '70.00',
      packaging_cost: '20.00',
      shipping_cost_per_unit: '30.00',
      other_variable_cost_per_unit: '5.00',
      payment_fee_fraction: '0.02', // 2% of 270 = 5.40
      fixed_costs_total: '25000.00',
      target_margin_fraction: '0.40',
    });

    expect(result.isValid).toBe(true);
    // Variable cost: 70 + 20 + 30 + 5 + 5.40 = 130.40
    expect(result.variableCostPerUnit).toBe('130.40');
    // Contribution: 270 - 130.40 = 139.60
    expect(result.contributionPerUnit).toBe('139.60');
    // Margin: 139.60 / 270 = 0.5170
    expect(result.contributionMargin).toBeCloseTo(0.517, 2);
    // Break even: ceil(25000 / 139.60) = 180
    expect(result.breakEvenUnits).toBe(180);
  });

  it('handles missing required inputs gracefully', () => {
    const result = computeUnitEconomics({
      selling_price: '270.00',
      cogs_per_unit: '', // missing
      packaging_cost: '20.00',
      shipping_cost_per_unit: '30.00',
    });

    expect(result.isValid).toBe(false);
    expect(result.variableCostPerUnit).toBeNull();
    expect(result.notes[0]).toContain('COGS');
  });

  it('detects negative contribution margin and flags warning', () => {
    const result = computeUnitEconomics({
      selling_price: '50.00',
      cogs_per_unit: '70.00',
      packaging_cost: '20.00',
      shipping_cost_per_unit: '30.00',
    });

    expect(result.isValid).toBe(true);
    expect(Number(result.contributionPerUnit)).toBeLessThan(0);
    expect(result.notes.some((n) => n.includes('negative'))).toBe(true);
  });
});
