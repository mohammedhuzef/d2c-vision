import Decimal from 'decimal.js';

export interface UnitEconomicsInputs {
  selling_price?: number | string | null;
  cogs_per_unit?: number | string | null;
  packaging_cost?: number | string | null;
  shipping_cost_per_unit?: number | string | null;
  other_variable_cost_per_unit?: number | string | null;
  payment_fee_fraction?: number | string | null;
  fixed_costs_total?: number | string | null;
  target_margin_fraction?: number | string | null;
}

export interface UnitEconomicsEstimate {
  variableCostPerUnit: string | null;
  contributionPerUnit: string | null;
  contributionMargin: number | null; // e.g. 0.4500
  breakEvenUnits: number | null;
  marginVersusTargetDelta: number | null;
  isValid: boolean;
  notes: string[];
}

export function computeUnitEconomics(inputs: UnitEconomicsInputs): UnitEconomicsEstimate {
  const notes: string[] = [];

  const toDec = (val: number | string | null | undefined): Decimal | null => {
    if (val === null || val === undefined || val === '') return null;
    try {
      const d = new Decimal(val);
      return d.isFinite() ? d : null;
    } catch {
      return null;
    }
  };

  const price = toDec(inputs.selling_price);
  const cogs = toDec(inputs.cogs_per_unit);
  const packaging = toDec(inputs.packaging_cost);
  const shipping = toDec(inputs.shipping_cost_per_unit);
  const otherVar = toDec(inputs.other_variable_cost_per_unit) ?? new Decimal(0);
  const feeFrac = toDec(inputs.payment_fee_fraction) ?? new Decimal(0.02);
  const fixedCosts = toDec(inputs.fixed_costs_total);
  const targetMargin = toDec(inputs.target_margin_fraction);

  if (!price || price.lte(0)) {
    return {
      variableCostPerUnit: null,
      contributionPerUnit: null,
      contributionMargin: null,
      breakEvenUnits: null,
      marginVersusTargetDelta: null,
      isValid: false,
      notes: ['Enter a valid selling price > 0 to preview economics.'],
    };
  }

  if (!cogs || !packaging || !shipping) {
    const missing: string[] = [];
    if (!cogs) missing.push('COGS');
    if (!packaging) missing.push('packaging');
    if (!shipping) missing.push('shipping');
    return {
      variableCostPerUnit: null,
      contributionPerUnit: null,
      contributionMargin: null,
      breakEvenUnits: null,
      marginVersusTargetDelta: null,
      isValid: false,
      notes: [`Provide ${missing.join(', ')} to calculate unit economics.`],
    };
  }

  // Fees: selling_price * fee_frac
  const fees = price.times(feeFrac);

  // Variable cost: COGS + packaging + shipping + other_var + fees
  const rawVarCost = cogs.plus(packaging).plus(shipping).plus(otherVar).plus(fees);
  const varCostRounded = rawVarCost.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // Contribution per unit
  const rawContribution = price.minus(varCostRounded);
  const contributionRounded = rawContribution.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  // Contribution margin
  const rawMargin = contributionRounded.dividedBy(price);
  const marginRounded = rawMargin.toDecimalPlaces(4, Decimal.ROUND_HALF_UP);

  // Break even units
  let breakEven: number | null = null;
  if (contributionRounded.gt(0) && fixedCosts && fixedCosts.gte(0)) {
    if (fixedCosts.isZero()) {
      breakEven = 0;
    } else {
      const q = fixedCosts.dividedBy(contributionRounded).ceil();
      breakEven = q.toNumber();
    }
  }

  // Delta vs target margin
  let targetDelta: number | null = null;
  if (targetMargin !== null) {
    targetDelta = marginRounded.minus(targetMargin).toNumber();
    if (targetDelta < 0) {
      notes.push(`Margin (${marginRounded.times(100).toFixed(1)}%) is below target (${targetMargin.times(100).toFixed(1)}%).`);
    } else {
      notes.push(`Margin meets or exceeds your ${(targetMargin.times(100)).toFixed(1)}% target.`);
    }
  }

  if (contributionRounded.lte(0)) {
    notes.push('Warning: Unit contribution is negative or zero. Each unit sold results in a loss.');
  }

  return {
    variableCostPerUnit: varCostRounded.toFixed(2),
    contributionPerUnit: contributionRounded.toFixed(2),
    contributionMargin: marginRounded.toNumber(),
    breakEvenUnits: breakEven,
    marginVersusTargetDelta: targetDelta,
    isValid: true,
    notes,
  };
}
