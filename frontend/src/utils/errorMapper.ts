import type { UseFormSetError, FieldValues, Path } from 'react-hook-form';

export interface ApiErrorDetail {
  field?: string | string[];
  loc?: Array<string | number>;
  issue?: string;
  message?: string;
  msg?: string;
}

export interface ApiErrorPayload {
  code?: string;
  message?: string;
  details?: ApiErrorDetail[];
  request_id?: string;
}

/**
 * Normalizes field path string from backend to the form's field path.
 * Handles patterns like:
 * - "assumptions.costs.cogs_per_unit" -> "cogs_per_unit"
 * - "assumptions.pricing.selling_price" -> "selling_price"
 * - "assumptions.marketing.monthly_budget" -> "monthly_budget"
 * - "competitors.0.name" / "competitors[0].name" -> "competitors.0.name"
 * - ["body", "name"] -> "name"
 */
export function normalizeFieldPath(fieldOrLoc: string | string[] | Array<string | number> | undefined): string {
  if (!fieldOrLoc) return '';

  let rawPath: string;
  if (Array.isArray(fieldOrLoc)) {
    // If it's a Pydantic loc array: ['body', 'assumptions', 'costs', 'cogs_per_unit']
    const filtered = fieldOrLoc.filter((seg) => seg !== 'body' && seg !== 'assumptions');
    rawPath = filtered.join('.');
  } else {
    rawPath = String(fieldOrLoc);
  }

  // Normalize brackets to dots: competitors[0].name -> competitors.0.name
  let path = rawPath.replace(/\[(\d+)\]/g, '.$1');

  // Strip prefixes like "assumptions.costs.", "assumptions.marketing.", "assumptions.customer.", "assumptions."
  // or "costs.", "pricing.", "marketing.", "customer.", "packaging." if form is flattened
  const prefixRegex = /^(?:assumptions\.)?(?:costs|pricing|marketing|customer|packaging|product)\./;
  const stripped = path.replace(prefixRegex, '');

  return stripped;
}

/**
 * Extracts error details from an unknown error or ApiError.
 */
export function extractErrorDetails(error: unknown): {
  message: string;
  requestId?: string;
  details: ApiErrorDetail[];
} {
  if (!error) {
    return { message: 'An unknown error occurred', details: [] };
  }

  // If it's an ApiError from our client
  const errObj = error as any;
  const apiError = errObj?.details ? errObj : errObj?.data?.error || errObj?.response?.data?.error || errObj?.error;

  const message =
    apiError?.message ||
    errObj?.message ||
    'Validation failed. Please review the highlighted fields.';
  const requestId = apiError?.request_id || errObj?.requestId || errObj?.request_id;
  const details: ApiErrorDetail[] = Array.isArray(apiError?.details)
    ? apiError.details
    : Array.isArray(errObj?.details)
    ? errObj.details
    : [];

  return { message, requestId, details };
}

/**
 * Maps 422 details[].field paths onto React Hook Form fields using setError.
 * Returns any unmapped errors as an array of messages so they can be shown in a banner.
 */
export function mapApiErrorsToForm<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  validFields?: Array<Path<T>>
): string[] {
  const { details } = extractErrorDetails(error);
  const unmapped: string[] = [];

  if (!details || details.length === 0) {
    return unmapped;
  }

  for (const item of details) {
    const rawField = item.field || (item.loc ? item.loc : undefined);
    const fieldPath = normalizeFieldPath(rawField);
    const issueMessage = item.issue || item.message || item.msg || 'Invalid value';

    let mapped = false;

    if (fieldPath) {
      if (!validFields || validFields.includes(fieldPath as Path<T>)) {
        try {
          setError(fieldPath as Path<T>, {
            type: 'server',
            message: issueMessage,
          });
          mapped = true;
        } catch {
          mapped = false;
        }
      }
    }

    if (!mapped) {
      const label = fieldPath ? `Field "${fieldPath}"` : 'Input error';
      unmapped.push(`${label}: ${issueMessage}`);
    }
  }

  return unmapped;
}
