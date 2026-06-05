'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { consumerApi, ValidationException } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Eye, EyeOff, ShieldCheck, Zap, ArrowRight, PartyPopper } from 'lucide-react';
import { Input } from '@shared/components/ui/input';
import Link from 'next/link';
import { toast } from 'sonner';
import { MasterLayout, MasterHeader, MasterBody } from '@shared/components/layout/MasterLayout';

type RegisterFormValues = {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
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

export default function RegisterPage() {
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, setError: setFormError } = useForm<RegisterFormValues>();

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
    setSuccess(''); setGlobalError(''); setLoading(true);
    try {
      const response = await consumerApi.auth.register(data);
      
      toast.success('Chúc mừng! Đăng ký tài khoản thành công.', {
        description: 'Bạn sẽ được chuyển đến trang đăng nhập trong giây lát.',
        icon: <PartyPopper className="text-green-500" size={20} />,
        duration: 4000,
      });

      setSuccess(response.message || 'Đăng ký thành công. Vui lòng đăng nhập.');
      setTimeout(() => router.push('/consumer/login'), 2000);
    } catch (err: any) {
      if (err instanceof ValidationException) {
        Object.entries(err.errors).forEach(([field, message]) => {
          setFormError(field as any, { type: 'server', message });
        });
        toast.error('Vui lòng kiểm tra lại thông tin đăng ký.');
      } else {
        const msg = err.message || 'Đăng ký thất bại';
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
                Bắt đầu hành trình<br />vươn tầm.
              </h1>
              <p className='text-gray-300 text-xl max-w-lg leading-relaxed font-medium opacity-90'>
                Gia nhập cộng đồng người học tinh hoa và trải nghiệm nền tảng giáo dục chuẩn quốc tế.
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
              Đã có tài khoản?{' '}
              <Link href="/consumer/login" className="text-[#4F46E5] font-bold hover:underline ml-1">
                Đăng nhập ngay
              </Link>
            </div>

            <div className='max-w-[480px] w-full'>
              <div className='mb-10'>
                <h2 className='text-5xl font-black text-[#1A1F2C] mb-4 tracking-tighter'>
                  Đăng ký
                </h2>
                <p className='text-gray-500 text-lg font-medium'>
                  Trở thành học viên của EduSphere ngay hôm nay.
                </p>
              </div>

              {globalError && (
                <div className='bg-red-50 text-red-600 p-5 rounded-2xl text-xs font-bold mb-6 border border-red-100 flex items-center gap-3'>
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  {globalError}
                </div>
              )}

              {success && (
                <div className='bg-green-50 text-green-600 p-5 rounded-2xl text-xs font-bold mb-6 border border-green-100 flex items-center gap-3'>
                  <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit(onRegister)} className='space-y-5'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <label className='text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1'>Họ</label>
                    <Input
                      {...register('last_name', { required: 'Bắt buộc' })}
                      placeholder='Nguyễn'
                      className='bg-[#F8F9FB] border-2 border-transparent focus:border-[#4F46E5]/20 focus:bg-white h-13 rounded-2xl transition-all text-sm font-medium px-5'
                    />
                    {errors.last_name && <p className='text-red-500 text-[10px] font-bold ml-1'>{errors.last_name.message}</p>}
                  </div>
                  <div className='space-y-2'>
                    <label className='text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1'>Tên</label>
                    <Input
                      {...register('first_name', { required: 'Bắt buộc' })}
                      placeholder='An'
                      className='bg-[#F8F9FB] border-2 border-transparent focus:border-[#4F46E5]/20 focus:bg-white h-13 rounded-2xl transition-all text-sm font-medium px-5'
                    />
                    {errors.first_name && <p className='text-red-500 text-[10px] font-bold ml-1'>{errors.first_name.message}</p>}
                  </div>
                </div>

                <div className='space-y-2'>
                  <label className='text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1'>Địa chỉ Email</label>
                  <Input
                    {...register('email', { required: 'Bắt buộc' })}
                    placeholder='name@company.com'
                    className='bg-[#F8F9FB] border-2 border-transparent focus:border-[#4F46E5]/20 focus:bg-white h-13 rounded-2xl transition-all text-sm font-medium px-5'
                  />
                  {errors.email && <p className='text-red-500 text-[10px] font-bold ml-1'>{errors.email.message}</p>}
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <label className='text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1'>Mật khẩu</label>
                    <div className='relative'>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        {...register('password', { required: 'Bắt buộc', minLength: { value: 8, message: 'Tối thiểu 8 ký tự' } })}
                        placeholder='••••••••'
                        className='bg-[#F8F9FB] border-2 border-transparent focus:border-[#4F46E5]/20 focus:bg-white h-13 rounded-2xl pr-12 transition-all text-sm font-medium px-5'
                      />
                      <button 
                        type='button' 
                        onClick={() => setShowPassword(!showPassword)}
                        className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#4F46E5]'
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className='text-red-500 text-[10px] font-bold ml-1'>{errors.password.message}</p>}
                  </div>

                  <div className='space-y-2'>
                    <label className='text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1'>Xác nhận</label>
                    <div className='relative'>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...register('confirm_password', { 
                          required: 'Bắt buộc',
                          validate: (val, values) => {
                            if (val !== values.password) {
                              return "Mật khẩu không khớp";
                            }
                          }
                        })}
                        placeholder='••••••••'
                        className='bg-[#F8F9FB] border-2 border-transparent focus:border-[#4F46E5]/20 focus:bg-white h-13 rounded-2xl pr-12 transition-all text-sm font-medium px-5'
                      />
                      <button 
                        type='button' 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#4F46E5]'
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.confirm_password && <p className='text-red-500 text-[10px] font-bold ml-1'>{errors.confirm_password.message}</p>}
                  </div>
                </div>

                <div className='flex items-start gap-3 py-2'>
                  <input type='checkbox' className='mt-1 rounded border-gray-300 text-[#4F46E5] focus:ring-[#4F46E5]' required />
                  <p className='text-[11px] text-gray-400 leading-relaxed font-bold'>
                    Tôi đồng ý với <Link href='#' className='text-[#4F46E5] hover:underline'>Điều khoản dịch vụ</Link> và <Link href='#' className='text-[#4F46E5] hover:underline'>Chính sách bảo mật</Link> của EduSphere.
                  </p>
                </div>

                <div className='pt-2'>
                  <button
                    type='submit'
                    disabled={loading}
                    className='w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white h-15 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-2xl shadow-[#4F46E5]/30 active:scale-[0.98] disabled:opacity-50'
                  >
                    {loading ? 'Đang khởi tạo...' : 'Tạo tài khoản ngay'}
                    {!loading && <ArrowRight size={20} />}
                  </button>
                </div>
              </form>

              <div className='relative my-8'>
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
