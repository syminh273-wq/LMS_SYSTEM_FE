export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Date.now() >= exp;
  } catch {
    return true;
  }
}

export function getTokenPayload(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function getStoredTokens(): { access: string | null; refresh: string | null } {
  if (typeof window === 'undefined') {
    return { access: null, refresh: null };
  }
  return {
    access: localStorage.getItem('accessToken'),
    refresh: localStorage.getItem('refreshToken'),
  };
}

export function setStoredTokens(access: string, refresh: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

export function clearStoredTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userProfile');
}

export function isAuthenticated(): boolean {
  const { access } = getStoredTokens();
  if (!access) return false;
  return !isTokenExpired(access);
}

export function getUserType(): 'space' | 'consumer' | null {
  if (typeof window === 'undefined') return null;
  return (localStorage.getItem('userType') as 'space' | 'consumer') || null;
}

export function setUserType(type: 'space' | 'consumer'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('userType', type);
}

export function getLoginPath(userType: 'space' | 'consumer' | null): string {
  if (userType === 'consumer') return '/login';
  return '/space/login';
}

export function getDashboardPath(userType: 'space' | 'consumer' | null): string {
  if (userType === 'consumer') return '/';
  return '/space';
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ hoa');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ thường');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 số');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
