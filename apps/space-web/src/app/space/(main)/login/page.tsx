'use client';

import { Suspense, useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { useForm } from 'react-hook-form';
import { spaceApi, ValidationException } from '@/lib/api';
import { accountService } from '@/lib/api/account';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setProfile } from '@/lib/redux/userSlice';
import {
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  Lock,
} from 'lucide-react';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { MasterLayout, MasterBody } from '@shared/components/layout/MasterLayout';
import { useTranslation } from '@shared/components/LocaleProvider';

type LoginFormValues = {
  email: string;
  password: string;
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

export default function SpaceLoginPage() {
  return (
    <Suspense fallback={null}>
      <SpaceLoginContent />
    </Suspense>
  );
}

function SpaceLoginContent() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const [globalError, setGlobalError] = useState(() => {
    const err = searchParams.get('error');
    return err ? decodeURIComponent(err) : '';
  });
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const { register, handleSubmit, formState: { errors }, setError: setFormError } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' }
  });

  const handleApiError = (err: unknown) => {
    if (err instanceof ValidationException) {
      Object.entries(err.errors).forEach(([field, message]) => {
        setFormError(field as keyof LoginFormValues, { type: 'server', message });
      });
      toast.error('Vui lòng kiểm tra lại thông tin đăng nhập.');
    } else {
      const message = err instanceof Error ? err.message : t('auth.login.login_failed');
      setGlobalError(message);
      toast.error(message);
    }
  };

  const onLogin = async (data: LoginFormValues) => {
    setGlobalError('');
    setLoading(true);
    try {
      const response = await spaceApi.auth.login({ email: data.email, password: data.password });
      localStorage.setItem('accessToken', response.access);
      localStorage.setItem('refreshToken', response.refresh);
      localStorage.setItem('userType', 'space');

      const profile = await accountService.getProfile();
      dispatch(setProfile(profile));

      router.push('/space');
    } catch (err: unknown) {
      handleApiError(err);
    } finally { setLoading(false); }
  };

  return (
    <MasterLayout footer={null}>
      <MasterBody className="min-h-screen">
        <div className="flex min-h-screen flex-col lg:flex-row bg-muted">

          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-10 lg:px-16 bg-background relative">
            <div className="w-full max-w-[420px] animate-fade-up">
              <div className="mb-8 flex justify-center">
                <Image src="/logo-icon.svg" alt="LMS System" width={140} height={150} />
              </div>

              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-foreground mb-2 tracking-tight text-balance">
                  Đăng Nhập
                </h2>
                <p className="text-muted-foreground text-[15px]">
                  Đăng nhập để quản lý không gian đào tạo của bạn.
                </p>
              </div>

              {globalError && (
                <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-down">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                  <span className="font-medium">{globalError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onLogin)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-foreground">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} strokeWidth={2} />
                    <Input
                      {...register('email', { required: 'Vui lòng nhập email' })}
                      type="email"
                      autoComplete="email"
                      placeholder="name@company.com"
                      className="h-11 pl-10 pr-4 text-sm bg-background border-border rounded-lg focus:border-primary-brand focus:ring-2 focus:ring-primary-brand/20 transition-colors"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-destructive text-xs font-medium mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-foreground">
                      Mật khẩu
                    </Label>
                    <Link
                      href="/space/forgot-password"
                      className="text-xs font-medium text-primary-brand hover:underline"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} strokeWidth={2} />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      {...register('password', { required: 'Vui lòng nhập mật khẩu' })}
                      placeholder="••••••••"
                      className="h-11 pl-10 pr-11 text-sm bg-background border-border rounded-lg focus:border-primary-brand focus:ring-2 focus:ring-primary-brand/20 transition-colors"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-xs font-medium mt-1">{errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xác thực...
                    </>
                  ) : (
                    <>
                      Đăng nhập
                      <ArrowRight size={16} strokeWidth={2.5} />
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Hoặc tiếp tục với
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                  window.location.href = `${backendUrl}/api/v1/space/account/auth/google/login/`;
                }}
                className="w-full h-11 gap-2.5"
              >
                <GoogleIcon />
                Tiếp tục với Google
              </Button>

              <Link
                href="/space/register"
                className="mt-6 w-full h-11 rounded-lg font-semibold text-sm text-primary-brand bg-background border border-primary-brand-muted hover:bg-primary-brand-light hover:border-primary-brand transition-colors flex items-center justify-center gap-2"
              >
                Chưa có Space? Đăng ký
              </Link>
            </div>
          </div>
        </div>
      </MasterBody>
    </MasterLayout>
  );
}
