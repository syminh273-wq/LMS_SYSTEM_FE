'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { spaceApi, ValidationException } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock, Mail, GraduationCap, ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { MasterLayout, MasterHeader, MasterBody } from '@shared/components/layout/MasterLayout';

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
    <MasterLayout
      header={
        <MasterHeader className="px-12 py-8 h-auto bg-transparent border-none">
          <div className="flex items-center gap-3">
            <div className="bg-[#1A1F2C] p-2 rounded-xl shadow-lg">
               <Image src="/logo.jpg" alt="EduSphere" width={28} height={28} className="brightness-0 invert" />
            </div>
            <span className="text-2xl font-black text-[#1A1F2C] tracking-tight">EduSphere</span>
          </div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Professional Academy Network
          </div>
        </MasterHeader>
      }
    >
      <MasterBody className="items-center justify-center p-6 relative z-10">
        {/* Floating Stat Card */}
        <div className='absolute bottom-12 left-12 bg-white/80 backdrop-blur-xl p-5 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.05)] border border-white/50 animate-bounce' style={{ animationDuration: '4s' }}>
          <div className='flex items-center gap-3 mb-3'>
             <div className='p-2 bg-indigo-50 rounded-lg'>
                <TrendingUp size={16} className='text-[#4F46E5]' />
             </div>
             <span className='text-[10px] font-black text-[#1A1F2C] uppercase tracking-wider'>Hiệu suất học tập</span>
          </div>
          <div className='w-40 h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2'>
             <div className='w-2/3 h-full bg-[#4F46E5] rounded-full' />
          </div>
          <span className='text-[10px] font-bold text-green-500'>+24% tương tác trong tháng qua</span>
        </div>

        {/* Main Card */}
        <div className='w-full max-w-lg bg-white rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.08)] overflow-hidden relative group'>
          {/* Top Gradient Border */}
          <div className='h-1.5 w-full bg-gradient-to-r from-transparent via-[#4F46E5] to-transparent opacity-80' />
          
          <div className='p-12 md:p-16'>
            <div className='flex flex-col items-center text-center mb-10'>
              <div className='w-20 h-20 bg-[#EEF2FF] rounded-[28px] flex items-center justify-center mb-6 shadow-inner'>
                <GraduationCap size={40} className='text-[#4F46E5]' />
              </div>
              <h1 className='text-3xl font-black text-[#1A1F2C] mb-4 tracking-tight'>
                Khởi tạo Space của bạn
              </h1>
              <p className='text-gray-500 text-sm leading-relaxed max-w-[280px]'>
                Thiết lập không gian đào tạo chuyên nghiệp cho đội ngũ và học viên của bạn chỉ trong vài bước.
              </p>
            </div>

            {globalError && (
              <div className='bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold mb-6 border border-red-100'>
                {globalError}
              </div>
            )}

            <form onSubmit={handleSubmit(onRegister)} className='space-y-6'>
              <div className='space-y-2'>
                <label className='text-[11px] font-black text-[#1A1F2C] uppercase tracking-widest ml-1'>Admin Email</label>
                <div className='relative'>
                  <Mail className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' size={18} />
                  <input 
                    {...register('email', { required: 'Bắt buộc' })}
                    placeholder='name@organization.com'
                    className='w-full bg-[#F3F4F9] border-none h-14 rounded-2xl pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#4F46E5]/20 focus:bg-white transition-all outline-none'
                  />
                </div>
                {errors.email && <p className='text-red-500 text-[10px] font-bold ml-1'>{errors.email.message}</p>}
              </div>

              <div className='space-y-2'>
                <label className='text-[11px] font-black text-[#1A1F2C] uppercase tracking-widest ml-1'>Mật khẩu hệ thống</label>
                <div className='relative'>
                  <Lock className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400' size={18} />
                  <input 
                    type='password'
                    {...register('password', { required: 'Bắt buộc' })}
                    placeholder='••••••••••••'
                    className='w-full bg-[#F3F4F9] border-none h-14 rounded-2xl pl-12 pr-12 text-sm font-medium focus:ring-2 focus:ring-[#4F46E5]/20 focus:bg-white transition-all outline-none'
                  />
                  <button type='button' className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500'>
                    <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'/><circle cx='12' cy='12' r='3'/></svg>
                  </button>
                </div>
                {errors.password && <p className='text-red-500 text-[10px] font-bold ml-1'>{errors.password.message}</p>}
                <p className='text-[10px] text-gray-400 font-medium ml-1'>Mật khẩu cần ít nhất 8 ký tự bao gồm chữ cái và số.</p>
              </div>

              <button 
                type='submit' 
                disabled={loading}
                className='w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white h-16 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-[#4F46E5]/20 active:scale-[0.98] disabled:opacity-50 mt-4'
              >
                {loading ? 'Đang khởi tạo...' : 'Bắt đầu quản lý ngay'}
                {!loading && <ArrowRight size={20} />}
              </button>
            </form>

            <div className='mt-12 pt-8 border-t border-gray-50 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                 <ShieldCheck className='text-indigo-600' size={16} />
                 <span className='text-[10px] font-bold text-gray-400 uppercase tracking-wider'>Bảo mật cấp doanh nghiệp</span>
              </div>
              <div className='flex -space-x-2'>
                 {[1,2,3].map(i => (
                   <div key={i} className='w-7 h-7 rounded-full border-2 border-white bg-gray-100 overflow-hidden relative'>
                      <Image src={`https://i.pravatar.cc/100?u=${i}`} alt='user' fill className='object-cover' />
                   </div>
                 ))}
                 <div className='w-7 h-7 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[8px] font-bold text-gray-400'>+2k</div>
              </div>
            </div>
          </div>
        </div>
      </MasterBody>
    </MasterLayout>
  );
}
