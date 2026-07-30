'use client';

import { useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail } from 'lucide-react';
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

const forgotSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

type FormValues = z.infer<typeof forgotSchema>;

export default function SpaceForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

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
          <div className="bg-foreground py-8 px-10 text-center">
            <h2 className="text-background text-2xl font-bold">Quên mật khẩu</h2>
            <p className="text-muted-foreground text-sm mt-1">Nhập email để nhận mã OTP</p>
          </div>

          <div className="p-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email quản trị</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
                          <Input
                            type="email"
                            placeholder="admin@your-space.com"
                            className="h-10 pl-10 pr-3"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={loading} className="w-full h-11">
                  {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
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
