'use client';

import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { setProfile } from '@/lib/redux/userSlice';
import { RootState } from '@/lib/redux/store';
import { useForm } from 'react-hook-form';
import { accountService } from '@/lib/api/account';
import { classroomApi } from '@/lib/api';
import type {
  StudentProfileSettings, ThemeColor, CoverStyle, ProfileVisibility,
  SocialLink, Certificate, CustomField, Classroom,
} from '@/lib/api/types';
import { socialApi } from '@/lib/api/social';
import type { Post } from '@/lib/api/types';
import { CreatePost } from '../feed/CreatePost';
import { PostCard } from '../feed/PostCard';
import { FollowersModal } from './FollowersModal';
import { CEditor } from '@/components/Elements/CEditor';
import { Form } from '@shared/components/ui/form';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import {
  Settings, Save, X, Plus, Trash2, ExternalLink,
  MapPin, Globe, Github, Facebook, Linkedin, Twitter, Instagram,
  BookOpen, Award, Edit3, ChevronRight, Loader2,
  GraduationCap, Star, Upload, Users, QrCode, Download,
  Sparkles, CheckCircle2, Hash,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@shared/lib/utils';

type ThemeConfig = { gradient: string; accent: string; bg: string; ring: string };

const THEMES: Record<ThemeColor, ThemeConfig> = {
  indigo:  { gradient: 'bg-indigo-600', accent: 'text-indigo-600',  bg: 'bg-indigo-50',  ring: 'ring-indigo-500' },
  rose:    { gradient: 'bg-rose-600',   accent: 'text-rose-600',    bg: 'bg-rose-50',    ring: 'ring-rose-500' },
  emerald: { gradient: 'bg-emerald-600',accent: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-500' },
  amber:   { gradient: 'bg-amber-500',  accent: 'text-amber-600',   bg: 'bg-amber-50',   ring: 'ring-amber-500' },
  violet:  { gradient: 'bg-violet-600', accent: 'text-violet-600',  bg: 'bg-violet-50',  ring: 'ring-violet-500' },
};

const MESH_COVERS: Record<ThemeColor, string> = {
  indigo:  'radial-gradient(at 40% 20%, #6366f1 0, transparent 50%), radial-gradient(at 80% 0%, #818cf8 0, transparent 50%), radial-gradient(at 0% 50%, #4f46e5 0, transparent 50%)',
  rose:    'radial-gradient(at 40% 20%, #f43f5e 0, transparent 50%), radial-gradient(at 80% 0%, #fb7185 0, transparent 50%), radial-gradient(at 0% 50%, #e11d48 0, transparent 50%)',
  emerald: 'radial-gradient(at 40% 20%, #10b981 0, transparent 50%), radial-gradient(at 80% 0%, #34d399 0, transparent 50%), radial-gradient(at 0% 50%, #059669 0, transparent 50%)',
  amber:   'radial-gradient(at 40% 20%, #f59e0b 0, transparent 50%), radial-gradient(at 80% 0%, #fbbf24 0, transparent 50%), radial-gradient(at 0% 50%, #d97706 0, transparent 50%)',
  violet:  'radial-gradient(at 40% 20%, #8b5cf6 0, transparent 50%), radial-gradient(at 80% 0%, #a78bfa 0, transparent 50%), radial-gradient(at 0% 50%, #7c3aed 0, transparent 50%)',
};

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  facebook:  Facebook,
  linkedin:  Linkedin,
  github:    Github,
  twitter:   Twitter,
  instagram: Instagram,
  website:   Globe,
};

function computeBadges(classrooms: Classroom[], totalSubmissions: number, avgGrade: number | null) {
  const badges = [];
  if (classrooms.length >= 3)    badges.push({ icon: '📚', label: 'Chăm chỉ', desc: 'Tham gia ≥ 3 lớp' });
  if (totalSubmissions >= 5)     badges.push({ icon: '🔥', label: 'Siêng năng', desc: 'Đã nộp ≥ 5 bài' });
  if (avgGrade !== null && avgGrade >= 9.0) badges.push({ icon: '⭐', label: 'Xuất sắc', desc: 'Điểm TB ≥ 9.0' });
  if (classrooms.length >= 1)    badges.push({ icon: '✅', label: 'Học viên', desc: 'Đang học tại LMS' });
  return badges;
}

const DEFAULT_SETTINGS: StudentProfileSettings = {
  consumer_uid: '',
  bio: '', address: '', city: '', country: 'Việt Nam',
  theme_color: 'indigo', cover_style: 'gradient', cover_value: '',
  show_stats: true, show_classrooms: true, show_grades: true, show_badges: true,
  show_address: true, show_links: true, show_hobbies: true, show_certificates: true,
  show_activity: false, show_contact: false,
  sections_order: ['classrooms', 'grades', 'certificates', 'about'],
  profile_visibility: 'class_only',
  metadata: { hobbies: [], social_links: [], certificates: [], custom_fields: [] },
  updated_at: null,
};

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { profile, isAuthenticated } = useSelector((s: RootState) => s.user);

  const [settings, setSettings] = useState<StudentProfileSettings>(DEFAULT_SETTINGS);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'classrooms' | 'certificates' | 'about'>('posts');

  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [myPosts, setMyPosts] = useState<Post[]>([]);

  const [modalMode, setModalMode] = useState<'none' | 'followers' | 'following'>('none');
  const [modalUsers, setModalUsers] = useState<Array<{ consumer_uid: string; name: string; avatar: string }>>([]);
  const [, setModalLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      full_name: '',
      bio: '',
      address: '',
      city: '',
      country: '',
      phone: '',
    },
  });

  const { control, reset: resetForm, handleSubmit: handleFormSubmit } = form;

  const openFollowers = async () => {
    setModalLoading(true);
    setModalMode('followers');
    try {
      const data = await socialApi.getFollowers();
      setModalUsers(data);
    } catch { toast.error('Lỗi khi tải người theo dõi'); }
    finally { setModalLoading(false); }
  };

  const openFollowing = async () => {
    setModalLoading(true);
    setModalMode('following');
    try {
      const data = await socialApi.getFollowing();
      setModalUsers(data);
    } catch { toast.error('Lỗi khi tải đang theo dõi'); }
    finally { setModalLoading(false); }
  };

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/consumer/login'); return; }
    const init = async () => {
      try {
        const [prof, cfg, cls, following, followers, posts] = await Promise.all([
          accountService.getProfile(),
          accountService.getProfileSettings(),
          classroomApi.mine(1).then(r => r.results).catch(() => [] as Classroom[]),
          socialApi.getFollowing().catch(() => []),
          socialApi.getFollowers().catch(() => []),
          socialApi.getMyPosts(10).catch(() => []),
        ]);
        dispatch(setProfile(prof));
        const merged = { ...DEFAULT_SETTINGS, ...cfg };
        if (!merged.metadata) merged.metadata = {};
        if (!merged.metadata.hobbies) merged.metadata.hobbies = [];
        if (!merged.metadata.social_links) merged.metadata.social_links = [];
        if (!merged.metadata.certificates) merged.metadata.certificates = [];
        if (!merged.metadata.custom_fields) merged.metadata.custom_fields = [];
        setSettings(merged);
        setClassrooms(cls);
        setFollowingCount(following.length);
        setFollowersCount(followers.length);
        setMyPosts(posts);

        resetForm({
          full_name: prof.full_name || '',
          bio: merged.bio || '',
          address: merged.address || '',
          city: merged.city || '',
          country: merged.country || 'Việt Nam',
          phone: prof.phone || '',
        });
      } catch { toast.error('Không thể tải dữ liệu'); }
      finally { setLoading(false); }
    };
    init();
  }, [isAuthenticated, router, dispatch, resetForm]);

  const theme = THEMES[settings.theme_color] ?? THEMES.indigo;
  const badges = computeBadges(classrooms, 0, null);

  const coverStyle = settings.cover_style === 'mesh'
    ? { background: MESH_COVERS[settings.theme_color] }
    : {};

  const coverClass = settings.cover_style !== 'mesh'
    ? theme.gradient
    : '';

  const handleSaveProfile = async (data: Record<string, string>) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('full_name', data.full_name);
      formData.append('phone', data.phone);
      if (avatarFile) formData.append('avatar', avatarFile);
      const updated = await accountService.updateProfile(formData) as { data?: unknown } & Record<string, unknown>;
      dispatch(setProfile((updated.data ?? updated) as Parameters<typeof setProfile>[0]));

      const newSettings = { ...settings, bio: data.bio, address: data.address, city: data.city, country: data.country };
      const saved = await accountService.updateProfileSettings(newSettings);
      setSettings({ ...DEFAULT_SETTINGS, ...saved });
      setEditMode(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success('Đã lưu profile!');
    } catch { toast.error('Lưu thất bại'); }
    finally { setSaving(false); }
  };

  const handleSaveSettings = async (patch: Partial<StudentProfileSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try {
      await accountService.updateProfileSettings(next);
    } catch { toast.error('Không thể lưu cài đặt'); }
  };

  const handlePostCreated = (post: Post) => {
    setMyPosts(prev => [post, ...prev]);
    toast.success('Đã đăng bài thành công!');
    setActiveTab('posts');
  };

  const handleLikePost = (uid: string, liked: boolean, count: number) => {
    setMyPosts(prev => prev.map(p => p.uid === uid ? { ...p, liked_by_me: liked, likes_count: count } : p));
  };

  const handleDeletePost = (uid: string) => {
    setMyPosts(prev => prev.filter(p => p.uid !== uid));
  };

  const updateMetadata = useCallback(async (patch: Partial<typeof settings.metadata>) => {
    const next = { ...settings, metadata: { ...settings.metadata, ...patch } };
    setSettings(next);
    try { await accountService.updateProfileSettings(next); }
    catch { toast.error('Không thể lưu'); }
  }, [settings]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-2 border-slate-200" />
          <Loader2 className="animate-spin text-indigo-600 absolute inset-0 m-auto" size={28} />
        </div>
        <p className="text-[13px] text-slate-500 animate-pulse">Đang tải hồ sơ...</p>
      </div>
    );
  }

  const avatarSrc = avatarPreview || profile?.avatar_url || '';
  const initials = (profile?.full_name || profile?.username || '?').slice(0, 2).toUpperCase();
  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/consumer/profile/${profile?.uid}` : '';

  const handleDownloadQR = () => {
    const svg = document.getElementById('my-profile-qr') as unknown as SVGGraphicsElement;
    if (!svg) return;

    const canvas = document.createElement("canvas");
    let svgData = new XMLSerializer().serializeToString(svg);
    if (!svgData.includes('xmlns=')) {
      svgData = svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    const img = document.createElement("img");
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = 500;
      canvas.height = 500;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 400, 400);
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `QR_Profile_${profile?.username}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className={cn(`h-[260px] md:h-[300px] w-full relative overflow-hidden ${coverClass}`)} style={coverStyle}>
        {settings.cover_style === 'mesh' && <div className="absolute inset-0 bg-black/10" />}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      <Form {...form}>
        <div className="max-w-[1280px] mx-auto px-4 -mt-20 md:-mt-24 relative z-10">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-5 md:px-8 pt-5">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="shrink-0 -mt-24 sm:-mt-28 relative">
                  <div className="relative inline-block group">
                    <div className="absolute -inset-1 rounded-full bg-white" />
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={profile?.full_name}
                        className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-lg object-cover" />
                    ) : (
                      <div className={cn("relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-4xl md:text-5xl font-bold", theme.gradient)}>
                        {initials}
                      </div>
                    )}
                    {!editMode && <span className="absolute bottom-2 right-2 md:bottom-3 md:right-3 w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-white shadow" />}
                    {editMode && (
                      <label className="absolute inset-0 z-10 rounded-full bg-black/50 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                        <Upload size={22} className="text-white" />
                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setAvatarFile(f);
                          setAvatarPreview(URL.createObjectURL(f));
                        }} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between pb-1 gap-4 min-w-0">
                  <div className="flex-1 min-w-0">
                    {editMode ? (
                      <input {...form.register('full_name')}
                        className="text-2xl md:text-[28px] font-bold bg-transparent border-b-2 border-slate-200 focus:border-indigo-600 outline-none text-slate-900 w-full mb-1 tracking-tight" placeholder="Họ và tên" />
                    ) : (
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl md:text-[28px] font-bold text-slate-900 tracking-tight truncate">
                          {profile?.full_name || profile?.username}
                        </h1>
                        <CheckCircle2 size={20} className={cn("shrink-0", theme.accent)} />
                      </div>
                    )}
                    <p className="text-[13px] text-slate-500 mt-1">
                      @{profile?.username} · <GraduationCap size={11} className="inline -mt-0.5" /> Học sinh
                    </p>
                    {profile?.pid && (
                      <button
                        onClick={() => { navigator.clipboard.writeText(profile.pid!); toast.success('Đã copy PID!'); }}
                        className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors text-[12px] font-mono font-semibold text-slate-700"
                        title="Click để copy PID"
                      >
                        <Hash size={11} /> {profile.pid}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {editMode ? (
                      <>
                        <button onClick={() => setEditMode(false)}
                          className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-slate-300 bg-white text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition-colors">
                          <X size={14} /> Hủy
                        </button>
                        <button onClick={handleFormSubmit(handleSaveProfile)} disabled={saving}
                          className={cn("inline-flex items-center gap-1.5 px-5 h-9 rounded-lg text-white text-[13px] font-semibold shadow-sm transition-colors disabled:opacity-60", theme.gradient)}>
                          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Lưu
                        </button>
                      </>
                    ) : (
                      <>
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors" title="QR Profile">
                              <QrCode size={15} />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-xs rounded-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-center font-bold text-slate-900">Mã QR của bạn</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col items-center p-4 gap-4">
                              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <QRCodeSVG id="my-profile-qr" value={profileUrl} size={180} level="H" />
                              </div>
                              <p className="text-[12px] text-center text-slate-500">
                                Người khác có thể quét mã này để xem hồ sơ của bạn
                              </p>
                              <Button className={cn("w-full gap-2 text-white rounded-xl font-semibold h-10", theme.gradient)} onClick={handleDownloadQR}>
                                <Download size={15} /> Tải mã QR
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <button onClick={() => setDrawerOpen(true)}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors" title="Tuỳ chỉnh">
                          <Settings size={15} />
                        </button>

                        <button onClick={() => { setActiveTab('posts'); setEditMode(false); }}
                          className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-lg border border-slate-300 bg-white text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition-colors">
                          <Plus size={14} /> Đăng bài
                        </button>

                        <button onClick={() => setEditMode(true)}
                          className={cn("inline-flex items-center gap-1.5 px-4 h-9 rounded-lg text-white text-[13px] font-semibold shadow-sm", theme.gradient)}>
                          <Edit3 size={14} /> Chỉnh sửa
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {!editMode && (
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-5 mb-5">
                  {[
                    { icon: BookOpen, value: myPosts.length, label: 'bài đăng', color: theme.accent, onClick: undefined },
                    { icon: Users, value: followersCount, label: 'người theo dõi', color: theme.accent, onClick: openFollowers },
                    { icon: Star, value: followingCount, label: 'đang theo dõi', color: theme.accent, onClick: openFollowing },
                  ].map((s, i) => {
                    const Icon = s.icon;
                    const Btn = s.onClick ? 'button' : 'div';
                    return (
                      <Btn
                        key={i}
                        onClick={s.onClick}
                        className={cn(
                          "flex flex-col items-center justify-center py-3 rounded-lg bg-slate-50 border border-slate-200 transition-colors",
                          s.onClick && "hover:bg-slate-100 cursor-pointer"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon size={14} className={s.color} />
                          <span className="text-lg md:text-xl font-bold text-slate-900 tabular-nums">{s.value}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-0.5 font-medium">{s.label}</span>
                      </Btn>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-4 md:px-6 py-2 flex gap-1 flex-wrap bg-slate-50">
              {([
                { key: 'posts' as const, label: 'Bài đăng', icon: BookOpen, show: true },
                { key: 'classrooms' as const, label: 'Lớp học', icon: GraduationCap, show: settings.show_classrooms },
                { key: 'certificates' as const, label: 'Chứng chỉ', icon: Award, show: settings.show_certificates },
                { key: 'about' as const, label: 'Về tôi', icon: Star, show: settings.show_hobbies },
              ] as const).filter(t => t.show).map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-[13.5px] font-semibold rounded-lg transition-colors",
                      activeTab === tab.key
                        ? cn(theme.bg, theme.accent)
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-4 mt-4 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 card-elevated">
              <h3 className="font-bold text-[15px] text-slate-900 mb-4 flex items-center gap-2.5">
                <span className={cn("w-1 h-5 rounded-full", theme.gradient)} />
                Giới thiệu
              </h3>

              {editMode ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Tiểu sử</label>
                    <CEditor control={control} name="bio" minHeight="120px" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10.5px] font-semibold text-slate-500 uppercase block mb-1.5">Địa chỉ</label>
                      <input {...form.register('address')} className="w-full text-[13px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 text-slate-900" placeholder="Địa chỉ" />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-semibold text-slate-500 uppercase block mb-1.5">Thành phố</label>
                      <input {...form.register('city')} className="w-full text-[13px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 text-slate-900" placeholder="Thành phố" />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-semibold text-slate-500 uppercase block mb-1.5">Quốc gia</label>
                      <input {...form.register('country')} className="w-full text-[13px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 text-slate-900" placeholder="Quốc gia" />
                    </div>
                    <div>
                      <label className="text-[10.5px] font-semibold text-slate-500 uppercase block mb-1.5">Điện thoại</label>
                      <input {...form.register('phone')} className="w-full text-[13px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 text-slate-900" placeholder="Số điện thoại" />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {settings.bio ? (
                    <div className="text-[13.5px] text-slate-700 leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: settings.bio }} />
                  ) : (
                    <p className="text-[13.5px] text-slate-400 italic mb-4">Chưa có thông tin giới thiệu</p>
                  )}
                  <div className="space-y-2">
                    {(settings.address || settings.city) && (
                      <div className="flex items-center gap-3 text-[13px] text-slate-800 rounded-lg px-3 py-2.5 bg-slate-50">
                        <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", theme.bg, theme.accent)}>
                          <MapPin size={14} />
                        </span>
                        <span className="truncate">{[settings.address, settings.city, settings.country].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-[13px] text-slate-800 rounded-lg px-3 py-2.5 bg-slate-50">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-700">
                        <GraduationCap size={14} />
                      </span>
                      <span>Học sinh</span>
                    </div>
                  </div>

                  {settings.show_links && (settings.metadata?.social_links?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200">
                      {settings.metadata.social_links!.map((link, i) => {
                        const Icon = SOCIAL_ICONS[link.platform] ?? Globe;
                        return (
                          <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                            className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border border-slate-200 hover:border-current transition-colors", theme.accent)}>
                            <Icon size={11} /> {link.label}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {settings.show_badges && badges.length > 0 && !editMode && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 card-elevated">
                <h3 className="font-bold text-[15px] text-slate-900 mb-4 flex items-center gap-2.5">
                  <span className={cn("w-1 h-5 rounded-full", theme.gradient)} />
                  Thành tích
                </h3>
                <div className="flex flex-wrap gap-2">
                  {badges.map((b, i) => (
                    <div key={i} title={b.desc} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-[12.5px] font-semibold text-slate-700">
                      <span>{b.icon}</span> {b.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {settings.show_stats && !editMode && (
              <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 card-elevated flex items-center gap-3">
                <span className={cn("px-2.5 py-1 rounded-full text-[11.5px] font-semibold border", theme.accent, theme.bg)}>
                  {settings.profile_visibility === 'public' ? '🔓 Công khai' : settings.profile_visibility === 'private' ? '🔒 Riêng tư' : '🏫 Lớp học'}
                </span>
                <span className="text-[12px] text-slate-500">Mức hiển thị</span>
              </div>
            )}
          </div>

          <div className="md:col-span-3 space-y-4">
            {!editMode && activeTab === 'posts' && (
              <CreatePost
                profile={profile ? { full_name: profile.full_name, avatar_url: profile.avatar_url } : null}
                onCreated={handlePostCreated}
              />
            )}

            {activeTab === 'posts' && (
              <div className="space-y-4">
                {myPosts.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-12 text-center card-elevated">
                    <div className={cn("w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center", theme.bg, theme.accent)}>
                      <BookOpen size={28} />
                    </div>
                    <p className="font-bold text-slate-900 text-[15px]">Chưa có bài đăng nào</p>
                    <p className="text-[12.5px] text-slate-500 mt-1">Hãy bắt đầu chia sẻ kiến thức của bạn!</p>
                  </div>
                ) : (
                  myPosts.map(post => (
                    <PostCard
                      key={post.uid}
                      post={post}
                      currentUserId={profile?.uid ?? null}
                      onLike={handleLikePost}
                      onDelete={handleDeletePost}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'classrooms' && settings.show_classrooms && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {classrooms.length === 0 ? (
                  <p className="text-slate-500 text-[13px] col-span-2 py-10 text-center bg-white border border-slate-200 rounded-xl">Chưa tham gia lớp học nào.</p>
                ) : classrooms.map(cls => (
                  <div key={cls.uid} onClick={() => router.push(`/consumer/classroom/${cls.uid}`)}
                    className="group bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-indigo-300 cursor-pointer transition-colors card-elevated">
                    <div className={cn("w-10 h-10 rounded-lg mb-3 flex items-center justify-center text-white font-bold text-[13px]", theme.gradient)}>
                      {cls.name.slice(0, 2).toUpperCase()}
                    </div>
                    <h3 className="font-semibold text-slate-900 text-[14px] leading-snug">{cls.name}</h3>
                    {cls.description && <p className="text-[12px] text-slate-500 mt-1 line-clamp-2">{cls.description}</p>}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                      <span className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-wider">{cls.pid}</span>
                      <ChevronRight size={13} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'certificates' && settings.show_certificates && (
              <CertificatesTab
                certificates={settings.metadata?.certificates ?? []}
                theme={theme}
                onUpdate={certs => updateMetadata({ certificates: certs })}
              />
            )}

            {activeTab === 'about' && (
              <AboutTab
                settings={settings}
                theme={theme}
                onUpdateMeta={updateMetadata}
              />
            )}
          </div>
        </div>
      </Form>

      {drawerOpen && (
        <SettingsDrawer
          settings={settings}
          theme={theme}
          onClose={() => setDrawerOpen(false)}
          onSave={handleSaveSettings}
        />
      )}

      {modalMode !== 'none' && (
        <FollowersModal
          title={modalMode === 'followers' ? 'Người theo dõi' : 'Đang theo dõi'}
          users={modalUsers}
          onClose={() => setModalMode('none')}
          theme={theme}
        />
      )}
    </div>
  );
}

function CertificatesTab({ certificates, theme, onUpdate }: {
  certificates: Certificate[];
  theme: ThemeConfig;
  onUpdate: (certs: Certificate[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Certificate>({ title: '', issuer: '', issued_date: '', url: '' });

  const add = () => {
    if (!form.title || !form.issuer) return;
    onUpdate([...certificates, form]);
    setForm({ title: '', issuer: '', issued_date: '', url: '' });
    setAdding(false);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {certificates.map((cert, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-3 group card-elevated">
            <div className={cn("w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0 text-white", theme.gradient)}>🏅</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900 text-[13.5px]">{cert.title}</div>
              <div className="text-[11.5px] text-slate-500 mt-0.5">{cert.issuer} · {cert.issued_date}</div>
              {cert.url && (
                <a href={cert.url} target="_blank" rel="noopener noreferrer"
                  className={cn("inline-flex items-center gap-1 text-[12px] font-semibold mt-1.5", theme.accent)}>
                  <ExternalLink size={11} /> Xem chứng chỉ
                </a>
              )}
            </div>
            <button onClick={() => onUpdate(certificates.filter((_, j) => j !== i))}
              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-all self-start">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Tên chứng chỉ *" className="col-span-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-900 outline-none focus:border-indigo-500" />
            <input value={form.issuer} onChange={e => setForm(p => ({ ...p, issuer: e.target.value }))}
              placeholder="Tổ chức cấp *" className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-900 outline-none focus:border-indigo-500" />
            <input value={form.issued_date} onChange={e => setForm(p => ({ ...p, issued_date: e.target.value }))}
              placeholder="Ngày cấp (VD: 2024-03)" className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-900 outline-none focus:border-indigo-500" />
            <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
              placeholder="Link chứng chỉ" className="col-span-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-900 outline-none focus:border-indigo-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={add} className={cn("flex-1 py-2 rounded-lg text-white text-[13px] font-semibold", theme.gradient)}>Thêm</button>
            <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-lg border border-slate-300 text-[13px] font-semibold text-slate-700 hover:bg-slate-100">Hủy</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full py-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 text-slate-500 hover:text-indigo-600 text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors">
          <Plus size={15} /> Thêm chứng chỉ
        </button>
      )}
    </div>
  );
}

function AboutTab({ settings, theme, onUpdateMeta }: {
  settings: StudentProfileSettings;
  theme: ThemeConfig;
  onUpdateMeta: (patch: Partial<typeof settings.metadata>) => void;
}) {
  const meta = settings.metadata ?? {};
  const hobbies = meta.hobbies ?? [];
  const social_links = meta.social_links ?? [];
  const custom_fields = meta.custom_fields ?? [];

  const [newHobby, setNewHobby] = useState('');
  const [newLink, setNewLink] = useState<SocialLink>({ platform: 'github', url: '', label: '' });
  const [newField, setNewField] = useState<CustomField>({ key: '', value: '' });
  const [addingLink, setAddingLink] = useState(false);
  const [addingField, setAddingField] = useState(false);

  return (
    <div className="space-y-3">
      {settings.show_hobbies && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 card-elevated">
          <h3 className="text-[14px] font-bold text-slate-900 mb-3">🎯 Sở thích</h3>
          <div className="flex flex-wrap gap-2">
            {hobbies.map((h, i) => (
              <span key={i} className={cn("group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12.5px] font-semibold border border-slate-200", theme.bg, theme.accent)}>
                {h}
                <button onClick={() => onUpdateMeta({ hobbies: hobbies.filter((_, j) => j !== i) })}
                  className="opacity-0 group-hover:opacity-100 text-current/50 hover:text-current transition-all">
                  <X size={11} />
                </button>
              </span>
            ))}
            <form onSubmit={e => { e.preventDefault(); if (newHobby.trim()) { onUpdateMeta({ hobbies: [...hobbies, newHobby.trim()] }); setNewHobby(''); } }}
              className="flex items-center gap-1">
              <input value={newHobby} onChange={e => setNewHobby(e.target.value)}
                placeholder="+ Thêm sở thích"
                className="text-[12.5px] bg-slate-50 border border-dashed border-slate-300 rounded-full px-3 py-1.5 outline-none focus:border-slate-400 text-slate-900 w-36" />
            </form>
          </div>
        </div>
      )}

      {settings.show_links && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 card-elevated">
          <h3 className="text-[14px] font-bold text-slate-900 mb-3">🔗 Liên kết</h3>
          <div className="space-y-2">
            {social_links.map((link, i) => {
              const Icon = SOCIAL_ICONS[link.platform] ?? Globe;
              return (
                <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 group">
                  <Icon size={15} className={theme.accent} />
                  <span className="font-semibold text-[13px] text-slate-900">{link.label}</span>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-slate-500 truncate flex-1 hover:text-slate-900 transition-colors">{link.url}</a>
                  <button onClick={() => onUpdateMeta({ social_links: social_links.filter((_, j) => j !== i) })}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {addingLink ? (
            <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex gap-2">
                <select value={newLink.platform} onChange={e => setNewLink(p => ({ ...p, platform: e.target.value }))}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-900 outline-none">
                  {['github', 'facebook', 'linkedin', 'twitter', 'instagram', 'website'].map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
                <input value={newLink.label} onChange={e => setNewLink(p => ({ ...p, label: e.target.value }))}
                  placeholder="Nhãn (VD: GitHub cá nhân)" className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-900 outline-none" />
              </div>
              <input value={newLink.url} onChange={e => setNewLink(p => ({ ...p, url: e.target.value }))}
                placeholder="https://..." className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-900 outline-none" />
              <div className="flex gap-2">
                <button onClick={() => { if (newLink.url && newLink.label) { onUpdateMeta({ social_links: [...social_links, newLink] }); setNewLink({ platform: 'github', url: '', label: '' }); setAddingLink(false); } }}
                  className={cn("flex-1 py-2 rounded-lg text-white text-[13px] font-semibold", theme.gradient)}>Thêm</button>
                <button onClick={() => setAddingLink(false)} className="flex-1 py-2 rounded-lg border border-slate-300 text-[13px] font-semibold text-slate-700 hover:bg-slate-100">Hủy</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingLink(true)}
              className="mt-2 w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 text-slate-500 hover:text-indigo-600 text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors">
              <Plus size={14} /> Thêm link
            </button>
          )}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5 card-elevated">
        <h3 className="text-[14px] font-bold text-slate-900 mb-3">📋 Thông tin thêm</h3>
        <div className="space-y-2">
          {custom_fields.map((f, i) => (
            <div key={i} className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 group">
              <span className="text-[11px] font-bold text-slate-500 uppercase w-28 shrink-0">{f.key}</span>
              <span className="text-[13px] text-slate-900 flex-1">{f.value}</span>
              <button onClick={() => onUpdateMeta({ custom_fields: custom_fields.filter((_, j) => j !== i) })}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-all">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {addingField ? (
          <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex gap-2">
              <input value={newField.key} onChange={e => setNewField(p => ({ ...p, key: e.target.value }))}
                placeholder="Nhãn (VD: Trường học)" className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-900 outline-none" />
              <input value={newField.value} onChange={e => setNewField(p => ({ ...p, value: e.target.value }))}
                placeholder="Giá trị" className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-900 outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { if (newField.key && newField.value) { onUpdateMeta({ custom_fields: [...custom_fields, newField] }); setNewField({ key: '', value: '' }); setAddingField(false); } }}
                className={cn("flex-1 py-2 rounded-lg text-white text-[13px] font-semibold", theme.gradient)}>Thêm</button>
              <button onClick={() => setAddingField(false)} className="flex-1 py-2 rounded-lg border border-slate-300 text-[13px] font-semibold text-slate-700 hover:bg-slate-100">Hủy</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingField(true)}
            className="mt-2 w-full py-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 text-slate-500 hover:text-indigo-600 text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors">
            <Plus size={14} /> Thêm thông tin
          </button>
        )}
      </div>
    </div>
  );
}

function SettingsDrawer({ settings, theme, onClose, onSave }: {
  settings: StudentProfileSettings;
  theme: ThemeConfig;
  onClose: () => void;
  onSave: (patch: Partial<StudentProfileSettings>) => void;
}) {
  const [local, setLocal] = useState(settings);
  const set = (patch: Partial<StudentProfileSettings>) => setLocal(p => ({ ...p, ...patch }));

  const TOGGLE_SECTIONS = [
    { key: 'show_stats' as const,        label: 'Thanh thống kê' },
    { key: 'show_classrooms' as const,   label: 'Lớp học' },
    { key: 'show_grades' as const,       label: 'Điểm số & Bài thi' },
    { key: 'show_badges' as const,       label: 'Badges / Thành tích' },
    { key: 'show_address' as const,      label: 'Địa chỉ' },
    { key: 'show_links' as const,        label: 'Liên kết mạng xã hội' },
    { key: 'show_hobbies' as const,      label: 'Sở thích' },
    { key: 'show_certificates' as const, label: 'Chứng chỉ ngoài' },
    { key: 'show_activity' as const,     label: 'Hoạt động gần đây' },
    { key: 'show_contact' as const,      label: 'Thông tin liên hệ' },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/50 z-40 animate-fade-in" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-80 sm:w-96 bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={15} className="text-indigo-600" />
              Tuỳ chỉnh Profile
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">Cá nhân hoá giao diện của bạn</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-3">🎨 Màu chủ đạo</p>
            <div className="flex gap-2.5">
              {(Object.keys(THEMES) as ThemeColor[]).map(c => (
                <button key={c} onClick={() => set({ theme_color: c })}
                  className={cn(`w-9 h-9 rounded-full transition-all shadow-sm`,
                    local.theme_color === c ? 'ring-2 ring-offset-2 ring-offset-white ring-slate-900 scale-110' : 'hover:scale-105'
                  )}>
                  <span className={cn("w-full h-full rounded-full block", THEMES[c].gradient)} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-3">🖼️ Kiểu cover</p>
            <div className="flex gap-2">
              {(['gradient', 'solid', 'mesh'] as CoverStyle[]).map(s => (
                <button key={s} onClick={() => set({ cover_style: s })}
                  className={cn("flex-1 py-2 rounded-lg text-[12px] font-semibold transition-colors border",
                    local.cover_style === s ? cn("border-current", theme.accent, theme.bg) : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  )}>
                  {s === 'gradient' ? 'Gradient' : s === 'solid' ? 'Solid' : 'Mesh'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-3">👁️ Hiện / Ẩn mục</p>
            <div className="space-y-1">
              {TOGGLE_SECTIONS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors">
                  <span className="text-[13px] font-medium text-slate-800">{label}</span>
                  <button onClick={() => set({ [key]: !local[key] })}
                    className={cn("relative w-10 h-5.5 rounded-full transition-colors", local[key] ? 'bg-indigo-600' : 'bg-slate-300')}>
                    <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", local[key] ? 'translate-x-5' : 'translate-x-0.5')} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-3">🔒 Ai xem được?</p>
            <div className="space-y-1">
              {([
                { v: 'public' as ProfileVisibility, label: '🔓 Công khai', desc: 'Ai cũng xem được' },
                { v: 'class_only' as ProfileVisibility, label: '🏫 Lớp học', desc: 'Chỉ giáo viên lớp' },
                { v: 'private' as ProfileVisibility, label: '🔒 Riêng tư', desc: 'Chỉ mình tôi' },
              ]).map(({ v, label, desc }) => (
                <button key={v} onClick={() => set({ profile_visibility: v })}
                  className={cn("w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left",
                    local.profile_visibility === v ? cn(theme.bg, theme.accent, "border border-current") : 'border border-transparent hover:bg-slate-100 text-slate-800'
                  )}>
                  <span className="text-[13px] font-semibold">{label}</span>
                  <span className="text-[11.5px] text-slate-500">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-200">
          <button onClick={() => { onSave(local); onClose(); }}
            className={cn("w-full py-2.5 rounded-lg text-white font-semibold text-[13px] shadow-sm", theme.gradient)}>
            💾 Lưu cài đặt
          </button>
        </div>
      </div>
    </>
  );
}
