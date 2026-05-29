'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { spaceApi, ValidationException } from '@/lib/api';
import { accountService } from '@/lib/api/account';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setProfile } from '@/lib/redux/userSlice';
import Image from 'next/image';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import Link from 'next/link';

type LoginFormValues = {
  email: string;
  password: string;
};

export default function SpaceLoginPage() {
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  const { register, handleSubmit, formState: { errors }, setError: setFormError } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' }
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err) setGlobalError(decodeURIComponent(err));
  }, []);

  const handleApiError = (err: any) => {
    if (err instanceof ValidationException) {
      Object.entries(err.errors).forEach(([field, message]) => {
        setFormError(field as any, { type: 'server', message });
      });
    } else {
      setGlobalError(err.message || 'Đăng nhập thất bại');
    }
  };

  const onLogin = async (data: LoginFormValues) => {
    setGlobalError('');
    setLoading(true);
    try {
      const response = await spaceApi.auth.login({ email: data.email, password: data.password });
      localStorage.setItem('accessToken', response.access);
      localStorage.setItem('refreshToken', response.refresh);
      localStorage.setItem('userType', 'space');

      const profile = await accountService.getProfile();
      dispatch(setProfile(profile));

      router.push('/space');
    } catch (err: any) {
      handleApiError(err);
    } finally { setLoading(false); }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-muted px-4'>
      <div className='max-w-md w-full'>
        <div className='bg-card rounded-2xl shadow-xl overflow-hidden'>
          <div className='bg-slate-900 py-8 px-10 text-center'>
            <div className="flex justify-center mb-4">
              <Image src="/logo.jpg" alt="LMS LOGO" width={150} height={50} className="h-12 w-auto object-contain brightness-0 invert" />
            </div>
            <h2 className='text-white text-2xl font-bold'>Space Administrator</h2>
            <p className='text-muted-foreground text-sm mt-1'>Đăng nhập để quản lý tổ chức của bạn</p>
          </div>

          <div className='p-10'>
            {globalError && (
              <div className='bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-red-700 text-sm'>
                {globalError}
              </div>
            )}

            <form onSubmit={handleSubmit(onLogin)} className='space-y-6'>
              <div>
                <label className='block text-sm font-semibold text-foreground mb-2'>Email quản trị</label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground'>
                    <Mail size={18} />
                  </div>
                  <input 
                    type='email' 
                    {...register('email', { required: 'Vui lòng nhập email' })} 
                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg bg-muted/50 text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-card transition-all ${errors.email ? 'border-red-500 ring-red-100' : 'border-border'}`} 
                    placeholder='admin@your-space.com' 
                  />
                </div>
                {errors.email && <p className='text-red-500 text-xs mt-1 font-medium'>{errors.email.message}</p>}
              </div>

              <div>
                <label className='block text-sm font-semibold text-foreground mb-2'>Mật khẩu</label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground'>
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    {...register('password', { required: 'Vui lòng nhập mật khẩu' })} 
                    className={`block w-full pl-10 pr-10 py-2.5 border rounded-lg bg-muted/50 text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-card transition-all ${errors.password ? 'border-red-500 ring-red-100' : 'border-border'}`} 
                    placeholder='••••••••' 
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-muted-foreground'
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className='text-red-500 text-xs mt-1 font-medium'>{errors.password.message}</p>}
              </div>

              <button
                type='submit'
                disabled={loading}
                className='w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 disabled:bg-slate-400 transition-all shadow-lg active:scale-[0.98] flex justify-center items-center gap-2'
              >
                {loading ? 'Đang xác thực...' : 'Đăng nhập hệ thống'}
              </button>
            </form>

            <div className='mt-6 flex items-center gap-3'>
              <div className='h-px flex-1 bg-muted' />
              <span className='text-xs text-muted-foreground font-medium'>hoặc</span>
              <div className='h-px flex-1 bg-muted' />
            </div>

            <button
              type='button'
              onClick={() => {
                const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                window.location.href = `${backendUrl}/api/v1/space/account/auth/google/login/`;
              }}
              className='mt-4 w-full flex items-center justify-center gap-3 border border-border rounded-lg px-4 py-2.5 text-sm font-medium text-foreground bg-card hover:bg-muted/50 active:scale-[0.98] transform transition-all shadow-sm'
            >
              <svg width='20' height='20' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'>
                <path d='M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z' fill='#FFC107'/>
                <path d='M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z' fill='#FF3D00'/>
                <path d='M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.316 0-9.829-3.562-11.448-8.47l-6.522 5.025C9.505 39.556 16.227 44 24 44z' fill='#4CAF50'/>
                <path d='M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z' fill='#1976D2'/>
              </svg>
              Đăng nhập với Google
            </button>
            <p className='mt-2 text-center text-xs text-muted-foreground'>Chỉ dành cho Space đã đăng ký</p>

            <div className='mt-8 pt-6 border-t border-border text-center'>
              <p className='text-muted-foreground text-sm'>
                Chưa có Space? {' '}
                <Link href='/space/register' className='text-foreground font-bold hover:underline'>
                  Tạo Space mới
                </Link>
              </p>
            </div>
          </div>
        </div>
        
        <div className='mt-6 text-center'>
          <Link href='http://localhost:3000/login' className='text-muted-foreground text-xs hover:text-foreground font-medium transition-colors'>
            &larr; Quay lại trang người dùng
          </Link>
        </div>
      </div>
    </div>
  );
}
