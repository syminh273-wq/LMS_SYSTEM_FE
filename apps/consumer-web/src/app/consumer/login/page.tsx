'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { setProfile } from '@/lib/redux/userSlice';
import { consumerApi, ValidationException } from '@/lib/api';
import { accountService } from '@/lib/api/account';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

type AuthFormValues = {
  email: string;
  password: string;
  confirm_password?: string;
  root?: {
    server?: string;
  };
};

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  const { register, handleSubmit, formState: { errors }, reset, setError: setFormError, setValue } = useForm<AuthFormValues>({
    defaultValues: { email: '', password: '', confirm_password: '' }
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) {
      const errorMessages: Record<string, string> = {
        google_auth_failed: 'Đăng nhập Google thất bại. Vui lòng thử lại.',
        google_token_failed: 'Không thể xác thực với Google.',
        google_token_invalid: 'Token Google không hợp lệ.',
        account_disabled: 'Tài khoản đã bị vô hiệu hóa.',
      };
      setGlobalError(errorMessages[err] || 'Đăng nhập thất bại.');
    }
  }, []);

  const handleApiError = (err: any, prefix: string) => {
    if (err instanceof ValidationException) {
      let hasFieldErrors = false;
      Object.entries(err.errors).forEach(([field, message]) => {
        // Map 'username' from backend to 'email' in frontend
        const formField = field === 'username' ? 'email' : field;

        if (formField === 'email' || formField === 'password' || formField === 'confirm_password') {
          setFormError(formField as any, { type: 'server', message });
          hasFieldErrors = true;
        }
      });
      if (!hasFieldErrors) {
        setGlobalError(prefix + ': Lỗi dữ liệu không xác định');
      }
    } else {
      setGlobalError(err.message || prefix + ' thất bại');
    }
  };

  const onLogin = async (data: AuthFormValues) => {
    setSuccess('');
    setGlobalError('');
    setLoading(true);
    try {
      const response = await consumerApi.auth.login({ email: data.email, password: data.password });
      localStorage.setItem('accessToken', response.access);
      localStorage.setItem('refreshToken', response.refresh);

      // Fetch user profile after successful login
      try {
        const userProfile = await accountService.getProfile();
        dispatch(setProfile(userProfile));
      } catch (profileErr) {
        console.error("Failed to fetch profile after login:", profileErr);
      }

      router.push('/consumer/dashboard');
    } catch (err: any) {
      handleApiError(err, 'Đăng nhập');
    } finally { setLoading(false); }
  };

  const onRegister = async (data: AuthFormValues) => {
    setSuccess('');
    setGlobalError('');
    setLoading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('confirm_password', data.confirm_password || '');

      const response = await consumerApi.auth.register(formData);
      setSuccess(response.message || 'Đăng ký thành công. Vui lòng đăng nhập.');
      setIsLogin(true);
      reset({ email: data.email, password: '', confirm_password: '' });
    } catch (err: any) {
      handleApiError(err, 'Đăng ký');
    } finally { setLoading(false); }
  };

  const inputClass = (fieldName: keyof AuthFormValues) => {
    return `w-full px-4 py-2 border rounded-lg outline-none transition-all focus:ring-2 ${
      errors[fieldName] ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-500'
    }`;
  };
  const labelClass = (fieldName: keyof AuthFormValues) => `block text-sm font-medium mb-1 ${errors[fieldName] ? "text-red-500" : "text-gray-700"}`;
  const errorClass = "text-red-500 text-xs mt-1 font-medium";

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4'>
      <div className='max-w-md w-full bg-white rounded-xl shadow-lg p-8'>
        <div className="flex justify-center mb-6">
          <Image src="/logo.jpg" alt="LMS LOGO" width={180} height={60} className="h-16 w-auto object-contain" />
        </div>
        <p className='text-center text-gray-500 mb-8'>{isLogin ? 'Đăng nhập để tiếp tục' : 'Tạo tài khoản mới'}</p>

        {success && <div className='bg-green-50 border-l-4 border-green-400 p-4 mb-6 text-green-700 text-sm animate-in fade-in slide-in-from-top-2'>{success}</div>}
        {globalError && <div className='bg-red-50 border-l-4 border-red-400 p-4 mb-6 text-red-700 text-sm animate-in fade-in slide-in-from-top-2'>{globalError}</div>}

        <form onSubmit={handleSubmit(isLogin ? onLogin : onRegister)} className='space-y-4'>

          <div>
            <label className={labelClass('email')}>Email</label>
            <input type='text' {...register('email', { required: 'Thông tin bắt buộc' })} className={inputClass('email')} placeholder='name@example.com' />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>

          <div>
            <label className={labelClass('password')}>Mật khẩu</label>
            <div className='relative'>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password', { required: 'Thông tin bắt buộc' })}
                className={inputClass('password')}
                placeholder='••••••••'
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none'
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <p className={errorClass}>{errors.password.message}</p>}
          </div>

          {!isLogin && (
            <div>
              <label className={labelClass('confirm_password')}>Xác nhận mật khẩu</label>
              <div className='relative'>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirm_password', { required: 'Thông tin bắt buộc' })}
                  className={inputClass('confirm_password')}
                  placeholder='••••••••'
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none'
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirm_password && <p className={errorClass}>{errors.confirm_password.message}</p>}
            </div>
          )}

          <button type='submit' disabled={loading} className='w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 transition-colors mt-4 shadow-md active:scale-[0.98] transform'>
            {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản')}
          </button>
        </form>

        <div className='mt-6 flex items-center gap-3'>
          <div className='h-px flex-1 bg-gray-200' />
          <span className='text-xs text-gray-400 font-medium'>hoặc</span>
          <div className='h-px flex-1 bg-gray-200' />
        </div>

        <button
          type='button'
          onClick={() => {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            window.location.href = `${backendUrl}/api/v1/consumer/account/auth/google/login/`;
          }}
          className='mt-4 w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 active:scale-[0.98] transform transition-all shadow-sm'
        >
          <svg width='20' height='20' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <path d='M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z' fill='#FFC107'/>
            <path d='M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z' fill='#FF3D00'/>
            <path d='M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.316 0-9.829-3.562-11.448-8.47l-6.522 5.025C9.505 39.556 16.227 44 24 44z' fill='#4CAF50'/>
            <path d='M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z' fill='#1976D2'/>
          </svg>
          Đăng nhập với Google
        </button>

        <div className='mt-6 text-center text-sm text-gray-600'>
          {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'} {' '}
          <button onClick={() => { setIsLogin(!isLogin); setGlobalError(''); setSuccess(''); reset(); }} className='text-indigo-600 font-medium hover:underline'>
            {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}
