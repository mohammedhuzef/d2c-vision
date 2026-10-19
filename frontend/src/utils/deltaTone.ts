export type DeltaTone = 'positive' | 'negative' | 'neutral';

/**
 * Determines whether a metric change delta is favourable (positive),
 * unfavourable (negative), or neutral.
 *
 * Rules:
 * - margin up = good
 * - contribution up = good
 * - score up = good
 * - break-even units down = good
 * - costs down = good (costs up = bad)
 * - CAC ratio down = good
 */
export function deltaTone(metricKey: string, delta: number | string | null | undefined): DeltaTone {
  if (delta === null || delta === undefined || delta === '') {
    return 'neutral';
  }

  const numericDelta =
    typeof delta === 'number'
      ? delta
      : parseFloat(delta.replace(/^[+]/, '').trim());

  if (isNaN(numericDelta) || numericDelta === 0) {
    return 'neutral';
  }

  const key = metricKey.toLowerCase();

  // Metrics where DOWN is GOOD (negative delta is positive tone)
  const isLowerBetter =
    key.includes('break_even') ||
    key.includes('cogs') ||
    key.includes('cost') ||
    key.includes('cac_to_contribution') ||
    key.includes('ratio') ||
    key.includes('fee');

  if (isLowerBetter) {
    return numericDelta < 0 ? 'positive' : 'negative';
  }

  // Metrics where UP is GOOD (positive delta is positive tone)
  // (margin, score, contribution, sales, interviews)
  return numericDelta > 0 ? 'positive' : 'negative';
}
