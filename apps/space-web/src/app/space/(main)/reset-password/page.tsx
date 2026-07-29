'use client';

import { Suspense, useState, useEffect } from 'react';
import { Button } from '@shared/components/ui/button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle, Lock } from 'lucide-react';
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

const resetSchema = z
  .object({
    new_password: z.string().min(8, 'Mật khẩu ít nhất 8 ký tự'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirm_password'],
  });

type FormValues = z.infer<typeof resetSchema>;

export default function SpaceResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SpaceResetPasswordContent />
    </Suspense>
  );
}

function SpaceResetPasswordContent() {
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

  const form = useForm<FormValues>({ resolver: zodResolver(resetSchema) });

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
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-emerald-600" size={32} />
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
          <div className="bg-foreground py-8 px-10 text-center">
            <h2 className="text-background text-2xl font-bold">Đặt mật khẩu mới</h2>
            <p className="text-muted-foreground text-sm mt-1">Mật khẩu ít nhất 8 ký tự</p>
          </div>

          <div className="p-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="new_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu mới</FormLabel>
                      <FormControl>
                        <PasswordField
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          show={showNew}
                          onToggle={() => setShowNew((v) => !v)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Xác nhận mật khẩu</FormLabel>
                      <FormControl>
                        <PasswordField
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          show={showConfirm}
                          onToggle={() => setShowConfirm((v) => !v)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={loading} className="w-full h-11">
                  {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
                </Button>
              </form>
            </Form>

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

function PasswordField({
  value,
  onChange,
  show,
  onToggle,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
      <Input
        type={show ? 'text' : 'password'}
        className="h-10 pl-10 pr-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
        aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </Button>
    </div>
  );
}
