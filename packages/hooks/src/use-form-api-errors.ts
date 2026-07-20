import { useFormContext } from 'react-hook-form';
import { ApiException, ValidationException } from '@lms/api';

export function useFormApiErrors() {
  const { setError } = useFormContext();

  const handleApiError = (error: unknown) => {
    if (error instanceof ValidationException) {
      const hasFieldErrors = setFormErrors(error.errors);

      if (!hasFieldErrors) {
        setRootError(error.message);
      }

      return true;
    }

    if (isStatusError(error, 400) && isRecord(error.data)) {
      setFormErrors(error.data);
      return true;
    }

    if (error instanceof ApiException && error.status === 404) {
      setRootError(error.message || 'Not found.');
      return true;
    }

    return false;
  };

  const setFormErrors = (errors: Record<string, unknown>) => {
    let hasErrors = false;

    Object.entries(errors).forEach(([field, messages]) => {
      const message = toErrorMessage(messages);

      if (!message) {
        return;
      }

      setError(field === 'root' ? 'root.server' : field, {
        type: 'manual',
        message,
      });
      hasErrors = true;
    });

    return hasErrors;
  };

  const setRootError = (message: string) => {
    setError('root.server', {
      type: 'manual',
      message,
    });
  };

  return { handleApiError };
}

function toErrorMessage(messages: unknown): string {
  if (Array.isArray(messages)) {
    return messages.map(toErrorMessage).filter(Boolean).join('\n');
  }

  if (typeof messages === 'string') {
    return messages;
  }

  if (messages && typeof messages === 'object') {
    const value = messages as Record<string, unknown>;

    if (typeof value.message === 'string') {
      return value.message;
    }

    if (typeof value.detail === 'string') {
      return value.detail;
    }
  }

  return '';
}

function isStatusError(
  error: unknown,
  status: number
): error is { status: number; data?: unknown } {
  return isRecord(error) && error.status === status;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
