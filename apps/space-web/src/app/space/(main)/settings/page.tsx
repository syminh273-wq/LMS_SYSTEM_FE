'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Palette,
  Save,
  Check,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/components/ui/form';
import { Label } from '@shared/components/ui/label';
import { LanguageSwitcher } from '@shared/components/LanguageSwitcher';
import { useTranslation } from '@shared/components/LocaleProvider';
import { toast } from 'sonner';
import { spaceApi } from '@/lib/api';
import { accountService } from '@/lib/api/account';
import { useDispatch } from 'react-redux';
import { setSettings as setGlobalSettings } from '@/lib/redux/spaceSlice';

type PasswordForm = { current_password: string; new_password: string; confirm_password: string };

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    new_password: z.string().min(8, 'Mật khẩu mới tối thiểu 8 ký tự'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirm_password'],
  });

export default function SettingsPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [themeColor, setThemeColor] = useState('#4f46e5');
  const [spaceProfile, setSpaceProfile] = useState<Record<string, any>>({});

  const [pwVisible, setPwVisible] = useState({ current_password: false, new_password: false, confirm_password: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await spaceApi.getSettings();
        if (data.space_profile?.theme_color) {
          setThemeColor(data.space_profile.theme_color);
        }
        setSpaceProfile(data.space_profile || {});
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        space_profile: {
          ...spaceProfile,
          theme_color: themeColor,
        },
      };
      const updatedData = await spaceApi.updateSettings(payload);

      dispatch(setGlobalSettings(updatedData));

      toast.success(t('settings.space.profile.saved_toast'));
    } catch (err) {
      toast.error(t('settings.space.profile.save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = passwordForm.handleSubmit(async (data) => {
    setPwError('');
    setPwSuccess('');
    setPwLoading(true);
    try {
      await accountService.changePassword(data);
      setPwSuccess(t('settings.space.password.success'));
      passwordForm.reset();
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : t('settings.space.password.error_fallback'));
    } finally {
      setPwLoading(false);
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 relative">
      {loading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-3xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary-brand border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-primary-brand">{t('settings.space.loading')}</p>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">{t('settings.space.title')}</h2>
          <p className="text-muted-foreground font-medium mt-1">{t('settings.space.subtitle')}</p>
        </div>
      </div>

      <Card className="border-border rounded-3xl shadow-sm overflow-hidden max-w-3xl">
        <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-brand-light flex items-center justify-center text-primary-brand">
              <Palette size={24} />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">{t('settings.space.profile.theme_color_label')}</CardTitle>
              <CardDescription className="font-medium">{t('settings.space.profile.custom_color_hint')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-4">
            <Label>{t('settings.space.profile.theme_color_label')}</Label>
            <span className="text-xs font-mono font-bold text-primary-brand bg-primary-brand-light px-2 py-1 rounded-md border border-primary-brand-muted uppercase">{themeColor}</span>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            {['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'].map((color) => (
              <Button
                key={color}
                variant="ghost"
                onClick={() => setThemeColor(color)}
                className={`w-12 h-12 border-2 ${themeColor === color ? 'border-primary-brand ring-2 ring-primary-brand/20' : 'border-white ring-1 ring-border'}`}
                style={{ backgroundColor: color }}
              >
                {themeColor === color && <Check size={18} className="text-white mx-auto" />}
              </Button>
            ))}

            <div className="relative group">
              <Input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <Button variant="ghost" className="w-12 h-12 border-2 border-dashed border-border text-muted-foreground group-hover:bg-muted/50 group-hover:border-primary-brand group-hover:text-primary-brand">
                <Palette size={20} />
              </Button>
            </div>

            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight ml-2">{t('settings.space.profile.custom_color_hint')}</p>
          </div>

          <div className="pt-8 mt-8 border-t border-border/50">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <Label>{t('settings.space.profile.language_label')}</Label>
                <p className="text-xs text-muted-foreground font-medium">{t('settings.space.profile.language_hint')}</p>
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        </CardContent>
        <div className="p-6 bg-muted/20 border-t border-border flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="h-11 gap-2"
          >
            {isSaving ? <Check size={16} className="animate-pulse" /> : <Save size={16} />}
            {t('settings.space.profile.save')}
          </Button>
        </div>
      </Card>

      <Card className="border-border rounded-3xl shadow-sm max-w-3xl">
        <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-brand-light flex items-center justify-center text-primary-brand">
              <KeyRound size={24} />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">{t('settings.space.security.change_password_title')}</CardTitle>
              <CardDescription className="font-medium">{t('settings.space.security.change_password_desc')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...passwordForm}>
            <form onSubmit={handleChangePassword} className="space-y-5">
              {(['current_password', 'new_password', 'confirm_password'] as const).map((field) => {
                const labels: Record<typeof field, string> = {
                  current_password: t('settings.space.security.current_password_label'),
                  new_password: t('settings.space.security.new_password_label'),
                  confirm_password: t('settings.space.security.confirm_password_label'),
                };
                return (
                  <FormField
                    key={field}
                    control={passwordForm.control}
                    name={field}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>{labels[field]}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={pwVisible[field] ? 'text' : 'password'}
                              className="h-12 pr-12"
                              value={f.value ?? ''}
                              onChange={(e) => {
                                f.onChange(e.target.value);
                                setPwError('');
                                setPwSuccess('');
                              }}
                              onBlur={f.onBlur}
                              name={f.name}
                              ref={f.ref}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setPwVisible((prev) => ({ ...prev, [field]: !prev[field] }))}
                              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {pwVisible[field] ? <EyeOff size={16} /> : <Eye size={16} />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                );
              })}

              {pwError && (
                <p className="text-sm text-destructive font-medium bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3">
                  {pwError}
                </p>
              )}
              {pwSuccess && (
                <p className="text-sm text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-2">
                  <Check size={16} />
                  {pwSuccess}
                </p>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={pwLoading}
                  className="h-11 gap-2"
                >
                  {pwLoading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  {t('settings.space.security.change_password_submit')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
