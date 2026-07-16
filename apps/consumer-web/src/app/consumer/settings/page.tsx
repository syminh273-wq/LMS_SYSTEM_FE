'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { accountService } from '@/lib/api/account';
import { ValidationException } from '@/lib/api';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';
import { ConsumerProfileDropdown } from '@/components/layout/consumer-profile-dropdown';
import { cn } from '@shared/lib/utils';

type PasswordForm = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

type VisibleFields = Record<keyof PasswordForm, boolean>;

const EMPTY_FORM: PasswordForm = {
  current_password: '',
  new_password: '',
  confirm_password: '',
};

function getFriendlyError(err: unknown) {
  const fallback = 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại thông tin.';

  if (err instanceof ValidationException) {
    const message = Object.values(err.errors).filter(Boolean).join('\n');
    return normalizeGooglePasswordMessage(message || fallback);
  }

  if (err instanceof Error) {
    return normalizeGooglePasswordMessage(err.message || fallback);
  }

  return fallback;
}

function normalizeGooglePasswordMessage(message: string) {
  const normalized = message.toLowerCase();
  const isGoogleAccount =
    normalized.includes('google') ||
    normalized.includes('gmail') ||
    normalized.includes('oauth') ||
    normalized.includes('social');

  if (isGoogleAccount) {
    return 'Tài khoản của bạn đăng nhập bằng Google/Gmail nên không thể đổi mật khẩu tại đây. Vui lòng quản lý mật khẩu trong tài khoản Google của bạn.';
  }

  return message;
}

export default function ConsumerSettingsPage() {
  const router = useRouter();
  const { isAuthenticated, mounted } = useRequireAuth();
  const [form, setForm] = useState<PasswordForm>(EMPTY_FORM);
  const [visible, setVisible] = useState<VisibleFields>({
    current_password: false,
    new_password: false,
    confirm_password: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  if (!mounted || !isAuthenticated) return null;

  const passwordChecks = [
    { label: 'Ít nhất 8 ký tự', done: form.new_password.length >= 8 },
    { label: 'Có chữ cái', done: /[a-zA-Z]/.test(form.new_password) },
    { label: 'Có số hoặc ký tự đặc biệt', done: /[\d\W]/.test(form.new_password) },
  ];

  const updateField = (field: keyof PasswordForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSuccess('');
    setError('');
  };

  const toggleVisible = (field: keyof PasswordForm) => {
    setVisible(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess('');
    setError('');

    if (!form.current_password || !form.new_password || !form.confirm_password) {
      setError('Vui lòng nhập đầy đủ các trường mật khẩu.');
      return;
    }

    if (form.new_password.length < 8) {
      setError('Mật khẩu mới cần có ít nhất 8 ký tự.');
      return;
    }

    if (form.new_password !== form.confirm_password) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }

    setLoading(true);
    try {
      await accountService.changePassword(form);
      setForm(EMPTY_FORM);
      setSuccess('Đã đổi mật khẩu thành công.');
    } catch (err: unknown) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/consumer/dashboard')}
              className="shrink-0 h-9 w-9 rounded-lg hover:bg-white"
            >
              <ArrowLeft size={17} />
            </Button>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10.5px] font-semibold uppercase tracking-wider mb-1">
                Consumer
              </div>
              <h1 className="truncate text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900">
                Cài đặt
              </h1>
              <p className="text-[13px] text-slate-500 mt-0.5">Quản lý bảo mật tài khoản của bạn</p>
            </div>
          </div>
          <ConsumerProfileDropdown />
        </header>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white card-elevated">
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
            <div className="border-b border-slate-200 p-6 lg:border-b-0 lg:border-r bg-slate-50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                <ShieldCheck size={22} strokeWidth={2.2} />
              </div>
              <h2 className="mt-4 text-[17px] font-bold text-slate-900">Đổi mật khẩu</h2>
              <p className="mt-2 text-[12.5px] text-slate-500 leading-relaxed">
                Cập nhật mật khẩu định kỳ để bảo vệ tài khoản LMS. Tài khoản đăng nhập bằng Google/Gmail cần quản lý qua Google.
              </p>
              <div className="mt-5 space-y-2.5 rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Yêu cầu mật khẩu</p>
                {passwordChecks.map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-[12.5px] font-medium">
                    <span className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full transition-colors",
                      item.done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                    )}>
                      <CheckCircle2 size={11} strokeWidth={3} />
                    </span>
                    <span className={cn("transition-colors", item.done ? "text-slate-900" : "text-slate-500")}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6 sm:p-8">
              {success && (
                <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-medium text-emerald-700 animate-fade-down">
                  <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 shrink-0" />
                  {success}
                </div>
              )}
              {error && (
                <div className="whitespace-pre-line flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] font-medium text-rose-700 animate-fade-down">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  {error}
                </div>
              )}

              <PasswordField
                id="currentPassword"
                label="Mật khẩu hiện tại"
                value={form.current_password}
                visible={visible.current_password}
                onToggle={() => toggleVisible('current_password')}
                onChange={(value) => updateField('current_password', value)}
              />
              <PasswordField
                id="newPassword"
                label="Mật khẩu mới"
                value={form.new_password}
                visible={visible.new_password}
                onToggle={() => toggleVisible('new_password')}
                onChange={(value) => updateField('new_password', value)}
              />
              <PasswordField
                id="confirmPassword"
                label="Xác nhận mật khẩu mới"
                value={form.confirm_password}
                visible={visible.confirm_password}
                onToggle={() => toggleVisible('confirm_password')}
                onChange={(value) => updateField('confirm_password', value)}
              />

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-10 rounded-lg bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-700"
                >
                  {loading ? <Loader2 size={15} className="animate-spin mr-2" /> : <KeyRound size={15} className="mr-2" />}
                  {loading ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
                </Button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  visible,
  onToggle,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  onToggle: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[12px] font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white px-4 pr-11 text-[13.5px] font-medium text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );
}
