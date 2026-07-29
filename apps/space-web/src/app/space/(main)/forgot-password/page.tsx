'use client';

import { useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth';
import { Label } from '@shared/components/ui/label';

type FormValues = { email: string };

export default function SpaceForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      await authApi.spaceForgotPassword({ email: data.email });
      toast.success('Mã OTP đã được gửi về email của bạn.');
      router.push(`/space/verify-otp?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      toast.error(err.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-slate-900 py-8 px-10 text-center">
            <h2 className="text-white text-2xl font-bold">Quên mật khẩu</h2>
            <p className="text-muted-foreground text-sm mt-1">Nhập email để nhận mã OTP</p>
          </div>

          <div className="p-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label className="block text-sm font-semibold text-foreground mb-2">Email quản trị</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    {...register('email', { required: 'Vui lòng nhập email' })}
                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg bg-muted/50 text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-card transition-all ${errors.email ? 'border-red-500' : 'border-border'}`}
                    placeholder="admin@your-space.com"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 disabled:bg-slate-400 transition-all shadow-lg active:scale-[0.98]"
              >
                {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
              </Button>
            </form>

            <div className="mt-6 text-center">
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
