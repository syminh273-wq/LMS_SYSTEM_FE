'use client';

import { useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
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
    <div className="min-h-screen bg-muted flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-[440px] animate-fade-up">
        <Link
          href="/consumer/login"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground font-semibold mb-8 transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Quay lại đăng nhập
        </Link>

        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white shadow-md mb-5">
            <ShieldCheck size={22} strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-foreground mb-1.5 tracking-tight text-balance">
            Quên mật khẩu?
          </h1>
          <p className="text-muted-foreground text-[14px]">
            Nhập email tài khoản, chúng tôi sẽ gửi mã OTP để xác thực.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-foreground">
              Địa chỉ Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} strokeWidth={2} />
              <Input
                {...register('email', { required: 'Vui lòng nhập email' })}
                type="email"
                placeholder="name@company.com"
                className="h-11 pl-10 text-[14px] bg-card border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
              />
            </div>
            {errors.email && (
              <p className="text-destructive text-[12px] font-medium mt-1">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 w-full h-11 rounded-lg font-semibold text-[14px] text-white bg-primary hover:bg-primary shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
          </Button>
        </form>
      </div>
    </div>
  );
}
