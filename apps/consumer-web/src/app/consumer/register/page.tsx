'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { consumerApi, ValidationException } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  ArrowRight,
  PartyPopper,
  Sparkles,
  Mail,
  Lock,
  User as UserIcon,
  CheckCircle2,
} from 'lucide-react';
import { Input } from '@shared/components/ui/input';
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
        icon: <PartyPopper className="text-emerald-500" size={20} />,
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
        <div className="flex min-h-screen flex-col lg:flex-row bg-slate-50 dark:bg-slate-950">

          {/* Left Side - Hero */}
          <div className="relative hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between overflow-hidden bg-indigo-600 p-10 xl:p-16">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-indigo-500/40 blur-3xl" />
            <div className="absolute -bottom-32 -left-10 w-72 h-72 rounded-full bg-sky-500/30 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-md">
                  <Sparkles size={18} className="text-indigo-600" strokeWidth={2.5} />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">EduSphere</span>
              </div>
            </div>

            <div className="relative space-y-7">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide text-white">
                <Sparkles size={12} />
                GIA NHẬP 10.000+ HỌC VIÊN
              </div>

              <h1 className="text-5xl xl:text-6xl font-bold leading-[1.05] text-white tracking-tight text-balance">
                Bắt đầu hành trình vươn tầm.
              </h1>

              <p className="text-indigo-100 text-base xl:text-lg max-w-md leading-relaxed">
                Gia nhập cộng đồng người học tinh hoa và trải nghiệm nền tảng giáo dục chuẩn quốc tế.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  { icon: ShieldCheck, title: 'Bảo mật chuẩn quốc tế', desc: 'Mã hóa end-to-end' },
                  { icon: Zap, title: 'Trải nghiệm mượt mà', desc: 'Tối ưu cho mọi thiết bị' },
                  { icon: Sparkles, title: 'Cá nhân hoá lộ trình', desc: 'AI gợi ý bài học phù hợp' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div
                    key={title}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <Icon className="text-white" size={17} strokeWidth={2.2} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-white">{title}</p>
                      <p className="text-xs text-indigo-100">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex items-center gap-6 text-xs text-indigo-100">
              <span>© 2026 EduSphere</span>
              <span>·</span>
              <span>Điều khoản</span>
              <span>·</span>
              <span>Bảo mật</span>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-10 lg:px-16 bg-white dark:bg-slate-950 relative">
            <div className="absolute top-6 right-6 sm:top-8 sm:right-10 text-sm text-slate-600 dark:text-slate-400">
              Đã có tài khoản?{' '}
              <Link href="/consumer/login" className="text-indigo-600 font-semibold hover:underline dark:text-indigo-400">
                Đăng nhập
              </Link>
            </div>

            <div className="w-full max-w-[480px] animate-fade-up">
              <div className="lg:hidden mb-8 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <Sparkles size={18} className="text-white" strokeWidth={2.5} />
                </div>
                <span className="text-xl font-bold text-slate-900 tracking-tight dark:text-white">EduSphere</span>
              </div>

              <div className="mb-7">
                <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight dark:text-white text-balance">
                  Tạo tài khoản
                </h2>
                <p className="text-slate-600 text-[15px] dark:text-slate-400">
                  Trở thành học viên của EduSphere ngay hôm nay.
                </p>
              </div>

              {globalError && (
                <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 animate-fade-down dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span className="font-medium">{globalError}</span>
                </div>
              )}

              {success && (
                <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 animate-fade-down dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-300">
                  <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                  <span className="font-medium">{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onRegister)} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Họ</label>
                    <Input
                      {...register('last_name', { required: 'Bắt buộc' })}
                      placeholder="Nguyễn"
                      className="h-11 text-sm bg-white border-slate-300 rounded-lg focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:bg-slate-900 dark:border-slate-700"
                    />
                    {errors.last_name && <p className="text-rose-600 text-xs font-medium">{errors.last_name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tên</label>
                    <Input
                      {...register('first_name', { required: 'Bắt buộc' })}
                      placeholder="An"
                      className="h-11 text-sm bg-white border-slate-300 rounded-lg focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:bg-slate-900 dark:border-slate-700"
                    />
                    {errors.first_name && <p className="text-rose-600 text-xs font-medium">{errors.first_name.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} strokeWidth={2} />
                    <Input
                      {...register('email', { required: 'Bắt buộc' })}
                      type="email"
                      autoComplete="email"
                      placeholder="name@company.com"
                      className="h-11 pl-10 text-sm bg-white border-slate-300 rounded-lg focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:bg-slate-900 dark:border-slate-700"
                    />
                  </div>
                  {errors.email && <p className="text-rose-600 text-xs font-medium">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mật khẩu</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} strokeWidth={2} />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        {...register('password', { required: 'Bắt buộc', minLength: { value: 8, message: 'Tối thiểu 8 ký tự' } })}
                        placeholder="••••••••"
                        className="h-11 pl-10 pr-10 text-sm bg-white border-slate-300 rounded-lg focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:bg-slate-900 dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-rose-600 text-xs font-medium">{errors.password.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Xác nhận</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} strokeWidth={2} />
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        {...register('confirm_password', {
                          required: 'Bắt buộc',
                          validate: (val) => val === password || 'Mật khẩu không khớp',
                        })}
                        placeholder="••••••••"
                        className="h-11 pl-10 pr-10 text-sm bg-white border-slate-300 rounded-lg focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 dark:bg-slate-900 dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {errors.confirm_password && <p className="text-rose-600 text-xs font-medium">{errors.confirm_password.message}</p>}
                  </div>
                </div>

                {password.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
                    {passwordChecks.map((c) => (
                      <div
                        key={c.label}
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-medium",
                          c.ok ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"
                        )}
                      >
                        <span
                          className={cn(
                            "w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors shrink-0",
                            c.ok ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700"
                          )}
                        >
                          {c.ok && <CheckCircle2 size={10} strokeWidth={3} />}
                        </span>
                        {c.label}
                      </div>
                    ))}
                  </div>
                )}

                <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed dark:text-slate-400">
                    Tôi đồng ý với{' '}
                    <Link href="#" className="text-slate-900 hover:underline font-medium dark:text-slate-200">
                      Điều khoản dịch vụ
                    </Link>{' '}
                    và{' '}
                    <Link href="#" className="text-slate-900 hover:underline font-medium dark:text-slate-200">
                      Chính sách bảo mật
                    </Link>
                    .
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full h-11 rounded-lg font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
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
                </button>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs uppercase tracking-wider text-slate-500 font-semibold dark:bg-slate-950">
                    Hoặc
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                  window.location.href = `${backendUrl}/api/v1/consumer/account/auth/google/login/`;
                }}
                className="w-full h-11 rounded-lg text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-colors flex items-center justify-center gap-2.5 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <GoogleIcon />
                Tiếp tục với Google
              </button>
            </div>
          </div>
        </div>
      </MasterBody>
    </MasterLayout>
  );
}
