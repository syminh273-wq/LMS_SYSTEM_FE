'use client';

import { useEffect, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
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
  Users,
  Check,
  UserCircle,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  Info,
  Mail,
  Monitor,
  RefreshCw,
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { toast } from 'sonner';
import { spaceApi } from '@/lib/api';
import { accountService } from '@/lib/api/account';
import { useDispatch } from 'react-redux';
import { setProfile } from '@/lib/redux/userSlice';
import { setSettings as setGlobalSettings } from '@/lib/redux/spaceSlice';

type SettingSection = 'account' | 'profile' | 'security' | 'classrooms' | 'notifications';
type SpaceSettings = {
  [category: string]: Record<string, unknown> | undefined;
  space_profile?: {
    name?: string;
    slug?: string;
    description?: string;
    logo_url?: string;
    theme_color?: string;
  };
  security_config?: Record<string, unknown>;
  classroom_defaults?: {
    max_students?: number;
    view_mode?: string;
    features?: string[];
  };
  notification_prefs?: {
    web?: Record<string, boolean | undefined>;
    email?: Record<string, boolean | undefined>;
  };
};

export default function SettingsPage() {
  const dispatch = useDispatch();
  const [activeSection, setActiveSection] = useState<SettingSection>('account');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [themeColor, setThemeColor] = useState('#ec4899');
  const [showPassword, setShowPassword] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [accountForm, setAccountForm] = useState({ full_name: '' });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  
  const [settings, setSettings] = useState<SpaceSettings>({
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
        const [data, account] = await Promise.all([
          spaceApi.getSettings(),
          accountService.getProfile().catch(() => null),
        ]);
        if (Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }));
          if (data.space_profile?.theme_color) {
            setThemeColor(data.space_profile.theme_color);
          }
        }
        if (account) {
          setAccountForm({ full_name: account.full_name || '' });
          dispatch(setProfile(account));
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
        toast.error('Không thể tải cài đặt. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [dispatch]);

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
      
      toast.success('Đã lưu cài đặt thành công.');
    } catch {
      toast.error('Không thể lưu cài đặt. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAccount = async () => {
    setIsSavingAccount(true);
    try {
      const response = await accountService.updateProfile({ full_name: accountForm.full_name.trim() });
      const updatedProfile = response.data || response || { full_name: accountForm.full_name.trim() };
      dispatch(setProfile(updatedProfile));
      toast.success('Đã cập nhật thông tin tài khoản.');
    } catch {
      toast.error('Không thể cập nhật thông tin tài khoản.');
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      toast.error('Vui lòng nhập đầy đủ mật khẩu');
      return;
    }

    if (passwordForm.new_password.length < 8) {
      toast.error('Mật khẩu mới cần có ít nhất 8 ký tự');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }

    setIsSavingPassword(true);
    try {
      await accountService.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password,
      });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      toast.success('Đã đổi mật khẩu thành công.');
    } catch {
      toast.error('Không thể đổi mật khẩu. Vui lòng kiểm tra mật khẩu hiện tại.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const updateSetting = (category: string, key: string, value: unknown) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [key]: value
      }
    }));
  };

  const passwordChecks = [
    { label: 'Ít nhất 8 ký tự', done: passwordForm.new_password.length >= 8 },
    { label: 'Có chữ hoa hoặc chữ thường', done: /[a-zA-Z]/.test(passwordForm.new_password) },
    { label: 'Có số hoặc ký tự đặc biệt', done: /[\d\W]/.test(passwordForm.new_password) },
  ];

  const menuItems: Array<{
    id: SettingSection;
    label: string;
    description: string;
    icon: ComponentType<{ size?: number; className?: string }>;
  }> = [
    { id: 'account', label: 'Tài khoản', description: 'Tên hiển thị và mật khẩu', icon: UserCircle },
    { id: 'profile', label: 'Thông tin tổ chức', description: 'Tên Space, slug, thương hiệu', icon: Building2 },
    { id: 'security', label: 'Bảo mật & Xác thực', description: 'FaceID, domain, join code', icon: ShieldCheck },
    { id: 'classrooms', label: 'Cấu hình lớp học', description: 'Mặc định cho phòng học mới', icon: Settings2 },
    { id: 'notifications', label: 'Thông báo', description: 'Web và email alerts', icon: Bell },
  ];

  return (
    <div className="relative space-y-6 pb-10 animate-in fade-in duration-500">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-3xl bg-background/60 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-pink-100 bg-card px-8 py-7 shadow-xl shadow-pink-100/60">
            <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-pink-500">Đang tải cấu hình...</p>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-pink-100 bg-gradient-to-br from-pink-50 via-white to-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-pink-500">Space Admin</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground">Cài đặt hệ thống</h2>
            <p className="mt-2 max-w-2xl text-sm font-medium text-muted-foreground">
              Quản lý tài khoản, bảo mật và cấu hình vận hành của Space trong một khu vực rõ ràng.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-pink-100 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-pink-600 shadow-sm">Account</span>
            <span className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground shadow-sm">Workspace</span>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="rounded-3xl border border-border bg-card p-2 shadow-sm">
            {menuItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`mb-1 flex w-full items-start gap-3 rounded-2xl px-4 py-3.5 text-left transition-all last:mb-0 ${
                    isActive
                      ? 'bg-pink-500 text-white shadow-lg shadow-pink-200'
                      : 'text-muted-foreground hover:bg-pink-50 hover:text-foreground'
                  }`}
                >
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-white/20' : 'bg-white text-pink-500 ring-1 ring-pink-100'}`}>
                    <item.icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold">{item.label}</p>
                    <p className={`mt-0.5 text-xs font-medium ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>{item.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="space-y-6 lg:col-span-9">
          {activeSection === 'account' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <SettingsCard
                icon={UserCircle}
                title="Thông tin tài khoản"
                description="Cập nhật tên hiển thị dùng trong khu vực quản trị Space."
              >
                <CardContent className="space-y-5 p-6">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_auto] md:items-end">
                    <div className="space-y-2.5">
                      <Label htmlFor="accountFullName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Họ và tên</Label>
                      <Input
                        id="accountFullName"
                        value={accountForm.full_name}
                        onChange={(e) => setAccountForm({ full_name: e.target.value })}
                        className="h-12 rounded-xl border-border bg-muted/30 focus:bg-card"
                        placeholder="Nguyen Van An"
                      />
                    </div>
                    <SaveButton
                      onClick={handleSaveAccount}
                      loading={isSavingAccount}
                      label="Lưu tài khoản"
                      loadingLabel="Đang lưu..."
                      icon={Save}
                    />
                  </div>
                  {!accountForm.full_name.trim() && (
                    <EmptyHint icon={Info} text="Tên hiển thị chưa được cập nhật." />
                  )}
                </CardContent>
              </SettingsCard>

              <SettingsCard
                icon={KeyRound}
                title="Đổi mật khẩu"
                description="Bảo vệ tài khoản bằng mật khẩu mạnh và không chia sẻ với người khác."
              >
                <CardContent className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-[1fr_280px]">
                  <div className="space-y-5">
                    <PasswordField
                      id="currentPassword"
                      label="Mật khẩu hiện tại"
                      value={passwordForm.current_password}
                      visible={showPassword.current}
                      onToggle={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                      onChange={(value) => setPasswordForm(prev => ({ ...prev, current_password: value }))}
                    />
                    <PasswordField
                      id="newPassword"
                      label="Mật khẩu mới"
                      value={passwordForm.new_password}
                      visible={showPassword.next}
                      onToggle={() => setShowPassword(prev => ({ ...prev, next: !prev.next }))}
                      onChange={(value) => setPasswordForm(prev => ({ ...prev, new_password: value }))}
                    />
                    <PasswordField
                      id="confirmPassword"
                      label="Xác nhận mật khẩu"
                      value={passwordForm.confirm_password}
                      visible={showPassword.confirm}
                      onToggle={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                      onChange={(value) => setPasswordForm(prev => ({ ...prev, confirm_password: value }))}
                    />
                    <div className="flex justify-end">
                      <SaveButton
                        onClick={handleChangePassword}
                        loading={isSavingPassword}
                        label="Đổi mật khẩu"
                        loadingLabel="Đang đổi..."
                        icon={KeyRound}
                      />
                    </div>
                  </div>
                  <div className="h-fit rounded-2xl border border-pink-100 bg-pink-50/50 p-4">
                    <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                      <ShieldCheck size={18} className="text-pink-500" />
                      Gợi ý mật khẩu an toàn
                    </div>
                    <div className="mt-4 space-y-3">
                      {passwordChecks.map((item) => (
                        <div key={item.label} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                          <span className={`flex h-5 w-5 items-center justify-center rounded-full ${item.done ? 'bg-pink-500 text-white' : 'bg-white text-muted-foreground ring-1 ring-border'}`}>
                            <Check size={12} />
                          </span>
                          {item.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </SettingsCard>
            </div>
          )}

          {activeSection === 'profile' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <SettingsCard
                icon={Building2}
                title="Thông tin tổ chức"
                description="Cấu hình thông tin hiển thị cho học sinh và giáo viên."
              >
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-[160px_1fr]">
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-pink-200 bg-pink-50/40 p-5 text-center">
                      <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-pink-100 bg-white text-pink-500 shadow-sm">
                        <Upload size={24} />
                      </div>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">Tải Logo</p>
                      <p className="text-xs font-medium text-muted-foreground">PNG, JPG tối đa 2MB</p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2.5">
                        <Label htmlFor="spaceName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tên Space</Label>
                        <Input
                          id="spaceName"
                          value={settings.space_profile?.name || ''}
                          onChange={(e) => updateSetting('space_profile', 'name', e.target.value)}
                          className="h-12 rounded-xl border-border bg-muted/30 focus:bg-card"
                          placeholder="Tên tổ chức"
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="slug" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Slug</Label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                          <Input
                            id="slug"
                            value={settings.space_profile?.slug || ''}
                            onChange={(e) => updateSetting('space_profile', 'slug', e.target.value)}
                            className="h-12 rounded-xl border-border bg-muted/30 pl-12 focus:bg-card"
                            placeholder="my-space"
                          />
                        </div>
                      </div>
                      <div className="space-y-2.5 md:col-span-2">
                        <Label htmlFor="desc" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mô tả</Label>
                        <textarea
                          id="desc"
                          rows={3}
                          className="w-full rounded-xl border border-border bg-muted/30 p-4 text-sm font-medium transition-all focus:bg-card focus:outline-none focus:ring-2 focus:ring-pink-100"
                          value={settings.space_profile?.description || ''}
                          onChange={(e) => updateSetting('space_profile', 'description', e.target.value)}
                          placeholder="Mô tả ngắn về Space"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/20 p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Màu sắc thương hiệu</Label>
                      <span className="rounded-lg border border-pink-100 bg-pink-50 px-2.5 py-1 text-xs font-bold uppercase text-pink-600">{themeColor}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {['#ec4899', '#f43f5e', '#4f46e5', '#10b981', '#f59e0b', '#06b6d4'].map((color) => (
                        <button
                          key={color}
                          onClick={() => setThemeColor(color)}
                          className={`h-11 w-11 rounded-2xl border-2 shadow-sm transition-all hover:scale-105 active:scale-95 ${themeColor === color ? 'border-pink-500 ring-4 ring-pink-100' : 'border-white ring-1 ring-border'}`}
                          style={{ backgroundColor: color }}
                          aria-label={`Chọn màu ${color}`}
                        >
                          {themeColor === color && <Check size={18} className="mx-auto text-white" />}
                        </button>
                      ))}

                      <div className="group relative">
                        <input
                          type="color"
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                        />
                        <button className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-dashed border-border text-muted-foreground transition-all group-hover:border-pink-200 group-hover:bg-pink-50 group-hover:text-pink-500">
                          <Palette size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooterAction>
                  <SaveButton onClick={handleSave} loading={isSaving} label="Lưu hồ sơ" loadingLabel="Đang lưu..." icon={Save} />
                </CardFooterAction>
              </SettingsCard>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <SettingsCard
                icon={ShieldCheck}
                title="Bảo mật & xác thực"
                description="Quản lý các lớp bảo vệ và quy tắc tham gia Space."
              >
                <CardContent className="space-y-4 p-6">
                  <ToggleRow
                    icon={Camera}
                    title="Xác thực khuôn mặt (FaceID)"
                    description="Yêu cầu xác thực khi vào phòng học"
                    checked={Boolean(settings.security_config?.face_verify)}
                    onClick={() => updateSetting('security_config', 'face_verify', !settings.security_config?.face_verify)}
                  />
                  <ToggleRow
                    icon={Lock}
                    title="Giới hạn Domain Email"
                    description="Chỉ cho phép email từ tổ chức đã cấu hình"
                    checked={Boolean(settings.security_config?.domain_restriction)}
                    onClick={() => updateSetting('security_config', 'domain_restriction', !settings.security_config?.domain_restriction)}
                  />
                  <div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-4">
                    <Label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">Mã tham gia mặc định</Label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Input
                        value={String(settings.security_config?.join_code || '')}
                        onChange={(e) => updateSetting('security_config', 'join_code', e.target.value)}
                        className="h-12 rounded-xl border-border bg-card text-center font-mono font-bold tracking-widest"
                        placeholder="SPACE-123"
                      />
                      <Button
                        variant="outline"
                        onClick={() => updateSetting('security_config', 'join_code', 'SPACE-' + Math.floor(100 + Math.random() * 900))}
                        className="h-12 rounded-xl border-border px-5 font-bold"
                      >
                        <RefreshCw size={16} />
                        Tạo mới
                      </Button>
                    </div>
                    {!settings.security_config?.join_code && (
                      <EmptyHint icon={Info} text="Chưa có mã tham gia mặc định." />
                    )}
                  </div>
                </CardContent>
                <CardFooterAction>
                  <SaveButton onClick={handleSave} loading={isSaving} label="Lưu bảo mật" loadingLabel="Đang lưu..." icon={Save} />
                </CardFooterAction>
              </SettingsCard>
            </div>
          )}

          {activeSection === 'classrooms' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <SettingsCard
                icon={Settings2}
                title="Cấu hình lớp học"
                description="Cài đặt mặc định cho các phòng học mới."
              >
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-2.5">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Users size={14} />
                        Sĩ số tối đa mặc định
                      </Label>
                      <Input 
                        type="number" 
                        value={settings.classroom_defaults?.max_students || 40} 
                        onChange={(e) => updateSetting('classroom_defaults', 'max_students', parseInt(e.target.value))}
                        className="h-12 rounded-xl border-border bg-muted/30" 
                      />
                    </div>
                    
                    <div className="space-y-2.5">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Palette size={14} />
                        Giao diện mặc định
                      </Label>
                      <div className="flex h-12 rounded-xl border border-border bg-muted/30 p-1">
                        <button 
                          onClick={() => updateSetting('classroom_defaults', 'view_mode', 'grid')}
                          className={`flex-1 rounded-lg text-xs font-bold transition-all ${settings.classroom_defaults?.view_mode === 'grid' ? 'border border-pink-100 bg-card text-pink-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          Lưới (Grid)
                        </button>
                        <button 
                          onClick={() => updateSetting('classroom_defaults', 'view_mode', 'list')}
                          className={`flex-1 rounded-lg text-xs font-bold transition-all ${settings.classroom_defaults?.view_mode === 'list' ? 'border border-pink-100 bg-card text-pink-500 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          Danh sách (List)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tính năng được bật mặc định</p>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {[
                        'Trò chuyện công khai',
                        'Chia sẻ màn hình',
                        'Ghi lại buổi học',
                        'Phòng thảo luận nhóm',
                        'Bảng trắng tương tác',
                        'Phản hồi bằng Emoji'
                      ].map((feature, i) => {
                        const isEnabled = settings.classroom_defaults?.features?.includes(feature);
                        return (
                          <div 
                            key={i} 
                            onClick={() => {
                              const currentFeatures = settings.classroom_defaults?.features || [];
                              const newFeatures = isEnabled 
                                ? currentFeatures.filter((f: string) => f !== feature)
                                : [...currentFeatures, feature];
                              updateSetting('classroom_defaults', 'features', newFeatures);
                            }}
                            className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:border-pink-100 hover:bg-pink-50/50"
                          >
                            <div className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${isEnabled ? 'border-pink-500 bg-pink-500 text-white' : 'border-border bg-white'}`}>
                              {isEnabled && <Check size={12} />}
                            </div>
                            <span className="text-sm font-medium">{feature}</span>
                          </div>
                        );
                      })}
                    </div>
                    {(!settings.classroom_defaults?.features || settings.classroom_defaults.features.length === 0) && (
                      <EmptyHint icon={Info} text="Chưa bật tính năng mặc định nào cho lớp học mới." />
                    )}
                  </div>
                </CardContent>
                <CardFooterAction>
                  <SaveButton onClick={handleSave} loading={isSaving} label="Lưu lớp học" loadingLabel="Đang lưu..." icon={Save} />
                </CardFooterAction>
              </SettingsCard>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <SettingsCard
                icon={Bell}
                title="Thông báo"
                description="Kiểm soát các cảnh báo và cập nhật quan trọng."
              >
                <CardContent className="space-y-6 p-6">
                  <div className="space-y-4">
                    <SectionLabel icon={Monitor} label="Thông báo qua Web" />
                    {[
                      { id: 'new_student', title: 'Học sinh mới tham gia', desc: 'Nhận thông báo khi có học sinh yêu cầu vào Space' },
                      { id: 'submission', title: 'Bài nộp bài tập mới', desc: 'Thông báo khi học sinh nộp bài tập về nhà' },
                      { id: 'support', title: 'Tin nhắn hỗ trợ', desc: 'Thông báo tin nhắn mới từ hệ thống hỗ trợ' }
                    ].map((item, i) => {
	                      const isEnabled = settings.notification_prefs?.web?.[item.id];
	                      return (
	                        <ToggleRow
                            key={i}
                            icon={Bell}
                            title={item.title}
                            description={item.desc}
                            checked={Boolean(isEnabled)}
                            onClick={() => {
                              const web = { ...(settings.notification_prefs?.web || {}), [item.id]: !isEnabled };
                              updateSetting('notification_prefs', 'web', web);
                            }}
                          />
	                      );
	                    })}
	                  </div>

                  <div className="space-y-4 border-t border-border/50 pt-6">
                    <SectionLabel icon={Mail} label="Thông báo qua Email" />
                    {[
                      { id: 'weekly_report', title: 'Báo cáo hàng tuần', desc: 'Tóm tắt hoạt động của Space trong tuần' },
                      { id: 'security_alert', title: 'Cảnh báo bảo mật', desc: 'Email khi có đăng nhập từ thiết bị lạ' }
                    ].map((item, i) => {
	                      const isEnabled = settings.notification_prefs?.email?.[item.id];
	                      return (
	                        <ToggleRow
                            key={i}
                            icon={Mail}
                            title={item.title}
                            description={item.desc}
                            checked={Boolean(isEnabled)}
                            onClick={() => {
                              const email = { ...(settings.notification_prefs?.email || {}), [item.id]: !isEnabled };
                              updateSetting('notification_prefs', 'email', email);
                            }}
                          />
	                      );
	                    })}
	                  </div>
	                </CardContent>
                <CardFooterAction>
                  <SaveButton onClick={handleSave} loading={isSaving} label="Lưu thông báo" loadingLabel="Đang lưu..." icon={Save} />
                </CardFooterAction>
              </SettingsCard>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border/50 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-500 ring-1 ring-pink-100">
            <Icon size={24} />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-xl font-extrabold text-foreground">{title}</CardTitle>
            <CardDescription className="mt-1 font-medium">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      {children}
    </Card>
  );
}

function CardFooterAction({ children }: { children: ReactNode }) {
  return (
    <div className="flex justify-end border-t border-border bg-muted/20 p-5 sm:p-6">
      {children}
    </div>
  );
}

function SaveButton({
  onClick,
  loading,
  label,
  loadingLabel,
  icon: Icon,
}: {
  onClick: () => void;
  loading: boolean;
  label: string;
  loadingLabel: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <Button
      onClick={onClick}
      disabled={loading}
      className="h-11 rounded-xl bg-pink-500 px-5 text-xs font-extrabold uppercase tracking-widest text-white shadow-lg shadow-pink-200 transition-all hover:bg-pink-600 disabled:shadow-none"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
      {loading ? loadingLabel : label}
    </Button>
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
    <div className="space-y-2.5">
      <Label htmlFor={id} className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 rounded-xl border-border bg-muted/30 pr-12 focus:bg-card"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-pink-50 hover:text-pink-500"
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onClick,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-muted/20 p-4 text-left transition-all hover:border-pink-100 hover:bg-pink-50/50"
    >
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-pink-100 bg-white text-pink-500 shadow-sm">
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-foreground">{title}</p>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">{description}</p>
        </div>
      </div>
      <span className={`relative h-6 w-12 shrink-0 rounded-full shadow-inner transition-colors ${checked ? 'bg-pink-500' : 'bg-muted'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${checked ? 'right-1' : 'left-1'}`} />
      </span>
    </button>
  );
}

function SectionLabel({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
      <Icon size={14} className="text-pink-500" />
      {label}
    </div>
  );
}

function EmptyHint({
  icon: Icon,
  text,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-pink-200 bg-pink-50/40 px-3 py-2 text-sm font-semibold text-muted-foreground">
      <Icon size={16} className="text-pink-500" />
      {text}
    </div>
  );
}
