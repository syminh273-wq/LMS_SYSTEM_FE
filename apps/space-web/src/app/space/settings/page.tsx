'use client';

import * as React from 'react';
import { useState } from 'react';
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
  Check
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
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setSettings as setGlobalSettings, setThemeColor as setGlobalThemeColor } from '@/lib/redux/spaceSlice';

type SettingSection = 'profile' | 'security' | 'classrooms' | 'notifications';

export default function SettingsPage() {
  const dispatch = useDispatch();
  const [activeSection, setActiveSection] = useState<SettingSection>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [themeColor, setThemeColor] = useState('#4f46e5');
  
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
      
      // Update Global Redux State immediately
      dispatch(setGlobalSettings(updatedData));
      
      toast.success('Đã lưu cài đặt thành công!');
    } catch (err) {
      toast.error('Không thể lưu cài đặt');
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

  const menuItems = [
    { id: 'profile', label: 'Thông tin tổ chức', icon: Building2 },
    { id: 'security', label: 'Bảo mật & Xác thực', icon: ShieldCheck },
    { id: 'classrooms', label: 'Cấu hình lớp học', icon: Settings2 },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 relative">
      {loading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-3xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary-brand border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-primary-brand">Đang tải cấu hình...</p>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Cài đặt hệ thống</h2>
          <p className="text-muted-foreground font-medium mt-1">Quản lý và tùy chỉnh không gian làm việc của bạn</p>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-3 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as SettingSection)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-bold text-sm uppercase tracking-wider ${
                activeSection === item.id 
                  ? 'bg-primary-brand text-white shadow-lg shadow-primary-brand/20' 
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </aside>

        {/* Main Content Area */}
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
                      <CardTitle className="text-xl font-bold">Hồ sơ Space</CardTitle>
                      <CardDescription className="font-medium">Thông tin hiển thị cho học sinh và giáo viên</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="flex flex-col md:flex-row gap-10 items-start">
                    <div className="space-y-4 flex flex-col items-center">
                      <div className="w-32 h-32 rounded-3xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-2 group hover:border-primary-brand hover:bg-primary-brand-light/50 transition-all cursor-pointer">
                        <Upload size={24} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Tải Logo</span>
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase text-center tracking-tighter">PNG, JPG tối đa 2MB</p>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      <div className="space-y-2.5">
                        <Label htmlFor="spaceName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tên Space</Label>
                        <Input 
                          id="spaceName" 
                          value={settings.space_profile?.name || ''} 
                          onChange={(e) => updateSetting('space_profile', 'name', e.target.value)}
                          className="h-12 rounded-xl bg-muted/30 border-border focus:bg-card" 
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="slug" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Slug (Đường dẫn)</Label>
                        <div className="relative">
                          <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                          <Input 
                            id="slug" 
                            value={settings.space_profile?.slug || ''} 
                            onChange={(e) => updateSetting('space_profile', 'slug', e.target.value)}
                            className="h-12 pl-12 rounded-xl bg-muted/30 border-border focus:bg-card" 
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-2.5">
                        <Label htmlFor="desc" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mô tả</Label>
                        <textarea 
                          id="desc" 
                          rows={3}
                          className="w-full p-4 rounded-xl bg-muted/30 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-brand/10 focus:bg-card transition-all font-medium"
                          value={settings.space_profile?.description || ''}
                          onChange={(e) => updateSetting('space_profile', 'description', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Màu sắc thương hiệu</Label>
                      <span className="text-xs font-mono font-bold text-primary-brand bg-primary-brand-light px-2 py-1 rounded-md border border-primary-brand-muted uppercase">{themeColor}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 items-center">
                      {['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'].map((color) => (
                        <button 
                          key={color}
                          onClick={() => setThemeColor(color)}
                          className={`w-12 h-12 rounded-2xl border-2 shadow-sm transition-all hover:scale-110 active:scale-95 ${themeColor === color ? 'border-primary-brand ring-2 ring-primary-brand/20' : 'border-white ring-1 ring-border'}`}
                          style={{ backgroundColor: color }}
                        >
                          {themeColor === color && <Check size={18} className="text-white mx-auto" />}
                        </button>
                      ))}
                      
                      <div className="relative group">
                        <input 
                          type="color" 
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <button className="w-12 h-12 rounded-2xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground group-hover:bg-muted/50 group-hover:border-primary-brand group-hover:text-primary-brand transition-all">
                          <Palette size={20} />
                        </button>
                      </div>
                      
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight ml-2">Chọn màu tùy chỉnh</p>
                    </div>
                  </div>
                </CardContent>
                <div className="p-6 bg-muted/20 border-t border-border flex justify-end">
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="bg-primary-brand hover:bg-primary-brand-dark text-white rounded-xl px-6 h-11 gap-2 shadow-lg shadow-primary-brand/10 font-bold uppercase text-xs tracking-widest transition-all"
                  >
                    {isSaving ? <Check size={16} className="animate-pulse" /> : <Save size={16} />}
                    Lưu hồ sơ
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
                      <CardTitle className="text-xl font-bold">Bảo mật & Truy cập</CardTitle>
                      <CardDescription className="font-medium">Quản lý các lớp bảo vệ và quy tắc tham gia</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary-brand border border-border shadow-sm">
                        <Camera size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Xác thực khuôn mặt (FaceID)</p>
                        <p className="text-xs text-muted-foreground font-medium">Yêu cầu xác thực khi vào phòng học</p>
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
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary-brand border border-border shadow-sm">
                        <Lock size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Giới hạn Domain Email</p>
                        <p className="text-xs text-muted-foreground font-medium">Chỉ cho phép email từ tổ chức (@school.edu.vn)</p>
                      </div>
                    </div>
                    <div 
                      onClick={() => updateSetting('security_config', 'domain_restriction', !settings.security_config?.domain_restriction)}
                      className={`w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors ${settings.security_config?.domain_restriction ? 'bg-primary-brand' : 'bg-muted'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${settings.security_config?.domain_restriction ? 'right-1' : 'left-1'}`} />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">Mã tham gia mặc định (Join Code)</Label>
                    <div className="flex gap-4">
                      <Input 
                        value={settings.security_config?.join_code || ''} 
                        onChange={(e) => updateSetting('security_config', 'join_code', e.target.value)}
                        className="h-12 rounded-xl bg-muted/30 font-mono font-bold tracking-widest text-center" 
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => updateSetting('security_config', 'join_code', 'SPACE-' + Math.floor(100 + Math.random() * 900))}
                        className="h-12 px-6 rounded-xl font-bold uppercase text-xs tracking-widest border-border"
                      >
                        Tạo mới
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <div className="p-6 bg-muted/20 border-t border-border flex justify-end">
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="bg-primary-brand hover:bg-primary-brand-dark text-white rounded-xl px-6 h-11 gap-2 shadow-lg shadow-primary-brand/10 font-bold uppercase text-xs tracking-widest transition-all"
                  >
                    {isSaving ? <Check size={16} className="animate-pulse" /> : <Save size={16} />}
                    Lưu bảo mật
                  </Button>
                </div>
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
                      <CardTitle className="text-xl font-bold">Cấu hình lớp học</CardTitle>
                      <CardDescription className="font-medium">Cài đặt mặc định cho các phòng học mới</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2.5">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Users size={14} />
                        Sĩ số tối đa mặc định
                      </Label>
                      <Input 
                        type="number" 
                        value={settings.classroom_defaults?.max_students || 40} 
                        onChange={(e) => updateSetting('classroom_defaults', 'max_students', parseInt(e.target.value))}
                        className="h-12 rounded-xl bg-muted/30 border-border" 
                      />
                    </div>
                    
                    <div className="space-y-2.5">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Palette size={14} />
                        Giao diện mặc định
                      </Label>
                      <div className="flex h-12 bg-muted/30 rounded-xl border border-border p-1">
                        <button 
                          onClick={() => updateSetting('classroom_defaults', 'view_mode', 'grid')}
                          className={`flex-1 rounded-lg transition-all text-xs font-bold ${settings.classroom_defaults?.view_mode === 'grid' ? 'bg-card shadow-sm text-primary-brand border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          Lưới (Grid)
                        </button>
                        <button 
                          onClick={() => updateSetting('classroom_defaults', 'view_mode', 'list')}
                          className={`flex-1 rounded-lg transition-all text-xs font-bold ${settings.classroom_defaults?.view_mode === 'list' ? 'bg-card shadow-sm text-primary-brand border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          Danh sách (List)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tính năng được bật mặc định</p>
                    <div className="grid grid-cols-2 gap-4">
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
                            className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/10 hover:bg-muted/30 transition-all cursor-pointer"
                          >
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isEnabled ? 'bg-primary-brand border-primary-brand text-white' : 'border-border'}`}>
                              {isEnabled && <Check size={12} />}
                            </div>
                            <span className="text-sm font-medium">{feature}</span>
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
                    className="bg-primary-brand hover:bg-primary-brand-dark text-white rounded-xl px-6 h-11 gap-2 shadow-lg shadow-primary-brand/10 font-bold uppercase text-xs tracking-widest transition-all"
                  >
                    {isSaving ? <Check size={16} className="animate-pulse" /> : <Save size={16} />}
                    Lưu lớp học
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
                      <CardTitle className="text-xl font-bold">Tùy chỉnh thông báo</CardTitle>
                      <CardDescription className="font-medium">Kiểm soát các cảnh báo và cập nhật quan trọng</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-10">
                  <div className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Thông báo qua Web</p>
                    {[
                      { id: 'new_student', title: 'Học sinh mới tham gia', desc: 'Nhận thông báo khi có học sinh yêu cầu vào Space' },
                      { id: 'submission', title: 'Bài nộp bài tập mới', desc: 'Thông báo khi học sinh nộp bài tập về nhà' },
                      { id: 'support', title: 'Tin nhắn hỗ trợ', desc: 'Thông báo tin nhắn mới từ hệ thống hỗ trợ' }
                    ].map((item, i) => {
                      const isEnabled = settings.notification_prefs?.web?.[item.id];
                      return (
                        <div key={i} className="flex items-center justify-between py-2">
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
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Thông báo qua Email</p>
                    {[
                      { id: 'weekly_report', title: 'Báo cáo hàng tuần', desc: 'Tóm tắt hoạt động của Space trong tuần' },
                      { id: 'security_alert', title: 'Cảnh báo bảo mật', desc: 'Email khi có đăng nhập từ thiết bị lạ' }
                    ].map((item, i) => {
                      const isEnabled = settings.notification_prefs?.email?.[item.id];
                      return (
                        <div key={i} className="flex items-center justify-between py-2">
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
                    className="bg-primary-brand hover:bg-primary-brand-dark text-white rounded-xl px-6 h-11 gap-2 shadow-lg shadow-primary-brand/10 font-bold uppercase text-xs tracking-widest transition-all"
                  >
                    {isSaving ? <Check size={16} className="animate-pulse" /> : <Save size={16} />}
                    Lưu thông báo
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
