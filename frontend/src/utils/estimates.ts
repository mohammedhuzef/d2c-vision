import Decimal from 'decimal.js';

export interface UnitEconomicsInputs {
  selling_price?: string | number | null;
  cogs_per_unit?: string | number | null;
  packaging_cost?: string | number | null;
  shipping_cost_per_unit?: string | number | null;
  other_variable_cost_per_unit?: string | number | null;
  payment_fee_fraction?: string | number | null;
  payment_fee_fixed?: string | number | null;
  platform_fee_fraction?: string | number | null;
  fixed_costs_total?: string | number | null;
}

export interface UnitEconomicsEstimate {
  variable_cost_per_unit: string | null;
  contribution_per_unit: string | null;
  contribution_margin: string | null;
  break_even_units: number | null;
  isComplete: boolean;
}

export function computeUnitEconomics(inputs: UnitEconomicsInputs): UnitEconomicsEstimate {
  // Check required core inputs for variable cost computation
  if (
    inputs.selling_price === null ||
    inputs.selling_price === undefined ||
    inputs.selling_price === '' ||
    inputs.cogs_per_unit === null ||
    inputs.cogs_per_unit === undefined ||
    inputs.cogs_per_unit === '' ||
    inputs.packaging_cost === null ||
    inputs.packaging_cost === undefined ||
    inputs.packaging_cost === '' ||
    inputs.shipping_cost_per_unit === null ||
    inputs.shipping_cost_per_unit === undefined ||
    inputs.shipping_cost_per_unit === ''
  ) {
    return {
      variable_cost_per_unit: null,
      contribution_per_unit: null,
      contribution_margin: null,
      break_even_units: null,
      isComplete: false,
    };
  }

  try {
    const price = new Decimal(inputs.selling_price);
    const cogs = new Decimal(inputs.cogs_per_unit);
    const packaging = new Decimal(inputs.packaging_cost);
    const shipping = new Decimal(inputs.shipping_cost_per_unit);

    if (price.lessThanOrEqualTo(0) || cogs.isNegative() || packaging.isNegative() || shipping.isNegative()) {
      return {
        variable_cost_per_unit: null,
        contribution_per_unit: null,
        contribution_margin: null,
        break_even_units: null,
        isComplete: false,
      };
    }

    const otherVar = inputs.other_variable_cost_per_unit
      ? new Decimal(inputs.other_variable_cost_per_unit)
      : new Decimal(0);

    const feeFrac = inputs.payment_fee_fraction !== undefined && inputs.payment_fee_fraction !== null && inputs.payment_fee_fraction !== ''
      ? new Decimal(inputs.payment_fee_fraction)
      : new Decimal(0.02);

    const feeFixed = inputs.payment_fee_fixed
      ? new Decimal(inputs.payment_fee_fixed)
      : new Decimal(0);

    const platFrac = inputs.platform_fee_fraction
      ? new Decimal(inputs.platform_fee_fraction)
      : new Decimal(0);

    // Percentage fees based on selling price
    const pctFees = price.times(feeFrac).plus(price.times(platFrac));

    // Variable cost
    const rawVariableCost = cogs
      .plus(packaging)
      .plus(shipping)
      .plus(otherVar)
      .plus(feeFixed)
      .plus(pctFees);

    const variableCost = rawVariableCost.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    // Contribution per unit
    const rawContribution = price.minus(variableCost);
    const contribution = rawContribution.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    // Margin fraction
    const rawMargin = contribution.dividedBy(price);
    const margin = rawMargin.toDecimalPlaces(4, Decimal.ROUND_HALF_UP);

    // Break-even units
    let breakEven: number | null = null;
    if (contribution.greaterThan(0)) {
      if (
        inputs.fixed_costs_total !== null &&
        inputs.fixed_costs_total !== undefined &&
        inputs.fixed_costs_total !== ''
      ) {
        const fixedCosts = new Decimal(inputs.fixed_costs_total);
        if (fixedCosts.greaterThanOrEqualTo(0)) {
          if (fixedCosts.isZero()) {
            breakEven = 0;
          } else {
            // Ceiling division matching backend: int(q) + (1 if r > 0 else 0)
            const div = fixedCosts.dividedBy(contribution);
            breakEven = div.ceil().toNumber();
          }
        }
      }
    }

    return {
      variable_cost_per_unit: variableCost.toFixed(2),
      contribution_per_unit: contribution.toFixed(2),
      contribution_margin: margin.toFixed(4),
      break_even_units: breakEven,
      isComplete: true,
    };
  } catch {
    return {
      variable_cost_per_unit: null,
      contribution_per_unit: null,
      contribution_margin: null,
      break_even_units: null,
      isComplete: false,
    };
  }
}
