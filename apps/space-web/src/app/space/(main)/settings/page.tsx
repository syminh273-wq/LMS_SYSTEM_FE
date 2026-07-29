'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2,
  ShieldCheck,
  Settings2,
  Bell,
  Save,
  Upload,
  Globe,
  Palette,
  Camera,
  Lock,
  ShieldAlert,
  Users,
  Check,
  Eye,
  EyeOff,
  KeyRound,
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
import { Textarea } from '@shared/components/ui/textarea';
import { LanguageSwitcher } from '@shared/components/LanguageSwitcher';
import { useTranslation } from '@shared/components/LocaleProvider';
import { toast } from 'sonner';
import { spaceApi } from '@/lib/api';
import { accountService } from '@/lib/api/account';
import { useDispatch } from 'react-redux';
import { setSettings as setGlobalSettings, setThemeColor as setGlobalThemeColor } from '@/lib/redux/spaceSlice';

type SettingSection = 'profile' | 'security' | 'classrooms' | 'notifications';

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
  const [activeSection, setActiveSection] = useState<SettingSection>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [themeColor, setThemeColor] = useState('#4f46e5');

  const [pwVisible, setPwVisible] = useState({ current_password: false, new_password: false, confirm_password: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  });

  const [settings, setSettings] = useState<Record<string, any>>({
    space_profile: {},
    security_config: {},
    classroom_defaults: {
      features: []
    },
    notification_prefs: {
      web: {},
      email: {}
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await spaceApi.getSettings();
        if (Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }));
          if (data.space_profile?.theme_color) {
            setThemeColor(data.space_profile.theme_color);
          }
        }
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
        ...settings,
        space_profile: {
          ...settings.space_profile,
          theme_color: themeColor
        }
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

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
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

  const menuItems = [
    { id: 'profile', label: t('settings.space.nav.profile'), icon: Building2 },
    { id: 'security', label: t('settings.space.nav.security'), icon: ShieldCheck },
    { id: 'classrooms', label: t('settings.space.nav.classrooms'), icon: Settings2 },
    { id: 'notifications', label: t('settings.space.nav.notifications'), icon: Bell },
  ] as const;

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

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? 'default' : 'ghost'}
              onClick={() => setActiveSection(item.id as SettingSection)}
              className="w-full justify-start gap-3"
            >
              <item.icon size={20} />
              {item.label}
            </Button>
          ))}
        </aside>

        <main className="lg:col-span-9 space-y-6">
          {activeSection === 'profile' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <Card className="border-border rounded-3xl shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-brand-light flex items-center justify-center text-primary-brand">
                      <Building2 size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">{t('settings.space.profile.title')}</CardTitle>
                      <CardDescription className="font-medium">{t('settings.space.profile.subtitle')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="flex flex-col md:flex-row gap-10 items-start">
                    <div className="space-y-4 flex flex-col items-center">
                      <div className="w-32 h-32 rounded-3xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-2 group hover:border-primary-brand hover:bg-primary-brand-light/50 transition-all cursor-pointer">
                        <Upload size={24} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{t('settings.space.profile.upload_logo')}</span>
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase text-center tracking-tighter">{t('settings.space.profile.upload_hint')}</p>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      <div className="space-y-2.5">
                        <Label htmlFor="spaceName">{t('settings.space.profile.name_label')}</Label>
                        <Input
                          id="spaceName"
                          value={settings.space_profile?.name || ''}
                          onChange={(e) => updateSetting('space_profile', 'name', e.target.value)}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="slug">{t('settings.space.profile.slug_label')}</Label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                          <Input
                            id="slug"
                            value={settings.space_profile?.slug || ''}
                            onChange={(e) => updateSetting('space_profile', 'slug', e.target.value)}
                            className="h-12 pl-12"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-2.5">
                        <Label htmlFor="desc">{t('settings.space.profile.desc_label')}</Label>
                        <Textarea
                          id="desc"
                          rows={3}
                          value={settings.space_profile?.description || ''}
                          onChange={(e) => updateSetting('space_profile', 'description', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/50">
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
                  </div>

                  <div className="pt-6 border-t border-border/50">
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
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <Card className="border-border rounded-3xl shadow-sm">
                <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-brand-light flex items-center justify-center text-primary-brand">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">{t('settings.space.security.title')}</CardTitle>
                      <CardDescription className="font-medium">{t('settings.space.security.subtitle')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-primary-brand border border-border shadow-sm">
                        <Camera size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{t('settings.space.security.face_id_title')}</p>
                        <p className="text-xs text-muted-foreground font-medium">{t('settings.space.security.face_id_desc')}</p>
                      </div>
                    </div>
                    <div
                      onClick={() => updateSetting('security_config', 'face_verify', !settings.security_config?.face_verify)}
                      className={`w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors ${settings.security_config?.face_verify ? 'bg-primary-brand' : 'bg-muted'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${settings.security_config?.face_verify ? 'right-1' : 'left-1'}`} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-primary-brand border border-border shadow-sm">
                        <Lock size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{t('settings.space.security.domain_title')}</p>
                        <p className="text-xs text-muted-foreground font-medium">{t('settings.space.security.domain_desc')}</p>
                      </div>
                    </div>
                    <div
                      onClick={() => updateSetting('security_config', 'domain_restriction', !settings.security_config?.domain_restriction)}
                      className={`w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors ${settings.security_config?.domain_restriction ? 'bg-primary-brand' : 'bg-muted'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${settings.security_config?.domain_restriction ? 'right-1' : 'left-1'}`} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-4 bg-muted/30 rounded-2xl border border-border">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-destructive border border-border shadow-sm">
                        <ShieldAlert size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm">Số lần nhận diện khuôn mặt tối đa</p>
                        <p className="text-xs text-muted-foreground font-medium">
                          Mặc định áp dụng cho bài thi online có bật camera. Vượt → hệ thống tự nộp bài (0 = không giới hạn).
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Input
                        type="number"
                        min={0}
                        max={20}
                        value={typeof settings.security_config?.max_face_warnings === 'number' ? settings.security_config.max_face_warnings : 3}
                        onChange={(e) => updateSetting('security_config', 'max_face_warnings', Math.max(0, Number(e.target.value)))}
                        className="h-10 w-20"
                      />
                      <span className="text-xs font-bold text-muted-foreground">lần</span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <Label>{t('settings.space.security.join_code_label')}</Label>
                    <div className="flex gap-4">
                      <Input
                        value={settings.security_config?.join_code || ''}
                        onChange={(e) => updateSetting('security_config', 'join_code', e.target.value)}
                        className="h-12 text-center"
                      />
                      <Button
                        variant="outline"
                        onClick={() => updateSetting('security_config', 'join_code', 'SPACE-' + Math.floor(100 + Math.random() * 900))}
                        className="h-12"
                      >
                        {t('settings.space.security.generate')}
                      </Button>
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
                    {t('settings.space.security.save')}
                  </Button>
                </div>
              </Card>

              <Card className="border-border rounded-3xl shadow-sm">
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
          )}

          {activeSection === 'classrooms' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <Card className="border-border rounded-3xl shadow-sm">
                <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-brand-light flex items-center justify-center text-primary-brand">
                      <Settings2 size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">{t('settings.space.classrooms.title')}</CardTitle>
                      <CardDescription className="font-medium">{t('settings.space.classrooms.subtitle')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2.5">
                      <Label className="flex items-center gap-2">
                        <Users size={14} />
                        {t('settings.space.classrooms.max_students_label')}
                      </Label>
                      <Input
                        type="number"
                        value={settings.classroom_defaults?.max_students || 40}
                        onChange={(e) => updateSetting('classroom_defaults', 'max_students', parseInt(e.target.value))}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label className="flex items-center gap-2">
                        <Palette size={14} />
                        {t('settings.space.classrooms.view_mode_label')}
                      </Label>
                      <div className="flex h-12 bg-muted/30 rounded-xl border border-border p-1">
                        <Button
                          variant={settings.classroom_defaults?.view_mode === 'grid' ? 'secondary' : 'ghost'}
                          onClick={() => updateSetting('classroom_defaults', 'view_mode', 'grid')}
                          className="flex-1"
                        >
                          {t('settings.space.classrooms.view_grid')}
                        </Button>
                        <Button
                          variant={settings.classroom_defaults?.view_mode === 'list' ? 'secondary' : 'ghost'}
                          onClick={() => updateSetting('classroom_defaults', 'view_mode', 'list')}
                          className="flex-1"
                        >
                          {t('settings.space.classrooms.view_list')}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('settings.space.classrooms.features_label')}</p>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'feature_chat', label: t('settings.space.classrooms.feature_chat') },
                        { key: 'feature_screen_share', label: t('settings.space.classrooms.feature_screen_share') },
                        { key: 'feature_record', label: t('settings.space.classrooms.feature_record') },
                        { key: 'feature_breakout', label: t('settings.space.classrooms.feature_breakout') },
                        { key: 'feature_whiteboard', label: t('settings.space.classrooms.feature_whiteboard') },
                        { key: 'feature_emoji', label: t('settings.space.classrooms.feature_emoji') },
                      ].map((feature) => {
                        const isEnabled = settings.classroom_defaults?.features?.includes(feature.label);
                        return (
                          <div
                            key={feature.key}
                            onClick={() => {
                              const currentFeatures = settings.classroom_defaults?.features || [];
                              const newFeatures = isEnabled
                                ? currentFeatures.filter((f: string) => f !== feature.label)
                                : [...currentFeatures, feature.label];
                              updateSetting('classroom_defaults', 'features', newFeatures);
                            }}
                            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/10 hover:bg-muted/30 transition-all cursor-pointer"
                          >
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isEnabled ? 'bg-primary-brand border-primary-brand text-white' : 'border-border'}`}>
                              {isEnabled && <Check size={12} />}
                            </div>
                            <span className="text-sm font-medium">{feature.label}</span>
                          </div>
                        );
                      })}
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
                    {t('settings.space.classrooms.save')}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <Card className="border-border rounded-3xl shadow-sm">
                <CardHeader className="bg-muted/30 pb-6 border-b border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-brand-light flex items-center justify-center text-primary-brand">
                      <Bell size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">{t('settings.space.notifications.title')}</CardTitle>
                      <CardDescription className="font-medium">{t('settings.space.notifications.subtitle')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-10">
                  <div className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">{t('settings.space.notifications.web_section')}</p>
                    {[
                      { id: 'new_student', title: t('settings.space.notifications.new_student_title'), desc: t('settings.space.notifications.new_student_desc') },
                      { id: 'submission', title: t('settings.space.notifications.submission_title'), desc: t('settings.space.notifications.submission_desc') },
                      { id: 'support', title: t('settings.space.notifications.support_title'), desc: t('settings.space.notifications.support_desc') }
                    ].map((item) => {
                      const isEnabled = settings.notification_prefs?.web?.[item.id];
                      return (
                        <div key={item.id} className="flex items-center justify-between py-2">
                          <div>
                            <p className="font-bold text-sm">{item.title}</p>
                            <p className="text-xs text-muted-foreground font-medium">{item.desc}</p>
                          </div>
                          <div
                            onClick={() => {
                              const web = { ...(settings.notification_prefs?.web || {}), [item.id]: !isEnabled };
                              updateSetting('notification_prefs', 'web', web);
                            }}
                            className={`w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors ${isEnabled ? 'bg-primary-brand' : 'bg-muted'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isEnabled ? 'right-1' : 'left-1'}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-4 pt-6 border-t border-border/50">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">{t('settings.space.notifications.email_section')}</p>
                    {[
                      { id: 'weekly_report', title: t('settings.space.notifications.weekly_report_title'), desc: t('settings.space.notifications.weekly_report_desc') },
                      { id: 'security_alert', title: t('settings.space.notifications.security_alert_title'), desc: t('settings.space.notifications.security_alert_desc') }
                    ].map((item) => {
                      const isEnabled = settings.notification_prefs?.email?.[item.id];
                      return (
                        <div key={item.id} className="flex items-center justify-between py-2">
                          <div>
                            <p className="font-bold text-sm">{item.title}</p>
                            <p className="text-xs text-muted-foreground font-medium">{item.desc}</p>
                          </div>
                          <div
                            onClick={() => {
                              const email = { ...(settings.notification_prefs?.email || {}), [item.id]: !isEnabled };
                              updateSetting('notification_prefs', 'email', email);
                            }}
                            className={`w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors ${isEnabled ? 'bg-primary-brand' : 'bg-muted'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isEnabled ? 'right-1' : 'left-1'}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
                <div className="p-6 bg-muted/20 border-t border-border flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="h-11 gap-2"
                  >
                    {isSaving ? <Check size={16} className="animate-pulse" /> : <Save size={16} />}
                    {t('settings.space.notifications.save')}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
