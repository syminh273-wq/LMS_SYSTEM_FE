import { UnauthorizedException, ValidationException, ApiException } from './exceptions';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export default class BaseRestApiClient {
  public baseURL: string;
  public static onUnauthorized?: () => void;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }

  protected getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  protected async tryRefreshToken(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) return false;
    const userType = localStorage.getItem('userType') || 'space';
    const path = userType === 'space'
      ? '/api/v1/space/account/token/refresh/'
      : '/api/v1/consumer/account/token/refresh/';
    try {
      const res = await fetch(`${this.baseURL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) return false;
      const data = (await res.json().catch(() => null)) as { access?: string } | null;
      if (!data?.access) return false;
      localStorage.setItem('accessToken', data.access);
      return true;
    } catch {
      return false;
    }
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

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[api]', method, url, token ? `with-token(${token.slice(0, 12)}...)` : 'NO-TOKEN');
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
      return await this.handleResponse<TResponse>(response, url, config, headers);
    } catch (error) {
      if (error instanceof ApiException) throw error;
      throw new ApiException(error instanceof Error ? error.message : 'Network Error');
    }
  }

  protected async handleResponse<TResponse = unknown>(response: Response, url: string, config: RequestInit, headers: Record<string, string>): Promise<TResponse> {
    if (response.status === 204) return null as TResponse;

    const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            const sentToken = this.getAccessToken();
            console.warn('[api 401]', url, sentToken ? `had-token(${sentToken.slice(0, 12)}...)` : 'no-token', 'data=', data);
            if (sentToken) {
              const refreshed = await this.tryRefreshToken();
              if (refreshed) {
                const retryResponse = await fetch(url, {
                  ...config,
                  headers: {
                    ...headers,
                    'Authorization': `Bearer ${this.getAccessToken()}`,
                  },
                });
                if (retryResponse.ok) {
                  const retryData = await retryResponse.json().catch(() => null);
                  return retryData as TResponse;
                }
              }
              BaseRestApiClient.onUnauthorized?.();
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('userProfile');
              window.location.href = '/space/login';
            }
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
