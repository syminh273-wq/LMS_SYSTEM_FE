'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { setProfile } from '@/lib/redux/userSlice';
import { consumerApi, ValidationException } from '@/lib/api';
import { accountService } from '@/lib/api/account';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { Input } from '@shared/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';
import { MasterLayout, MasterHeader, MasterBody } from '@shared/components/layout/MasterLayout';

type LoginFormValues = {
  email: string;
  password: string;
};

function GoogleIcon() {
  return (
    <svg width='20' height='20' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path d='M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z' fill='#FFC107'/>
      <path d='M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z' fill='#FF3D00'/>
      <path d='M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.316 0-9.829-3.562-11.448-8.47l-6.522 5.025C9.505 39.556 16.227 44 24 44z' fill='#4CAF50'/>
      <path d='M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z' fill='#1976D2'/>
    </svg>
  );
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  const { register, handleSubmit, formState: { errors }, setError: setFormError } = useForm<LoginFormValues>();

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

  const onLogin = async (data: LoginFormValues) => {
    setGlobalError(''); setLoading(true);
    try {
      const response = await consumerApi.auth.login(data);
      localStorage.setItem('accessToken', response.access);
      localStorage.setItem('refreshToken', response.refresh);
      try {
        const userProfile = await accountService.getProfile();
        dispatch(setProfile(userProfile));
      } catch {}
      router.push('/consumer/dashboard');
    } catch (err: any) {
      if (err instanceof ValidationException) {
        Object.entries(err.errors).forEach(([field, message]) => {
          const formField = field === 'username' ? 'email' : field;
          setFormError(formField as any, { type: 'server', message });
        });
        toast.error('Vui lòng kiểm tra lại thông tin đăng nhập.');
      } else {
        const msg = err.message || 'Đăng nhập thất bại';
        setGlobalError(msg);
        toast.error(msg);
      }
    } finally { setLoading(false); }
  };

  return (
    <MasterLayout footer={null}>
      <MasterBody className="min-h-screen">
        <div className="flex flex-col lg:flex-row min-h-screen bg-white">
          
          {/* Left Side - Hero */}
          <div className='hidden lg:flex lg:w-1/2 relative bg-[#0F172A] text-white p-16 flex-col justify-between overflow-hidden'>
            <div className='absolute inset-0 opacity-40'>
              <Image 
                src='https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80' 
                alt='Library' 
                fill 
                className='object-cover grayscale transition-transform duration-1000 hover:scale-105'
                priority
              />
              <div className='absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#0F172A]/90 to-[#4F46E5]/30' />
            </div>

            <div className='relative z-10'>
              <div className="flex items-center gap-3 mb-16">
                <div className="bg-white p-2 rounded-xl">
                   <Image src="/logo.svg" alt="EduSphere" width={28} height={28} />
                </div>
                <span className="text-2xl font-black tracking-tight">EduSphere</span>
              </div>

              <div className='inline-flex items-center gap-2 bg-[#4F46E5] px-4 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase mb-8'>
                <span className='w-2 h-2 bg-white rounded-full animate-pulse' />
                ELITE ENROLLMENT 2026
              </div>
              <h1 className='text-6xl font-black leading-tight mb-8 tracking-tighter'>
                Nâng tầm<br />tri thức Việt.
              </h1>
              <p className='text-gray-300 text-xl max-w-lg leading-relaxed font-medium opacity-90'>
                Hệ thống quản lý học tập thông minh, kiến tạo tương lai số cho thế hệ trẻ.
              </p>
            </div>

            <div className='relative z-10 grid grid-cols-2 gap-6'>
              <div className='bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md'>
                <div className='bg-[#4F46E5]/20 w-12 h-12 flex items-center justify-center rounded-xl mb-4'>
                  <ShieldCheck className='text-[#4F46E5]' size={28} />
                </div>
                <h3 className='font-bold text-lg mb-1'>Bảo mật</h3>
                <p className='text-gray-400 text-sm'>Dữ liệu mã hóa chuẩn quốc tế.</p>
              </div>
              <div className='bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md'>
                <div className='bg-[#4F46E5]/20 w-12 h-12 flex items-center justify-center rounded-xl mb-4'>
                  <Zap className='text-[#4F46E5]' size={28} />
                </div>
                <h3 className='font-bold text-lg mb-1'>Tối ưu</h3>
                <p className='text-gray-400 text-sm'>Trải nghiệm học tập mượt mà.</p>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className='flex-1 flex flex-col items-center justify-center p-8 md:p-16 bg-white relative'>
            <div className="absolute top-8 right-8 text-sm text-gray-500 font-medium">
              Chưa có tài khoản?{' '}
              <Link href="/consumer/register" className="text-[#4F46E5] font-bold hover:underline ml-1">
                Đăng ký ngay
              </Link>
            </div>

            <div className='max-w-[440px] w-full'>
              <div className='mb-12'>
                <h2 className='text-5xl font-black text-[#1A1F2C] mb-4 tracking-tighter'>
                  Đăng nhập
                </h2>
                <p className='text-gray-500 text-lg font-medium'>
                  Chào mừng bạn quay trở lại với EduSphere.
                </p>
              </div>

              {globalError && (
                <div className='bg-red-50 text-red-600 p-5 rounded-2xl text-xs font-bold mb-8 border border-red-100 flex items-center gap-3'>
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  {globalError}
                </div>
              )}

              <form onSubmit={handleSubmit(onLogin)} className='space-y-6'>
                <div className='space-y-2'>
                  <label className='text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1'>Địa chỉ Email</label>
                  <Input
                    {...register('email', { required: 'Vui lòng nhập email' })}
                    placeholder='name@company.com'
                    className='bg-[#F8F9FB] border-2 border-transparent focus:border-[#4F46E5]/20 focus:bg-white h-14 rounded-2xl transition-all text-base font-medium px-6'
                  />
                  {errors.email && <p className='text-red-500 text-xs font-bold ml-1'>{errors.email.message}</p>}
                </div>

                <div className='space-y-2'>
                  <div className="flex justify-between items-end px-1">
                    <label className='text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]'>Mật khẩu</label>
                    <Link href='/consumer/forgot-password' className='text-[10px] font-black text-[#4F46E5] hover:underline uppercase tracking-widest'>
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className='relative'>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
                      placeholder='••••••••'
                      className='bg-[#F8F9FB] border-2 border-transparent focus:border-[#4F46E5]/20 focus:bg-white h-14 rounded-2xl pr-14 transition-all text-base font-medium px-6'
                    />
                    <button 
                      type='button' 
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#4F46E5] transition-colors'
                    >
                      {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                  {errors.password && <p className='text-red-500 text-xs font-bold ml-1'>{errors.password.message}</p>}
                </div>

                <div className='pt-4'>
                  <button
                    type='submit'
                    disabled={loading}
                    className='w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white h-15 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-2xl shadow-[#4F46E5]/30 active:scale-[0.98] disabled:opacity-50'
                  >
                    {loading ? 'Đang xác thực...' : 'Đăng nhập ngay'}
                    {!loading && <ArrowRight size={20} />}
                  </button>
                </div>
              </form>

              <div className='relative my-10'>
                <div className='absolute inset-0 flex items-center'><div className='w-full border-t border-gray-100'></div></div>
                <div className='relative flex justify-center text-[10px] uppercase font-black tracking-[0.4em]'><span className='bg-white px-6 text-gray-400'>Hoặc</span></div>
              </div>

              <button
                type='button'
                onClick={() => {
                   const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                   window.location.href = `${backendUrl}/api/v1/consumer/account/auth/google/login/`;
                }}
                className='w-full flex items-center justify-center gap-4 border-2 border-gray-100 h-15 rounded-2xl text-sm font-black text-[#1A1F2C] bg-white hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-[0.98] uppercase tracking-wider'
              >
                <GoogleIcon />
                Tiếp tục với Google
              </button>
            </div>
          </div>
        </div>
      </MasterBody>
    </MasterLayout>
  );
}
