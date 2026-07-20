import { useState, useCallback } from 'react';
import { authApi } from '../api';
import type { LoginRequest, RegisterRequest } from '../types';

export function useSpaceLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useCallback(async (data: LoginRequest) => {
    try {
      setLoading(true);
      setError('');
      const res = await authApi.spaceLogin(data);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', res.access);
        localStorage.setItem('refreshToken', res.refresh);
        localStorage.setItem('userType', 'space');
      }
      
      return res;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    login,
    loading,
    error,
  };
}

export function useConsumerLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useCallback(async (data: LoginRequest) => {
    try {
      setLoading(true);
      setError('');
      const res = await authApi.consumerLogin(data);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', res.access);
        localStorage.setItem('refreshToken', res.refresh);
        localStorage.setItem('userType', 'consumer');
      }
      
      return res;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    login,
    loading,
    error,
  };
}

export function useSpaceRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const register = useCallback(async (data: RegisterRequest & { name: string; slug: string }) => {
    try {
      setLoading(true);
      setError('');
      const res = await authApi.spaceRegister(data);
      return res;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    register,
    loading,
    error,
  };
}

export function useConsumerRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const register = useCallback(async (data: RegisterRequest) => {
    try {
      setLoading(true);
      setError('');
      const res = await authApi.consumerRegister(data);
      return res;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    register,
    loading,
    error,
  };
}

export function useForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const forgotPassword = useCallback(async (email: string, userType: 'space' | 'consumer' = 'space') => {
    try {
      setLoading(true);
      setError('');
      const api = userType === 'space' ? authApi.spaceForgotPassword : authApi.consumerForgotPassword;
      const res = await api({ email });
      return res;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    forgotPassword,
    loading,
    error,
  };
}

export function useVerifyOtp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verifyOtp = useCallback(async (email: string, otpCode: string, userType: 'space' | 'consumer' = 'space') => {
    try {
      setLoading(true);
      setError('');
      const api = userType === 'space' ? authApi.spaceVerifyOtp : authApi.consumerVerifyOtp;
      const res = await api({ email, otp_code: otpCode });
      return res;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    verifyOtp,
    loading,
    error,
  };
}

export function useResetPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetPassword = useCallback(async (
    resetToken: string,
    newPassword: string,
    confirmPassword: string,
    userType: 'space' | 'consumer' = 'space'
  ) => {
    try {
      setLoading(true);
      setError('');
      const api = userType === 'space' ? authApi.spaceResetPassword : authApi.consumerResetPassword;
      const res = await api({
        reset_token: resetToken,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      return res;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    resetPassword,
    loading,
    error,
  };
}

export function useLogout() {
  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userProfile');
    }
  }, []);

  return { logout };
}
