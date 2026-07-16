'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from 'lucide-react';
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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-[440px] animate-fade-up">
        <Link
          href="/consumer/login"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500 hover:text-slate-900 font-semibold mb-8 transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Quay lại đăng nhập
        </Link>

        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-md mb-5">
            <ShieldCheck size={22} strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 mb-1.5 tracking-tight text-balance">
            Quên mật khẩu?
          </h1>
          <p className="text-slate-500 text-[14px]">
            Nhập email tài khoản, chúng tôi sẽ gửi mã OTP để xác thực.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-slate-700">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} strokeWidth={2} />
              <Input
                {...register('email', { required: 'Vui lòng nhập email' })}
                type="email"
                placeholder="name@company.com"
                className="h-11 pl-10 text-[14px] bg-white border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors"
              />
            </div>
            {errors.email && (
              <p className="text-rose-600 text-[12px] font-medium mt-1">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full h-11 rounded-lg font-semibold text-[14px] text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                Gửi mã OTP
                <ArrowRight size={16} strokeWidth={2.5} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
