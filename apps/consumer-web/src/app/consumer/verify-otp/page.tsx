'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { Input } from '@shared/components/ui/input';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth';

type FormValues = { otp_code: string };

export default function VerifyOTPPage() {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

  useEffect(() => {
    if (!email) router.replace('/consumer/forgot-password');
  }, [email, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const result = await authApi.consumerVerifyOtp({ email, otp_code: data.otp_code });
      toast.success('Xác thực thành công!');
      router.push(`/consumer/reset-password?token=${encodeURIComponent(result.reset_token)}`);
    } catch (err: any) {
      toast.error(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      await authApi.consumerForgotPassword({ email });
      toast.success('Mã OTP mới đã được gửi.');
      setCountdown(60);
    } catch {
      toast.error('Không thể gửi lại mã. Vui lòng thử lại.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-[440px] w-full">
        <Link
          href="/consumer/forgot-password"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#4F46E5] font-medium mb-10 transition-colors"
        >
          <ArrowLeft size={16} />
          Quay lại
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-black text-[#1A1F2C] mb-3 tracking-tighter">
            Nhập mã OTP
          </h1>
          <p className="text-gray-500 text-base font-medium">
            Mã 6 chữ số đã được gửi đến{' '}
            <span className="text-[#4F46E5] font-bold">{email}</span>.
            Mã có hiệu lực trong 5 phút.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
              Mã OTP
            </label>
            <Input
              {...register('otp_code', {
                required: 'Vui lòng nhập mã OTP',
                pattern: { value: /^\d{6}$/, message: 'Mã OTP gồm 6 chữ số' },
              })}
              placeholder="000000"
              maxLength={6}
              className="bg-[#F8F9FB] border-2 border-transparent focus:border-[#4F46E5]/20 focus:bg-white h-14 rounded-2xl transition-all text-center text-2xl font-black tracking-[0.4em] px-6"
            />
            {errors.otp_code && (
              <p className="text-red-500 text-xs font-bold ml-1">{errors.otp_code.message}</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white h-14 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-2xl shadow-[#4F46E5]/30 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Đang xác thực...' : 'Xác nhận'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || countdown > 0}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#4F46E5] font-medium transition-colors disabled:opacity-40"
          >
            <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
            {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã OTP'}
          </button>
        </div>
      </div>
    </div>
  );
}
