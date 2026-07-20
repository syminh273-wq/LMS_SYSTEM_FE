'use client';

import { useEffect, useState } from 'react';

export interface UseRequireAuthOptions {
  loginPath?: string;
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { loginPath = '/login' } = options;
  const [isAuthenticated] = useState(
    () => typeof window !== 'undefined' && Boolean(localStorage.getItem('accessToken'))
  );

  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      window.location.href = loginPath;
    }
  }, [isAuthenticated, loginPath]);

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userProfile');
    if (typeof window !== 'undefined') {
      window.location.href = loginPath;
    }
  };

  return {
    isAuthenticated,
    logout,
  };
}
