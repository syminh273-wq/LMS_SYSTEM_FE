'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Input } from '@shared/components/ui/input';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth';

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
    } catch (err: any) {
      toast.error(err.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="max-w-[440px] w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-green-600" size={40} />
          </div>
          <h1 className="text-3xl font-black text-[#1A1F2C] mb-3 tracking-tighter">Thành công!</h1>
          <p className="text-gray-500 text-base font-medium">
            Mật khẩu đã được cập nhật. Đang chuyển đến trang đăng nhập...
          </p>
        </div>
      </div>
    );
  }

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
            Đặt mật khẩu mới
          </h1>
          <p className="text-gray-500 text-base font-medium">
            Mật khẩu mới phải có ít nhất 8 ký tự.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
              Mật khẩu mới
            </label>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                {...register('new_password', {
                  required: 'Vui lòng nhập mật khẩu mới',
                  minLength: { value: 8, message: 'Mật khẩu ít nhất 8 ký tự' },
                })}
                placeholder="••••••••"
                className="bg-[#F8F9FB] border-2 border-transparent focus:border-[#4F46E5]/20 focus:bg-white h-14 rounded-2xl pr-14 transition-all text-base font-medium px-6"
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#4F46E5] transition-colors"
              >
                {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.new_password && (
              <p className="text-red-500 text-xs font-bold ml-1">{errors.new_password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                {...register('confirm_password', {
                  required: 'Vui lòng xác nhận mật khẩu',
                  validate: v => v === watch('new_password') || 'Mật khẩu xác nhận không khớp',
                })}
                placeholder="••••••••"
                className="bg-[#F8F9FB] border-2 border-transparent focus:border-[#4F46E5]/20 focus:bg-white h-14 rounded-2xl pr-14 transition-all text-base font-medium px-6"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#4F46E5] transition-colors"
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-red-500 text-xs font-bold ml-1">{errors.confirm_password.message}</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white h-14 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-2xl shadow-[#4F46E5]/30 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
