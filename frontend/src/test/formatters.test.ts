import { describe, it, expect } from 'vitest';
import {
  formatMoney,
  formatPercent,
  formatScore,
  formatUnits,
  formatDate,
} from '../utils/formatters';

describe('formatMoney utility', () => {
  it('formats standard string money values into Indian Rupee format with ₹ symbol', () => {
    const formatted = formatMoney('270.00');
    // Normalize any non-breaking spaces
    expect(formatted.replace(/\u00a0/g, ' ')).toMatch(/^₹\s?270\.00$/);
  });

  it('formats large numbers with Indian numbering grouping (lakhs/crores)', () => {
    const formatted = formatMoney('150000.00');
    expect(formatted.replace(/\u00a0/g, ' ')).toMatch(/^₹\s?1,50,000\.00$/);
  });

  it('handles numeric input values correctly', () => {
    const formatted = formatMoney(1250.5);
    expect(formatted.replace(/\u00a0/g, ' ')).toMatch(/^₹\s?1,250\.50$/);
  });

  it('strips leading dollar or rupee currency symbols gracefully', () => {
    expect(formatMoney('$270.00').replace(/\u00a0/g, ' ')).toMatch(/^₹\s?270\.00$/);
    expect(formatMoney('₹270.00').replace(/\u00a0/g, ' ')).toMatch(/^₹\s?270\.00$/);
  });

  it('handles zero values without error', () => {
    expect(formatMoney('0').replace(/\u00a0/g, ' ')).toMatch(/^₹\s?0\.00$/);
    expect(formatMoney('0.00').replace(/\u00a0/g, ' ')).toMatch(/^₹\s?0\.00$/);
    expect(formatMoney(0).replace(/\u00a0/g, ' ')).toMatch(/^₹\s?0\.00$/);
  });

  it('never outputs NaN or throws for invalid, null, undefined or empty string values', () => {
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney(undefined)).toBe('—');
    expect(formatMoney('')).toBe('—');
    expect(formatMoney('   ')).toBe('—');
    expect(formatMoney('not-a-number')).toBe('—');
    expect(formatMoney(NaN)).toBe('—');
    expect(formatMoney(Infinity)).toBe('—');
    expect(formatMoney(-Infinity)).toBe('—');
  });
});

describe('formatPercent utility', () => {
  it('formats decimal fractions as percentage strings', () => {
    expect(formatPercent('0.4000')).toBe('40.00%');
    expect(formatPercent(0.4325)).toBe('43.25%');
    expect(formatPercent(0)).toBe('0.00%');
  });

  it('handles invalid or null inputs gracefully with em-dash', () => {
    expect(formatPercent(null)).toBe('—');
    expect(formatPercent(undefined)).toBe('—');
    expect(formatPercent('invalid')).toBe('—');
  });
});

describe('formatScore utility', () => {
  it('formats score to 2 decimal places', () => {
    expect(formatScore(88.5)).toBe('88.50');
    expect(formatScore('100.00')).toBe('100.00');
    expect(formatScore(0)).toBe('0.00');
  });

  it('handles empty or null score gracefully', () => {
    expect(formatScore(null)).toBe('—');
    expect(formatScore(undefined)).toBe('—');
  });
});

describe('formatUnits utility', () => {
  it('formats integer counts with Indian commas', () => {
    expect(formatUnits('2500')).toBe('2,500');
    expect(formatUnits(150000)).toBe('1,50,000');
  });

  it('handles null and invalid units', () => {
    expect(formatUnits(null)).toBe('—');
    expect(formatUnits('bad')).toBe('—');
  });
});

describe('formatDate utility', () => {
  it('formats valid ISO datetime string', () => {
    const formatted = formatDate('2026-10-17T05:14:22.448357');
    expect(formatted).not.toBe('—');
    expect(formatted).toContain('2026');
  });

  it('handles null or invalid date string', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('invalid-date')).toBe('—');
  });
});
