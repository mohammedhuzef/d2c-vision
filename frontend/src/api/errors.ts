export interface ApiErrorDetail {
  field?: string | null;
  issue: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
  request_id?: string;
}

export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details: ApiErrorDetail[];
  public readonly requestId?: string;

  constructor(status: number, payload?: Partial<ApiErrorPayload> | string) {
    const message =
      typeof payload === 'string'
        ? payload
        : payload?.message || `Request failed with status ${status}`;

    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = (typeof payload === 'object' && payload?.code) || 'API_ERROR';
    this.details = (typeof payload === 'object' && payload?.details) || [];
    this.requestId = typeof payload === 'object' ? payload?.request_id : undefined;
  }

  /**
   * Helper to map details onto form field paths
   */
  public getFieldError(field: string): string | undefined {
    const match = this.details.find((d) => d.field === field);
    return match?.issue;
  }

  /**
   * Maps all details into a Record<fieldPath, issueMessage>
   */
  public getFieldErrors(): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const d of this.details) {
      if (d.field) {
        errors[d.field] = d.issue;
      }
    }
    return errors;
  }
}
