'use client';

import { useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { useForm } from 'react-hook-form';
import { consumerApi, ValidationException } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  ArrowRight,
  PartyPopper,
  Mail,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { MasterLayout, MasterBody } from '@shared/components/layout/MasterLayout';
import { cn } from '@shared/lib/utils';

type RegisterFormValues = {
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
};

function GoogleIcon() {
  return (
    <svg width='18' height='18' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path d='M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z' fill='#FFC107'/>
      <path d='M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z' fill='#FF3D00'/>
      <path d='M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.316 0-9.829-3.562-11.448-8.47l-6.522 5.025C9.505 39.556 16.227 44 24 44z' fill='#4CAF50'/>
      <path d='M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z' fill='#1976D2'/>
    </svg>
  );
}

export default function RegisterPage() {
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, watch, formState: { errors }, setError: setFormError } = useForm<RegisterFormValues>();
  const password = watch('password') || '';

  const onRegister = async (data: RegisterFormValues) => {
    setSuccess(''); setGlobalError(''); setLoading(true);
    try {
      const response = await consumerApi.auth.register(data);
      toast.success('Chúc mừng! Đăng ký tài khoản thành công.', {
        description: 'Bạn sẽ được chuyển đến trang đăng nhập trong giây lát.',
        icon: <PartyPopper className="text-success" size={20} />,
        duration: 4000,
      });
      setSuccess(response.message || 'Đăng ký thành công. Vui lòng đăng nhập.');
      setTimeout(() => router.push('/consumer/login'), 1800);
    } catch (err: unknown) {
      if (err instanceof ValidationException) {
        Object.entries(err.errors).forEach(([field, message]) => {
          setFormError(field as keyof RegisterFormValues, { type: 'server', message });
        });
        toast.error('Vui lòng kiểm tra lại thông tin đăng ký.');
      } else {
        const msg = err instanceof Error ? err.message : 'Đăng ký thất bại';
        setGlobalError(msg);
        toast.error(msg);
      }
    } finally { setLoading(false); }
  };

  const passwordChecks = [
    { label: 'Ít nhất 8 ký tự', ok: password.length >= 8 },
    { label: 'Có chữ cái', ok: /[a-zA-Z]/.test(password) },
    { label: 'Có số hoặc ký tự đặc biệt', ok: /[\d\W]/.test(password) },
  ];

  return (
    <MasterLayout footer={null}>
      <MasterBody className="min-h-screen">
        <div className="flex min-h-screen flex-col lg:flex-row bg-muted">

          {/* Right Side - Form */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-10 lg:px-16 bg-background relative">
            <div className="w-full max-w-[480px] animate-fade-up">
              <div className="mb-8 flex justify-center">
                <Image src="/logo-icon.svg" alt="LMS System" width={140} height={150} />
              </div>

              <div className="mb-7 text-center">
                <h2 className="text-3xl font-bold text-foreground mb-2 tracking-tight text-balance">
                  Đăng Ký
                </h2>
                <p className="text-muted-foreground text-[15px]">
                  Trở thành học viên của LMS System ngay hôm nay.
                </p>
              </div>

              {globalError && (
                <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-down">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                  <span className="font-medium">{globalError}</span>
                </div>
              )}

              {success && (
                <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success animate-fade-down">
                  <CheckCircle2 size={16} className="text-success mt-0.5 shrink-0" />
                  <span className="font-medium">{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onRegister)} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Họ</Label>
                    <Input
                      {...register('last_name', { required: 'Bắt buộc' })}
                      placeholder="Nguyễn"
                      className="h-11"
                    />
                    {errors.last_name && <p className="text-destructive text-xs font-medium">{errors.last_name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tên</Label>
                    <Input
                      {...register('first_name', { required: 'Bắt buộc' })}
                      placeholder="An"
                      className="h-11"
                    />
                    {errors.first_name && <p className="text-destructive text-xs font-medium">{errors.first_name.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} strokeWidth={2} />
                    <Input
                      {...register('email', { required: 'Bắt buộc' })}
                      type="email"
                      autoComplete="email"
                      placeholder="name@company.com"
                      className="h-11 pl-10"
                    />
                  </div>
                  {errors.email && <p className="text-destructive text-xs font-medium">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Mật khẩu</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} strokeWidth={2} />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        {...register('password', { required: 'Bắt buộc', minLength: { value: 8, message: 'Tối thiểu 8 ký tự' } })}
                        placeholder="••••••••"
                        className="h-11 pl-10 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </Button>
                    </div>
                    {errors.password && <p className="text-destructive text-xs font-medium">{errors.password.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label>Xác nhận</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} strokeWidth={2} />
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        {...register('confirm_password', {
                          required: 'Bắt buộc',
                          validate: (val) => val === password || 'Mật khẩu không khớp',
                        })}
                        placeholder="••••••••"
                        className="h-11 pl-10 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </Button>
                    </div>
                    {errors.confirm_password && <p className="text-destructive text-xs font-medium">{errors.confirm_password.message}</p>}
                  </div>
                </div>

                {password.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
                    {passwordChecks.map((c) => (
                      <div
                        key={c.label}
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-medium",
                          c.ok ? "text-success" : "text-muted-foreground"
                        )}
                      >
                        <span
                          className={cn(
                            "w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors shrink-0",
                            c.ok ? "bg-success text-white" : "bg-muted"
                          )}
                        >
                          {c.ok && <CheckCircle2 size={10} strokeWidth={3} />}
                        </span>
                        {c.label}
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full h-11 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang khởi tạo...
                    </>
                  ) : (
                    <>
                      Tạo tài khoản
                      <ArrowRight size={16} strokeWidth={2.5} />
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Hoặc
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                  window.location.href = `${backendUrl}/api/v1/consumer/account/auth/google/login/`;
                }}
                className="w-full h-11 flex items-center justify-center gap-2.5"
              >
                <GoogleIcon />
                Tiếp tục với Google
              </Button>

              <Link
                href="/consumer/login"
                className="mt-6 w-full h-11 rounded-lg font-semibold text-sm text-primary bg-background border border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-colors flex items-center justify-center gap-2"
              >
                Đã có tài khoản? Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </MasterBody>
    </MasterLayout>
  );
}
