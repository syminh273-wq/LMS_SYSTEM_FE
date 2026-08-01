'use client';

import { useState, useEffect } from 'react';
import { Button } from '@shared/components/ui/button';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, RefreshCw, KeyRound } from 'lucide-react';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { toast } from 'sonner';
import { authApi } from '@/features/auth/api';

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
      const result = await authApi.verifyOtpAsConsumer({ email, otp_code: data.otp_code });
      toast.success('Xác thực thành công!');
      router.push(`/consumer/reset-password?token=${encodeURIComponent(result.reset_token)}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      await authApi.forgotPasswordAsConsumer({ email });
      toast.success('Mã OTP mới đã được gửi.');
      setCountdown(60);
    } catch {
      toast.error('Không thể gửi lại mã. Vui lòng thử lại.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-[440px] animate-fade-up">
        <Link
          href="/consumer/forgot-password"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground font-semibold mb-8 transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Quay lại
        </Link>

        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground shadow-md mb-5">
            <KeyRound size={22} strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-foreground mb-1.5 tracking-tight text-balance">
            Nhập mã OTP
          </h1>
          <p className="text-muted-foreground text-[14px]">
            Mã 6 chữ số đã được gửi đến{' '}
            <span className="text-primary font-semibold">{email}</span>.
            Mã có hiệu lực trong 5 phút.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>
              Mã OTP
            </Label>
            <Input
              {...register('otp_code', {
                required: 'Vui lòng nhập mã OTP',
                pattern: { value: /^\d{6}$/, message: 'Mã OTP gồm 6 chữ số' },
              })}
              placeholder="000000"
              maxLength={6}
              className="h-14 text-center"
            />
            {errors.otp_code && (
              <p className="text-destructive text-[12px] font-medium mt-1">{errors.otp_code.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 w-full h-11 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang xác thực...
              </>
            ) : (
              <>
                Xác nhận
                <ArrowRight size={16} strokeWidth={2.5} />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Button
            type="button"
            variant="link"
            onClick={handleResend}
            disabled={resending || countdown > 0}
            className="inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
            {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã OTP'}
          </Button>
        </div>
      </div>
    </div>
  );
}
