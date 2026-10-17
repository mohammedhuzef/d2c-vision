/**
 * Formatting utilities for LaunchTwin AI.
 * Rules:
 * - Money is formatted with Intl en-IN and ₹ symbol.
 * - Monospace font is used for money and figures.
 * - Never do float math on money.
 */

export function formatMoney(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') {
    return '—';
  }

  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) {
    return '—';
  }

  // Format with Indian numbering system (e.g. ₹1,50,000.00)
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(num);
}

/**
 * Format a 4-decimal fraction as a percentage string (e.g. 0.4325 -> 43.25%).
 */
export function formatPercent(
  fraction: string | number | null | undefined,
  decimals: number = 2
): string {
  if (fraction === null || fraction === undefined || fraction === '') {
    return '—';
  }

  const num = typeof fraction === 'number' ? fraction : parseFloat(fraction);
  if (isNaN(num)) {
    return '—';
  }

  return `${(num * 100).toFixed(decimals)}%`;
}

/**
 * Format a score out of 100 with 2 decimals (e.g. 88.5 -> 88.50).
 */
export function formatScore(score: string | number | null | undefined): string {
  if (score === null || score === undefined || score === '') {
    return '—';
  }

  const num = typeof score === 'number' ? score : parseFloat(score);
  if (isNaN(num)) {
    return '—';
  }

  return num.toFixed(2);
}

/**
 * Format an integer or count (e.g. break-even units, interview counts).
 */
export function formatUnits(units: string | number | null | undefined): string {
  if (units === null || units === undefined || units === '') {
    return '—';
  }

  const num = typeof units === 'number' ? units : parseInt(units, 10);
  if (isNaN(num)) {
    return '—';
  }

  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Format ISO datetime string to human-readable date.
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) {
    return '—';
  }

  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}
