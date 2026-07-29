'use client';

import { Suspense, useState, useEffect } from 'react';
import { Button } from '@shared/components/ui/button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth';
import { Input } from '@shared/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/components/ui/form';

const otpSchema = z.object({
  otp_code: z.string().regex(/^\d{6}$/, 'Mã OTP gồm 6 chữ số'),
});

type FormValues = z.infer<typeof otpSchema>;

export default function SpaceVerifyOTPPage() {
  return (
    <Suspense fallback={null}>
      <SpaceVerifyOTPPageContent />
    </Suspense>
  );
}

function SpaceVerifyOTPPageContent() {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const form = useForm<FormValues>({ resolver: zodResolver(otpSchema) });

  useEffect(() => {
    if (!email) router.replace('/space/forgot-password');
  }, [email, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
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
          <div className="bg-foreground py-8 px-10 text-center">
            <h2 className="text-background text-2xl font-bold">Nhập mã OTP</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Mã 6 chữ số đã gửi đến <span className="text-background font-semibold">{email}</span>
            </p>
          </div>

          <div className="p-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="otp_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mã OTP (6 chữ số)</FormLabel>
                      <FormControl>
                        <Input
                          maxLength={6}
                          placeholder="000000"
                          className="h-12 text-center text-2xl font-black tracking-[0.4em] placeholder:text-muted-foreground/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground mt-2">Mã có hiệu lực trong 5 phút.</p>
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={loading} className="w-full h-11">
                  {loading ? 'Đang xác thực...' : 'Xác nhận'}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResend}
                disabled={resending || countdown > 0}
                className="text-muted-foreground hover:text-foreground"
              >
                <RefreshCw size={14} className={`mr-1.5 ${resending ? 'animate-spin' : ''}`} />
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã OTP'}
              </Button>
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
