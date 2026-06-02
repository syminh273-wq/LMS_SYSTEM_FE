'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { accountService } from '@/lib/api/account';
import { ValidationException } from '@/lib/api';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';
import { ConsumerProfileDropdown } from '@/components/layout/consumer-profile-dropdown';

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
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/consumer/dashboard')}
              className="shrink-0 rounded-full hover:bg-white"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-widest text-indigo-500">Consumer</p>
              <h1 className="truncate text-2xl font-black tracking-tight text-gray-900">Settings</h1>
              <p className="text-sm font-medium text-gray-500">Quản lý bảo mật tài khoản của bạn</p>
            </div>
          </div>
          <ConsumerProfileDropdown />
        </header>

        <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white shadow-sm">
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-[320px_1fr]">
            <div className="border-b border-indigo-100 p-6 lg:border-b-0 lg:border-r">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                <ShieldCheck size={28} />
              </div>
              <h2 className="mt-5 text-xl font-black text-gray-900">Đổi mật khẩu</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-gray-500">
                Cập nhật mật khẩu định kỳ để bảo vệ tài khoản LMS. Tài khoản đăng nhập bằng Google/Gmail cần quản lý mật khẩu qua Google.
              </p>
              <div className="mt-6 space-y-3 rounded-2xl border border-indigo-100 bg-white/80 p-4">
                {passwordChecks.map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full ${item.done ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-300'}`}>
                      <CheckCircle2 size={13} />
                    </span>
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-8">
              {success && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  {success}
                </div>
              )}
              {error && (
                <div className="whitespace-pre-line rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
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
                  className="h-11 rounded-xl bg-indigo-600 px-5 font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
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
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-black uppercase tracking-widest text-gray-500">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 pr-12 text-sm font-semibold text-gray-900 outline-none transition-all placeholder:text-gray-300 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}
