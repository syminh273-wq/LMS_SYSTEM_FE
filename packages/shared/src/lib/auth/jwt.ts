'use client';

export type AppUserType = 'consumer' | 'space' | 'unknown';

export type JwtPayload = {
  user_id?: string;
  user_type?: 'consumer' | 'space' | string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
};

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64UrlDecode(input: string): string {
  let str = input.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  if (typeof atob === 'function') {
    const binary = atob(str);
    try {
      return decodeURIComponent(
        Array.from(binary)
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
    } catch {
      return binary;
    }
  }
  // Node.js fallback (should not be hit in browser, but safe)
  let output = '';
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (str[i] === '=') break;
    output += String.fromCharCode(c);
  }
  return output;
}

export function decodeJwt(token: string | null | undefined): JwtPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const json = base64UrlDecode(parts[1]);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function getUserTypeFromToken(token?: string | null): AppUserType {
  const payload = decodeJwt(token);
  const t = (payload?.user_type as string | undefined) || '';
  if (t === 'space' || t === 'consumer') return t;
  return 'unknown';
}

export function isSpaceToken(token?: string | null): boolean {
  return getUserTypeFromToken(token) === 'space';
}

export function isConsumerToken(token?: string | null): boolean {
  return getUserTypeFromToken(token) === 'consumer';
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('accessToken');
}
