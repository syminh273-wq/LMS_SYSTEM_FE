'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Input } from '@shared/components/ui/input';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth';

type FormValues = { email: string };

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      await authApi.consumerForgotPassword({ email: data.email });
      toast.success('Mã OTP đã được gửi về email của bạn.');
      router.push(`/consumer/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      toast.error(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-[440px] w-full">
        <Link
          href="/consumer/login"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#4F46E5] font-medium mb-10 transition-colors"
        >
          <ArrowLeft size={16} />
          Quay lại đăng nhập
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-black text-[#1A1F2C] mb-3 tracking-tighter">
            Quên mật khẩu?
          </h1>
          <p className="text-gray-500 text-base font-medium">
            Nhập email tài khoản, chúng tôi sẽ gửi mã OTP để xác thực.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
              Địa chỉ Email
            </label>
            <Input
              {...register('email', { required: 'Vui lòng nhập email' })}
              type="email"
              placeholder="name@company.com"
              className="bg-[#F8F9FB] border-2 border-transparent focus:border-[#4F46E5]/20 focus:bg-white h-14 rounded-2xl transition-all text-base font-medium px-6"
            />
            {errors.email && (
              <p className="text-red-500 text-xs font-bold ml-1">{errors.email.message}</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white h-14 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-2xl shadow-[#4F46E5]/30 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
