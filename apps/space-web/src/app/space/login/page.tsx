'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { spaceApi, ValidationException } from '@/lib/api';
import { useRouter } from 'next/navigation';
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

  const { register, handleSubmit, formState: { errors }, setError: setFormError } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' }
  });

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
      
      router.push('/space');
    } catch (err: any) {
      handleApiError(err);
    } finally { setLoading(false); }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-slate-100 px-4'>
      <div className='max-w-md w-full'>
        <div className='bg-white rounded-2xl shadow-xl overflow-hidden'>
          <div className='bg-slate-900 py-8 px-10 text-center'>
            <div className="flex justify-center mb-4">
              <Image src="/logo.jpg" alt="LMS LOGO" width={150} height={50} className="h-12 w-auto object-contain brightness-0 invert" />
            </div>
            <h2 className='text-white text-2xl font-bold'>Space Administrator</h2>
            <p className='text-slate-400 text-sm mt-1'>Đăng nhập để quản lý tổ chức của bạn</p>
          </div>

          <div className='p-10'>
            {globalError && (
              <div className='bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-red-700 text-sm'>
                {globalError}
              </div>
            )}

            <form onSubmit={handleSubmit(onLogin)} className='space-y-6'>
              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>Email quản trị</label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400'>
                    <Mail size={18} />
                  </div>
                  <input 
                    type='email' 
                    {...register('email', { required: 'Vui lòng nhập email' })} 
                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-white transition-all ${errors.email ? 'border-red-500 ring-red-100' : 'border-slate-200'}`} 
                    placeholder='admin@your-space.com' 
                  />
                </div>
                {errors.email && <p className='text-red-500 text-xs mt-1 font-medium'>{errors.email.message}</p>}
              </div>

              <div>
                <label className='block text-sm font-semibold text-slate-700 mb-2'>Mật khẩu</label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400'>
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    {...register('password', { required: 'Vui lòng nhập mật khẩu' })} 
                    className={`block w-full pl-10 pr-10 py-2.5 border rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-white transition-all ${errors.password ? 'border-red-500 ring-red-100' : 'border-slate-200'}`} 
                    placeholder='••••••••' 
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600'
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

            <div className='mt-8 pt-6 border-t border-slate-100 text-center'>
              <p className='text-slate-500 text-sm'>
                Chưa có Space? {' '}
                <Link href='/space/register' className='text-slate-900 font-bold hover:underline'>
                  Tạo Space mới
                </Link>
              </p>
            </div>
          </div>
        </div>
        
        <div className='mt-6 text-center'>
          <Link href='http://localhost:3000/login' className='text-slate-500 text-xs hover:text-slate-800 font-medium transition-colors'>
            &larr; Quay lại trang người dùng
          </Link>
        </div>
      </div>
    </div>
  );
}
