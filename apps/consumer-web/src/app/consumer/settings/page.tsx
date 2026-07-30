'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { accountService } from '@/lib/api/account';
import { ValidationException } from '@/lib/api';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';
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
  const [hasPassword, setHasPassword] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    accountService.getProfile()
      .then((profile) => setHasPassword(Boolean(profile.has_password)))
      .catch((err) => console.error('Failed to fetch profile:', err));
  }, [isAuthenticated]);

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

    if (hasPassword && !form.current_password) {
      setError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (!form.new_password || !form.confirm_password) {
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
    <div className="min-h-screen bg-muted">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/consumer/dashboard')}
              className="shrink-0 h-9 w-9"
            >
              <ArrowLeft size={17} />
            </Button>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10.5px] font-semibold uppercase tracking-wider mb-1">
                Consumer
              </div>
              <h1 className="truncate text-2xl sm:text-[26px] font-bold tracking-tight text-foreground">
                Cài đặt
              </h1>
              <p className="text-[13px] text-muted-foreground mt-0.5">Quản lý bảo mật tài khoản của bạn</p>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-border bg-card card-elevated">
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
            <div className="border-b border-border p-6 lg:border-b-0 lg:border-r bg-muted">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                <ShieldCheck size={22} strokeWidth={2.2} />
              </div>
              <h2 className="mt-4 text-[17px] font-bold text-foreground">Đổi mật khẩu</h2>
              <p className="mt-2 text-[12.5px] text-muted-foreground leading-relaxed">
                Cập nhật mật khẩu định kỳ để bảo vệ tài khoản LMS. Tài khoản đăng nhập bằng Google/Gmail cần quản lý qua Google.
              </p>
              <div className="mt-5 space-y-2.5 rounded-xl border border-border bg-card p-4">
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Yêu cầu mật khẩu</p>
                {passwordChecks.map(item => (
                  <div key={item.label} className="flex items-center gap-2 text-[12.5px] font-medium">
                    <span className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full transition-colors",
                      item.done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      <CheckCircle2 size={11} strokeWidth={3} />
                    </span>
                    <span className={cn("transition-colors", item.done ? "text-foreground" : "text-muted-foreground")}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6 sm:p-8">
              {success && (
                <div className="flex items-start gap-2.5 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-[13px] font-medium text-success animate-fade-down">
                  <CheckCircle2 size={15} className="text-success mt-0.5 shrink-0" />
                  {success}
                </div>
              )}
              {error && (
                <div className="whitespace-pre-line flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] font-medium text-destructive animate-fade-down">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                  {error}
                </div>
              )}

              {!hasPassword && (
                <div className="rounded-lg border border-border bg-muted px-4 py-3 text-[12.5px] font-medium text-muted-foreground">
                  Tài khoản của bạn chưa đặt mật khẩu (đăng nhập qua Google). Đặt mật khẩu mới bên dưới mà không cần mật khẩu hiện tại.
                </div>
              )}
              {hasPassword && (
                <PasswordField
                  id="currentPassword"
                  label="Mật khẩu hiện tại"
                  value={form.current_password}
                  visible={visible.current_password}
                  onToggle={() => toggleVisible('current_password')}
                  onChange={(value) => updateField('current_password', value)}
                />
              )}
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
                  className="h-10"
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
      <Label htmlFor={id}>
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 pr-11"
          autoComplete="off"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center"
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </Button>
      </div>
    </div>
  );
}
