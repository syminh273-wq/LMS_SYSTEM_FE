'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, CheckCircle2, Lock } from 'lucide-react';
import { Input } from '@shared/components/ui/input';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth';
import { cn } from '@shared/lib/utils';

type FormValues = { new_password: string; confirm_password: string };

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  useEffect(() => {
    if (!token) router.replace('/consumer/forgot-password');
  }, [token, router]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>();
  const password = watch('new_password') || '';

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      await authApi.consumerResetPassword({
        reset_token: token,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });
      setDone(true);
      toast.success('Mật khẩu đã được cập nhật thành công!');
      setTimeout(() => router.push('/consumer/login'), 2000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[440px] text-center animate-scale-in">
          <div className="relative inline-block mb-5">
            <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg mx-auto">
              <CheckCircle2 className="text-white" size={40} strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 dark:text-slate-100 mb-2 tracking-tight">Thành công!</h1>
          <p className="text-slate-500 dark:text-slate-400 text-[14px]">
            Mật khẩu đã được cập nhật. Đang chuyển đến trang đăng nhập...
          </p>
        </div>
      </div>
    );
  }

  const passwordChecks = [
    { label: 'Ít nhất 8 ký tự', ok: password.length >= 8 },
    { label: 'Có chữ cái', ok: /[a-zA-Z]/.test(password) },
    { label: 'Có số hoặc ký tự đặc biệt', ok: /[\d\W]/.test(password) },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-[440px] animate-fade-up">
        <Link
          href="/consumer/forgot-password"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100 font-semibold mb-8 transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Quay lại
        </Link>

        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white shadow-md mb-5">
            <Lock size={22} strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 dark:text-slate-100 mb-1.5 tracking-tight text-balance">
            Đặt mật khẩu mới
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-[14px]">
            Mật khẩu mới phải có ít nhất 8 ký tự và bao gồm chữ cái, số.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">Mật khẩu mới</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} strokeWidth={2} />
              <Input
                type={showNew ? 'text' : 'password'}
                {...register('new_password', {
                  required: 'Vui lòng nhập mật khẩu mới',
                  minLength: { value: 8, message: 'Mật khẩu ít nhất 8 ký tự' },
                })}
                placeholder="••••••••"
                className="h-11 pl-10 pr-11 text-[14px] bg-white dark:bg-slate-900 border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-300 rounded-md transition-colors"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.new_password && (
              <p className="text-rose-600 text-[12px] font-medium mt-1">{errors.new_password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">Xác nhận mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} strokeWidth={2} />
              <Input
                type={showConfirm ? 'text' : 'password'}
                {...register('confirm_password', {
                  required: 'Vui lòng xác nhận mật khẩu',
                  validate: v => v === password || 'Mật khẩu xác nhận không khớp',
                })}
                placeholder="••••••••"
                className="h-11 pl-10 pr-11 text-[14px] bg-white dark:bg-slate-900 border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-300 rounded-md transition-colors"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-rose-600 text-[12px] font-medium mt-1">{errors.confirm_password.message}</p>
            )}
          </div>

          {password.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
              {passwordChecks.map((c) => (
                <div
                  key={c.label}
                  className={cn(
                    "flex items-center gap-1.5 text-[11.5px] font-medium",
                    c.ok ? "text-emerald-700" : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  <span
                    className={cn(
                      "w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0",
                      c.ok ? "bg-emerald-500 text-white" : "bg-slate-200"
                    )}
                  >
                    {c.ok && <CheckCircle2 size={10} strokeWidth={3} />}
                  </span>
                  <span className="truncate">{c.label}</span>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full h-11 rounded-lg font-semibold text-[14px] text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white dark:border-slate-900/30 border-t-white rounded-full animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              <>Đặt lại mật khẩu</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
