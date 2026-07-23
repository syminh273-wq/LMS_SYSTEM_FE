'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth';

type FormValues = { otp_code: string };

export default function SpaceVerifyOTPPage() {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

  useEffect(() => {
    if (!email) router.replace('/space/forgot-password');
  }, [email, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const result = await authApi.spaceVerifyOtp({ email, otp_code: data.otp_code });
      toast.success('Xác thực thành công!');
      router.push(`/space/reset-password?token=${encodeURIComponent(result.reset_token)}`);
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
      await authApi.spaceForgotPassword({ email });
      toast.success('Mã OTP mới đã được gửi.');
      setCountdown(60);
    } catch {
      toast.error('Không thể gửi lại mã. Vui lòng thử lại.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-slate-900 py-8 px-10 text-center">
            <h2 className="text-white text-2xl font-bold">Nhập mã OTP</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Mã 6 chữ số đã gửi đến <span className="text-white font-semibold">{email}</span>
            </p>
          </div>

          <div className="p-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Mã OTP (6 chữ số)</label>
                <input
                  {...register('otp_code', {
                    required: 'Vui lòng nhập mã OTP',
                    pattern: { value: /^\d{6}$/, message: 'Mã OTP gồm 6 chữ số' },
                  })}
                  maxLength={6}
                  placeholder="000000"
                  className={`block w-full py-3 border rounded-lg bg-muted/50 text-foreground text-center text-2xl font-black tracking-[0.4em] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-card transition-all ${errors.otp_code ? 'border-red-500' : 'border-border'}`}
                />
                {errors.otp_code && <p className="text-red-500 text-xs mt-1 font-medium">{errors.otp_code.message}</p>}
                <p className="text-xs text-muted-foreground mt-2">Mã có hiệu lực trong 5 phút.</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 disabled:bg-slate-400 transition-all shadow-lg active:scale-[0.98]"
              >
                {loading ? 'Đang xác thực...' : 'Xác nhận'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || countdown > 0}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors disabled:opacity-40"
              >
                <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã OTP'}
              </button>
            </div>

            <div className="mt-4 text-center">
              <Link href="/space/login" className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors">
                ← Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
