'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { spaceApi, ValidationException } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, Mail, User, Building, Globe } from 'lucide-react';
import Link from 'next/link';

type RegisterFormValues = {
  email: string;
  password: string;
};

export default function SpaceRegisterPage() {
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, setError: setFormError } = useForm<RegisterFormValues>({
    defaultValues: { email: '', password: '' }
  });

  const handleApiError = (err: any) => {
    if (err instanceof ValidationException) {
      Object.entries(err.errors).forEach(([field, message]) => {
        setFormError(field as any, { type: 'server', message });
      });
    } else {
      setGlobalError(err.message || 'Đăng ký thất bại');
    }
  };

  const onRegister = async (data: RegisterFormValues) => {
    setGlobalError('');
    setLoading(true);
    try {
      // Tự động tạo name và slug từ email nếu API yêu cầu
      const name = data.email.split('@')[0];
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
      
      await spaceApi.auth.register({
        ...data,
        name: name,
        slug: slug,
        full_name: name
      });
      router.push('/space/login?registered=true');
    } catch (err: any) {
      handleApiError(err);
    } finally { setLoading(false); }
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-muted px-4 py-12'>
      <div className='max-w-md w-full'>
        <div className='bg-card rounded-2xl shadow-xl overflow-hidden'>
          <div className='bg-slate-900 py-8 px-10 text-center'>
            <div className="flex justify-center mb-4">
              <Image src="/logo.jpg" alt="LMS LOGO" width={150} height={50} className="h-12 w-auto object-contain brightness-0 invert" />
            </div>
            <h2 className='text-white text-2xl font-bold'>Đăng ký Space</h2>
            <p className='text-muted-foreground text-sm mt-1'>Bắt đầu quản lý tổ chức của bạn</p>
          </div>

          <div className='p-10'>
            {globalError && (
              <div className='bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-red-700 text-sm'>
                {globalError}
              </div>
            )}

            <form onSubmit={handleSubmit(onRegister)} className='space-y-5'>
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
                <label className='block text-sm font-semibold text-foreground mb-2'>Mật khẩu hệ thống</label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground'>
                    <Lock size={18} />
                  </div>
                  <input 
                    type='password' 
                    {...register('password', { required: 'Vui lòng nhập mật khẩu' })} 
                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg bg-muted/50 text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-card transition-all ${errors.password ? 'border-red-500 ring-red-100' : 'border-border'}`} 
                    placeholder='••••••••' 
                  />
                </div>
                {errors.password && <p className='text-red-500 text-xs mt-1 font-medium'>{errors.password.message}</p>}
              </div>

              <button 
                type='submit' 
                disabled={loading} 
                className='w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 disabled:bg-slate-400 transition-all shadow-lg active:scale-[0.98] mt-4'
              >
                {loading ? 'Đang khởi tạo...' : 'Khởi tạo Space của tôi'}
              </button>
            </form>

            <div className='mt-8 pt-6 border-t border-border text-center'>
              <p className='text-muted-foreground text-sm'>
                Đã có Space? {' '}
                <Link href='/space/login' className='text-foreground font-bold hover:underline'>
                  Đăng nhập quản trị
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
