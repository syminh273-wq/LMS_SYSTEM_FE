export class ApiException extends Error {
  constructor(public message: string, public status?: number, public data?: unknown) {
    super(message);
    this.name = 'ApiException';
    Object.setPrototypeOf(this, ApiException.prototype);
  }
}

export class UnauthorizedException extends ApiException {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedException';
    Object.setPrototypeOf(this, UnauthorizedException.prototype);
  }
}

export class ValidationException extends ApiException {
  public errors: Record<string, string>;

  constructor(errors: unknown, status = 422) {
    const normalizedErrors = normalizeValidationErrors(errors);
    super('Validation Failed', status, normalizedErrors);
    this.name = 'ValidationException';
    this.errors = normalizedErrors;
    Object.setPrototypeOf(this, ValidationException.prototype);
  }
}

function normalizeValidationErrors(payload: unknown): Record<string, string> {
  const source = unwrapValidationPayload(payload);
  const normalizedErrors: Record<string, string> = {};

  if (!isRecord(source)) {
    return normalizedErrors;
  }

  Object.entries(source).forEach(([field, messages]) => {
    const message = toErrorMessage(messages);

    if (message) {
      normalizedErrors[field] = message;
    }
  });

  return normalizedErrors;
}

function unwrapValidationPayload(payload: unknown): unknown {
  if (!isRecord(payload)) {
    return payload;
  }

  if (isRecord(payload.errors)) {
    return payload.errors;
  }

  if (isRecord(payload.detail)) {
    return payload.detail;
  }

  if (typeof payload.message === 'string') {
    return { root: payload.message };
  }

  if (typeof payload.error === 'string') {
    return { root: payload.error };
  }

  if (typeof payload.detail === 'string') {
    return { root: payload.detail };
  }

  return payload;
}

function toErrorMessage(messages: unknown): string {
  if (Array.isArray(messages)) {
    return messages.map(toErrorMessage).filter(Boolean).join('\n');
  }

  if (typeof messages === 'string') {
    return messages;
  }

  if (isRecord(messages)) {
    if (typeof messages.message === 'string') {
      return messages.message;
    }

    if (typeof messages.detail === 'string') {
      return messages.detail;
    }
  }

  return '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
