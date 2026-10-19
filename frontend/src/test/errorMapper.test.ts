import { describe, it, expect, vi } from 'vitest';
import {
  normalizeFieldPath,
  extractErrorDetails,
  mapApiErrorsToForm,
} from '../utils/errorMapper';

describe('normalizeFieldPath', () => {
  it('strips assumptions and category prefixes to map onto flat form fields', () => {
    expect(normalizeFieldPath('assumptions.costs.cogs_per_unit')).toBe('cogs_per_unit');
    expect(normalizeFieldPath('assumptions.pricing.selling_price')).toBe('selling_price');
    expect(normalizeFieldPath('assumptions.marketing.monthly_budget')).toBe('monthly_budget');
    expect(normalizeFieldPath('assumptions.packaging.packaging_cost')).toBe('packaging_cost');
    expect(normalizeFieldPath('costs.shipping_cost_per_unit')).toBe('shipping_cost_per_unit');
  });

  it('normalizes bracket array notations into dot notation', () => {
    expect(normalizeFieldPath('competitors[0].name')).toBe('competitors.0.name');
    expect(normalizeFieldPath('competitors[1].observed_price')).toBe('competitors.1.observed_price');
  });

  it('handles Pydantic loc arrays', () => {
    expect(
      normalizeFieldPath(['body', 'assumptions', 'costs', 'cogs_per_unit'])
    ).toBe('cogs_per_unit');
    expect(
      normalizeFieldPath(['body', 'name'])
    ).toBe('name');
  });

  it('returns empty string for undefined input', () => {
    expect(normalizeFieldPath(undefined)).toBe('');
  });
});

describe('extractErrorDetails', () => {
  it('extracts message, requestId, and details from standard backend 422 envelope', () => {
    const errorPayload = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        request_id: 'test-req-123',
        details: [
          {
            field: 'assumptions.costs.cogs_per_unit',
            issue: 'cogs_per_unit cannot be negative',
          },
        ],
      },
    };

    const extracted = extractErrorDetails(errorPayload);
    expect(extracted.message).toBe('Validation failed');
    expect(extracted.requestId).toBe('test-req-123');
    expect(extracted.details).toHaveLength(1);
    expect(extracted.details[0].field).toBe('assumptions.costs.cogs_per_unit');
  });

  it('handles unknown or empty errors safely', () => {
    const extracted = extractErrorDetails(null);
    expect(extracted.message).toBe('An unknown error occurred');
    expect(extracted.details).toHaveLength(0);
  });
});

describe('mapApiErrorsToForm', () => {
  it('calls setError on matched form fields and reports unmapped errors', () => {
    const mockSetError = vi.fn();
    const errorPayload = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation error',
        details: [
          {
            field: 'assumptions.costs.cogs_per_unit',
            issue: 'COGS cannot be negative',
          },
          {
            field: 'unknown_unsupported_field',
            issue: 'Invalid parameter',
          },
        ],
      },
    };

    const validFormFields = ['cogs_per_unit', 'selling_price', 'name'];

    const unmapped = mapApiErrorsToForm(errorPayload, mockSetError, validFormFields as any);

    // Should have called setError for cogs_per_unit
    expect(mockSetError).toHaveBeenCalledWith('cogs_per_unit', {
      type: 'server',
      message: 'COGS cannot be negative',
    });

    // Should return unmapped array containing the unknown field
    expect(unmapped).toHaveLength(1);
    expect(unmapped[0]).toContain('unknown_unsupported_field');
  });
});
