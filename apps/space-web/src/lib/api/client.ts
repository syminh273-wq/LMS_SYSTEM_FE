import { UnauthorizedException, ValidationException, ApiException } from './exceptions';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export default class BaseRestApiClient {
  public baseURL: string;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  protected getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  protected async request<TResponse = unknown>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    options: RequestInit = {}
  ): Promise<TResponse> {
    const url = `${this.baseURL}${path.startsWith('/') ? path : `/${path}`}`;
    
    const isFormData = body instanceof FormData;
    
    const headers: Record<string, string> = {};

    if (!isFormData && method !== 'GET' && body) {
      headers['Content-Type'] = 'application/json';
    }

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const token = this.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      method,
      headers,
    };

    if (body && method !== 'GET') {
      config.body = isFormData ? (body as FormData) : JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      return await this.handleResponse<TResponse>(response);
    } catch (error) {
      if (error instanceof ApiException) throw error;
      throw new ApiException(error instanceof Error ? error.message : 'Network Error');
    }
  }

  protected async handleResponse<TResponse = unknown>(response: Response): Promise<TResponse> {
    if (response.status === 204) return null as TResponse;

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          window.location.href = '/space/login';
        }
        throw new UnauthorizedException();
      }

      if (response.status === 400 || response.status === 422) {
        throw new ValidationException(getValidationPayload(data), response.status);
      }

      throw new ApiException(getApiMessage(data) || response.statusText, response.status, data);
    }

    return data as TResponse;
  }

  public async get<TResponse = unknown>(path: string, options?: RequestInit) {
    return this.request<TResponse>('GET', path, null, options);
  }

  public async post<TResponse = unknown>(path: string, body?: unknown, options?: RequestInit) {
    return this.request<TResponse>('POST', path, body, options);
  }

  public async put<TResponse = unknown>(path: string, body?: unknown, options?: RequestInit) {
    return this.request<TResponse>('PUT', path, body, options);
  }

  public async patch<TResponse = unknown>(path: string, body?: unknown, options?: RequestInit) {
    return this.request<TResponse>('PATCH', path, body, options);
  }

  public async delete<TResponse = unknown>(path: string, options?: RequestInit) {
    return this.request<TResponse>('DELETE', path, null, options);
  }
}

function getValidationPayload(data: unknown) {
  if (isRecord(data) && isRecord(data.errors)) {
    return data.errors;
  }

  return data;
}

function getApiMessage(data: unknown) {
  if (!isRecord(data)) {
    return undefined;
  }

  if (typeof data.message === 'string') {
    return data.message;
  }

  if (typeof data.error === 'string') {
    return data.error;
  }

  if (typeof data.detail === 'string') {
    return data.detail;
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
