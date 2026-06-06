'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth';

type FormValues = { new_password: string; confirm_password: string };

export default function SpaceResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  useEffect(() => {
    if (!token) router.replace('/space/forgot-password');
  }, [token, router]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      await authApi.spaceResetPassword({
        reset_token: token,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });
      setDone(true);
      toast.success('Mật khẩu đã được cập nhật thành công!');
      setTimeout(() => router.push('/space/login'), 2000);
    } catch (err: any) {
      toast.error(err.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <div className="bg-card rounded-2xl shadow-xl p-12 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Thành công!</h2>
          <p className="text-muted-foreground text-sm">Đang chuyển đến trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-slate-900 py-8 px-10 text-center">
            <h2 className="text-white text-2xl font-bold">Đặt mật khẩu mới</h2>
            <p className="text-muted-foreground text-sm mt-1">Mật khẩu ít nhất 8 ký tự</p>
          </div>

          <div className="p-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Mật khẩu mới</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showNew ? 'text' : 'password'}
                    {...register('new_password', {
                      required: 'Vui lòng nhập mật khẩu mới',
                      minLength: { value: 8, message: 'Mật khẩu ít nhất 8 ký tự' },
                    })}
                    className={`block w-full pl-10 pr-10 py-2.5 border rounded-lg bg-muted/50 text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-card transition-all ${errors.new_password ? 'border-red-500' : 'border-border'}`}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowNew(v => !v)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground">
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.new_password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.new_password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Xác nhận mật khẩu</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    {...register('confirm_password', {
                      required: 'Vui lòng xác nhận mật khẩu',
                      validate: v => v === watch('new_password') || 'Mật khẩu xác nhận không khớp',
                    })}
                    className={`block w-full pl-10 pr-10 py-2.5 border rounded-lg bg-muted/50 text-foreground placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-card transition-all ${errors.confirm_password ? 'border-red-500' : 'border-border'}`}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground">
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirm_password && <p className="text-red-500 text-xs mt-1 font-medium">{errors.confirm_password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 disabled:bg-slate-400 transition-all shadow-lg active:scale-[0.98]"
              >
                {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
              </button>
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
