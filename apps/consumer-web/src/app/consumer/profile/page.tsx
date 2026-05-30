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
  BookOpen, Award, Edit3, Eye, EyeOff, ChevronRight, Loader2,
  GraduationCap, Star, Flame, CheckCircle, Upload, Users, QrCode, Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@shared/lib/utils';

// ── Theme config ──────────────────────────────────────────────────────────────

type ThemeConfig = { gradient: string; accent: string; bg: string; ring: string };

const THEMES: Record<ThemeColor, ThemeConfig> = {
  indigo:  { gradient: 'from-indigo-500 via-indigo-600 to-violet-600',  accent: 'text-indigo-600',  bg: 'bg-indigo-50 dark:bg-indigo-950/30',  ring: 'ring-indigo-500' },
  rose:    { gradient: 'from-rose-400 via-pink-500 to-rose-600',        accent: 'text-rose-600',    bg: 'bg-rose-50 dark:bg-rose-950/30',      ring: 'ring-rose-500' },
  emerald: { gradient: 'from-emerald-400 via-teal-500 to-emerald-600',  accent: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30',ring: 'ring-emerald-500' },
  amber:   { gradient: 'from-amber-400 via-orange-500 to-amber-600',    accent: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-950/30',    ring: 'ring-amber-500' },
  violet:  { gradient: 'from-violet-500 via-purple-600 to-violet-700',  accent: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-950/30',  ring: 'ring-violet-500' },
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

// ── Badges ────────────────────────────────────────────────────────────────────

function computeBadges(classrooms: Classroom[], totalSubmissions: number, avgGrade: number | null) {
  const badges = [];
  if (classrooms.length >= 3)    badges.push({ icon: '📚', label: 'Chăm chỉ', desc: 'Tham gia ≥ 3 lớp' });
  if (totalSubmissions >= 5)     badges.push({ icon: '🔥', label: 'Siêng năng', desc: 'Đã nộp ≥ 5 bài' });
  if (avgGrade !== null && avgGrade >= 9.0) badges.push({ icon: '⭐', label: 'Xuất sắc', desc: 'Điểm TB ≥ 9.0' });
  if (classrooms.length >= 1)    badges.push({ icon: '✅', label: 'Học viên', desc: 'Đang học tại LMS' });
  return badges;
}

// ── Default settings ──────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────

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
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const [modalMode, setModalMode] = useState<'none' | 'followers' | 'following'>('none');
  const [modalUsers, setModalUsers] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

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
  }, [isAuthenticated, router, dispatch]);

  const theme = THEMES[settings.theme_color] ?? THEMES.indigo;
  const badges = computeBadges(classrooms, 0, null);

  const coverStyle = settings.cover_style === 'mesh'
    ? { background: MESH_COVERS[settings.theme_color] }
    : {};

  const coverClass = settings.cover_style !== 'mesh'
    ? `bg-gradient-to-br ${theme.gradient}`
    : '';

  const handleSaveProfile = async (data: any) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('full_name', data.full_name);
      formData.append('phone', data.phone);
      if (avatarFile) formData.append('avatar', avatarFile);
      const updated = await accountService.updateProfile(formData) as any;
      dispatch(setProfile(updated.data ?? updated));

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

  const handlePostCreated = (post: any) => {
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
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-b from-muted/40 to-background">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-muted" />
          <Loader2 className="animate-spin text-indigo-600 absolute inset-0 m-auto" size={40} />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Đang tải hồ sơ...</p>
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
    <div className="min-h-screen bg-gradient-to-b from-muted/40 via-background to-background pb-24">
      {/* ── Cover Photo ── */}
      <div className={cn(`h-[240px] md:h-[360px] w-full relative overflow-hidden`, coverClass)} style={coverStyle}>
        {settings.cover_style === 'mesh' && <div className="absolute inset-0 bg-black/10" />}
        {/* decorative blurred orbs */}
        <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-10 right-0 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        {/* subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
      </div>

      {/* ── Profile Card + Tabs ── */}
      <Form {...form}>
        <div className="max-w-[1400px] mx-auto px-4 -mt-20 md:-mt-24 relative z-10">
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-3xl shadow-xl shadow-black/5">
            <div className="px-5 md:px-8 pt-5">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                {/* Avatar */}
                <div className="shrink-0 -mt-24 sm:-mt-28 relative">
                  <div className="relative inline-block group">
                    <div className={cn("absolute -inset-1 rounded-full bg-gradient-to-br opacity-70 blur-sm transition group-hover:opacity-100", theme.gradient)} />
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={profile?.full_name}
                        className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-card shadow-2xl object-cover" />
                    ) : (
                      <div className={cn("relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-card shadow-2xl flex items-center justify-center text-white text-4xl md:text-5xl font-black", `bg-gradient-to-br ${theme.gradient}`)}>
                        {initials}
                      </div>
                    )}
                    {/* online dot */}
                    {!editMode && <span className="absolute bottom-2 right-2 md:bottom-3 md:right-3 w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-card shadow" />}
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

                {/* Name + Actions */}
                <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between pb-1 gap-4">
                  <div className="flex-1 min-w-0">
                    {editMode ? (
                      <input {...form.register('full_name')}
                        className="text-2xl md:text-[28px] font-black bg-transparent border-b-2 border-border focus:border-indigo-500 outline-none text-foreground w-full mb-1" placeholder="Họ và tên" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl md:text-[28px] font-black text-foreground leading-tight truncate">
                          {profile?.full_name || profile?.username}
                        </h1>
                        <CheckCircle size={22} className={cn("shrink-0", theme.accent)} />
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">@{profile?.username} · 🎓 Học sinh</p>
                    {profile?.pid && (
                      <button
                        onClick={() => { navigator.clipboard.writeText(profile.pid); toast.success('Đã copy PID!'); }}
                        className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border hover:bg-muted transition-all text-xs font-mono font-bold text-muted-foreground hover:text-foreground"
                        title="Click để copy PID"
                      >
                        🪪 {profile.pid}
                      </button>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {editMode ? (
                      <>
                        <button onClick={() => setEditMode(false)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-foreground text-sm font-semibold hover:bg-muted transition-all">
                          <X size={15} /> Hủy
                        </button>
                        <button onClick={handleFormSubmit(handleSaveProfile)} disabled={saving}
                          className={cn("flex items-center gap-1.5 px-5 py-2 rounded-xl text-white text-sm font-semibold shadow-md transition-all disabled:opacity-60", `bg-gradient-to-r ${theme.gradient}`)}>
                          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Lưu
                        </button>
                      </>
                    ) : (
                      <>
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border text-foreground text-sm font-semibold hover:bg-muted transition-all" title="QR Profile">
                              <QrCode size={16} />
                            </button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-xs rounded-3xl">
                            <DialogHeader>
                              <DialogTitle className="text-center font-bold">Mã QR của bạn</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col items-center p-4 gap-5">
                              <div className="bg-white p-5 rounded-2xl border border-border shadow-lg">
                                <QRCodeSVG id="my-profile-qr" value={profileUrl} size={200} level="H" />
                              </div>
                              <p className="text-xs text-center text-muted-foreground">Người khác có thể quét mã này để xem hồ sơ của bạn</p>
                              <Button className={cn("w-full gap-2 text-white rounded-xl font-bold h-11", `bg-gradient-to-r ${theme.gradient}`)} onClick={handleDownloadQR}>
                                <Download size={16} /> Tải mã QR
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <button onClick={() => setDrawerOpen(true)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border text-foreground text-sm font-semibold hover:bg-muted transition-all" title="Tuỳ chỉnh">
                          <Settings size={16} />
                        </button>

                        <button onClick={() => { setActiveTab('posts'); setEditMode(false); }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-foreground text-sm font-semibold hover:bg-muted transition-all">
                          <Plus size={15} /> Đăng bài
                        </button>

                        <button onClick={() => setEditMode(true)}
                          className={cn("flex items-center gap-1.5 px-5 py-2 rounded-xl text-white text-sm font-semibold shadow-md", `bg-gradient-to-r ${theme.gradient}`)}>
                          <Edit3 size={15} /> Chỉnh sửa
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              {!editMode && (
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-5 mb-5">
                  <div className="flex flex-col items-center justify-center py-3 rounded-2xl bg-muted/40 border border-border/60 transition-all hover:bg-muted/70 hover:-translate-y-0.5 hover:shadow-sm cursor-default">
                    <div className="flex items-center gap-1.5">
                      <BookOpen size={15} className={theme.accent} />
                      <span className="text-lg md:text-xl font-black text-foreground">{myPosts.length}</span>
                    </div>
                    <span className="text-[11px] md:text-xs text-muted-foreground mt-0.5">bài đăng</span>
                  </div>
                  <button onClick={openFollowers}
                    className="flex flex-col items-center justify-center py-3 rounded-2xl bg-muted/40 border border-border/60 transition-all hover:bg-muted/70 hover:-translate-y-0.5 hover:shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <Users size={15} className={theme.accent} />
                      <span className="text-lg md:text-xl font-black text-foreground">{followersCount}</span>
                    </div>
                    <span className="text-[11px] md:text-xs text-muted-foreground mt-0.5">người theo dõi</span>
                  </button>
                  <button onClick={openFollowing}
                    className="flex flex-col items-center justify-center py-3 rounded-2xl bg-muted/40 border border-border/60 transition-all hover:bg-muted/70 hover:-translate-y-0.5 hover:shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <Star size={15} className={theme.accent} />
                      <span className="text-lg md:text-xl font-black text-foreground">{followingCount}</span>
                    </div>
                    <span className="text-[11px] md:text-xs text-muted-foreground mt-0.5">đang theo dõi</span>
                  </button>
                </div>
              )}
            </div>

            {/* ── Tabs ── */}
            <div className="border-t border-border px-4 md:px-6 py-2 flex gap-1 flex-wrap">
              {([
                { key: 'posts', label: 'Bài đăng', icon: BookOpen, show: true },
                { key: 'classrooms', label: 'Lớp học', icon: GraduationCap, show: settings.show_classrooms },
                { key: 'certificates', label: 'Chứng chỉ', icon: Award, show: settings.show_certificates },
                { key: 'about', label: 'Về tôi', icon: Star, show: settings.show_hobbies },
              ] as const).filter(t => t.show).map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 text-[15px] font-semibold rounded-xl transition-all",
                    activeTab === tab.key
                      ? cn(theme.bg, theme.accent, "shadow-sm")
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}>
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Two-column Content ── */}
        <div className="max-w-[1400px] mx-auto px-4 mt-4 grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Left Sidebar */}
          <div className="md:col-span-2 space-y-4">
            {/* Intro card */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <h3 className="font-black text-lg text-foreground mb-4 flex items-center gap-2">
                <span className={cn("w-1.5 h-5 rounded-full bg-gradient-to-b", theme.gradient)} />
                Giới thiệu
              </h3>

              {editMode ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Tiểu sử</label>
                    <CEditor control={control} name="bio" minHeight="120px" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Địa chỉ</label>
                      <input {...form.register('address')} className="w-full text-sm bg-muted/50 border border-border rounded-xl px-3 py-2 outline-none focus:border-indigo-400 text-foreground" placeholder="Địa chỉ" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Thành phố</label>
                      <input {...form.register('city')} className="w-full text-sm bg-muted/50 border border-border rounded-xl px-3 py-2 outline-none focus:border-indigo-400 text-foreground" placeholder="Thành phố" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Quốc gia</label>
                      <input {...form.register('country')} className="w-full text-sm bg-muted/50 border border-border rounded-xl px-3 py-2 outline-none focus:border-indigo-400 text-foreground" placeholder="Quốc gia" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Điện thoại</label>
                      <input {...form.register('phone')} className="w-full text-sm bg-muted/50 border border-border rounded-xl px-3 py-2 outline-none focus:border-indigo-400 text-foreground" placeholder="Số điện thoại" />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {settings.bio ? (
                    <div className="text-sm text-muted-foreground leading-relaxed tiptap-content mb-4" dangerouslySetInnerHTML={{ __html: settings.bio }} />
                  ) : (
                    <p className="text-sm text-muted-foreground italic mb-4">Chưa có thông tin giới thiệu</p>
                  )}
                  <div className="space-y-2.5">
                    {(settings.address || settings.city) && (
                      <div className="flex items-center gap-3 text-sm text-foreground/90 rounded-xl px-3 py-2.5 bg-muted/30">
                        <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", theme.bg, theme.accent)}>
                          <MapPin size={16} />
                        </span>
                        <span className="truncate">{[settings.address, settings.city, settings.country].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm text-foreground/90 rounded-xl px-3 py-2.5 bg-muted/30">
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
                        <GraduationCap size={16} />
                      </span>
                      <span>Học sinh</span>
                    </div>
                  </div>

                  {settings.show_links && (settings.metadata?.social_links?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/60">
                      {settings.metadata.social_links!.map((link, i) => {
                        const Icon = SOCIAL_ICONS[link.platform] ?? Globe;
                        return (
                          <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                            className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-border hover:border-current transition-all", theme.accent)}>
                            <Icon size={12} /> {link.label}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Badges card */}
            {settings.show_badges && badges.length > 0 && !editMode && (
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                <h3 className="font-black text-base text-foreground mb-4 flex items-center gap-2">
                  <span className={cn("w-1.5 h-5 rounded-full bg-gradient-to-b", theme.gradient)} />
                  Thành tích
                </h3>
                <div className="flex flex-wrap gap-2">
                  {badges.map((b, i) => (
                    <div key={i} title={b.desc} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border/60 bg-muted/40 text-xs font-semibold text-foreground transition-transform hover:scale-105">
                      <span>{b.icon}</span> {b.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visibility badge */}
            {settings.show_stats && !editMode && (
              <div className="bg-card border border-border rounded-3xl px-6 py-4 shadow-sm flex items-center gap-3">
                <span className={cn("px-3 py-1 rounded-full text-xs font-bold border border-current", theme.accent, theme.bg)}>
                  {settings.profile_visibility === 'public' ? '🔓 Công khai' : settings.profile_visibility === 'private' ? '🔒 Riêng tư' : '🏫 Lớp học'}
                </span>
                <span className="text-xs text-muted-foreground">Mức hiển thị</span>
              </div>
            )}
          </div>

          {/* Right Main Content */}
          <div className="md:col-span-3 space-y-4">
            {/* Create post */}
            {!editMode && activeTab === 'posts' && (
              <CreatePost
                profile={profile ? { full_name: profile.full_name, avatar_url: profile.avatar_url } : null}
                onCreated={handlePostCreated}
              />
            )}

            {/* Tab: Posts */}
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {myPosts.length === 0 ? (
                  <div className="bg-card border border-border rounded-3xl p-14 text-center shadow-sm">
                    <div className={cn("w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center", theme.bg, theme.accent)}>
                      <BookOpen size={34} />
                    </div>
                    <p className="font-bold text-foreground text-lg">Chưa có bài đăng nào</p>
                    <p className="text-sm text-muted-foreground mt-1">Hãy bắt đầu chia sẻ kiến thức của bạn!</p>
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

            {/* Tab: Classrooms */}
            {activeTab === 'classrooms' && settings.show_classrooms && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {classrooms.length === 0 ? (
                  <p className="text-muted-foreground text-sm col-span-2 py-12 text-center bg-card border border-border rounded-2xl shadow-sm">Chưa tham gia lớp học nào.</p>
                ) : classrooms.map(cls => (
                  <div key={cls.uid} onClick={() => router.push(`/consumer/classroom/${cls.uid}`)}
                    className="bg-card border border-border rounded-2xl p-5 hover:shadow-md cursor-pointer transition-all group shadow-sm">
                    <div className={cn("w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-white font-black text-sm", `bg-gradient-to-br ${theme.gradient}`)}>
                      {cls.name.slice(0, 2).toUpperCase()}
                    </div>
                    <h3 className="font-bold text-foreground text-sm leading-snug">{cls.name}</h3>
                    {cls.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cls.description}</p>}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{cls.pid}</span>
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Certificates */}
            {activeTab === 'certificates' && settings.show_certificates && (
              <CertificatesTab
                certificates={settings.metadata?.certificates ?? []}
                theme={theme}
                onUpdate={certs => updateMetadata({ certificates: certs })}
              />
            )}

            {/* Tab: About */}
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

// ── Certificates Tab ──────────────────────────────────────────────────────────

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
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {certificates.map((cert, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5 flex gap-4 group shadow-sm">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0", `bg-gradient-to-br ${theme.gradient}`, "text-white")}>🏅</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-foreground text-sm">{cert.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{cert.issuer} · {cert.issued_date}</div>
              {cert.url && (
                <a href={cert.url} target="_blank" rel="noopener noreferrer"
                  className={cn("flex items-center gap-1 text-xs font-bold mt-1.5", theme.accent)}>
                  <ExternalLink size={11} /> Xem chứng chỉ
                </a>
              )}
            </div>
            <button onClick={() => onUpdate(certificates.filter((_, j) => j !== i))}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500 transition-all self-start">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="bg-muted/50 border border-border rounded-2xl p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Tên chứng chỉ *" className="col-span-2 bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-400" />
            <input value={form.issuer} onChange={e => setForm(p => ({ ...p, issuer: e.target.value }))}
              placeholder="Tổ chức cấp *" className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-400" />
            <input value={form.issued_date} onChange={e => setForm(p => ({ ...p, issued_date: e.target.value }))}
              placeholder="Ngày cấp (VD: 2024-03)" className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-400" />
            <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
              placeholder="Link chứng chỉ" className="col-span-2 bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none focus:border-indigo-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={add} className={cn("flex-1 py-2 rounded-xl text-white text-sm font-bold", `bg-gradient-to-r ${theme.gradient}`)}>Thêm</button>
            <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-muted">Hủy</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-border hover:border-current text-muted-foreground hover:text-foreground text-sm font-bold flex items-center justify-center gap-2 transition-all">
          <Plus size={16} /> Thêm chứng chỉ
        </button>
      )}
    </div>
  );
}

// ── About Tab ─────────────────────────────────────────────────────────────────

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
    <div className="space-y-4">
      {/* Hobbies */}
      {settings.show_hobbies && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="text-[15px] font-black text-foreground mb-3">🎯 Sở thích</h3>
          <div className="flex flex-wrap gap-2">
            {hobbies.map((h, i) => (
              <span key={i} className={cn("group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border border-border", theme.bg, theme.accent)}>
                {h}
                <button onClick={() => onUpdateMeta({ hobbies: hobbies.filter((_, j) => j !== i) })}
                  className="opacity-0 group-hover:opacity-100 text-current/50 hover:text-current transition-all">
                  <X size={12} />
                </button>
              </span>
            ))}
            <form onSubmit={e => { e.preventDefault(); if (newHobby.trim()) { onUpdateMeta({ hobbies: [...hobbies, newHobby.trim()] }); setNewHobby(''); } }}
              className="flex items-center gap-1">
              <input value={newHobby} onChange={e => setNewHobby(e.target.value)}
                placeholder="+ Thêm sở thích"
                className="text-sm bg-muted/50 border border-dashed border-border rounded-full px-3 py-1.5 outline-none focus:border-current text-foreground w-36" />
            </form>
          </div>
        </div>
      )}

      {/* Social links */}
      {settings.show_links && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="text-[15px] font-black text-foreground mb-3">🔗 Liên kết</h3>
          <div className="space-y-2">
            {social_links.map((link, i) => {
              const Icon = SOCIAL_ICONS[link.platform] ?? Globe;
              return (
                <div key={i} className="flex items-center gap-3 bg-muted/30 border border-border/60 rounded-xl px-4 py-2.5 group">
                  <Icon size={16} className={theme.accent} />
                  <span className="font-semibold text-sm text-foreground">{link.label}</span>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground truncate flex-1">{link.url}</a>
                  <button onClick={() => onUpdateMeta({ social_links: social_links.filter((_, j) => j !== i) })}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {addingLink ? (
            <div className="mt-2 bg-muted/50 border border-border rounded-2xl p-4 space-y-2">
              <div className="flex gap-2">
                <select value={newLink.platform} onChange={e => setNewLink(p => ({ ...p, platform: e.target.value }))}
                  className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none">
                  {['github', 'facebook', 'linkedin', 'twitter', 'instagram', 'website'].map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
                <input value={newLink.label} onChange={e => setNewLink(p => ({ ...p, label: e.target.value }))}
                  placeholder="Nhãn (VD: GitHub cá nhân)" className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none" />
              </div>
              <input value={newLink.url} onChange={e => setNewLink(p => ({ ...p, url: e.target.value }))}
                placeholder="https://..." className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none" />
              <div className="flex gap-2">
                <button onClick={() => { if (newLink.url && newLink.label) { onUpdateMeta({ social_links: [...social_links, newLink] }); setNewLink({ platform: 'github', url: '', label: '' }); setAddingLink(false); } }}
                  className={cn("flex-1 py-2 rounded-xl text-white text-sm font-bold", `bg-gradient-to-r ${theme.gradient}`)}>Thêm</button>
                <button onClick={() => setAddingLink(false)} className="flex-1 py-2 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-muted">Hủy</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAddingLink(true)}
              className="mt-2 w-full py-2.5 rounded-xl border-2 border-dashed border-border hover:border-current text-muted-foreground hover:text-foreground text-sm font-bold flex items-center justify-center gap-2 transition-all">
              <Plus size={14} /> Thêm link
            </button>
          )}
        </div>
      )}

      {/* Custom fields */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <h3 className="text-[15px] font-black text-foreground mb-3">📋 Thông tin thêm</h3>
        <div className="space-y-2">
          {custom_fields.map((f, i) => (
            <div key={i} className="flex items-center gap-4 bg-muted/30 border border-border/60 rounded-xl px-4 py-2.5 group">
              <span className="text-xs font-black text-muted-foreground uppercase w-28 shrink-0">{f.key}</span>
              <span className="text-sm text-foreground flex-1">{f.value}</span>
              <button onClick={() => onUpdateMeta({ custom_fields: custom_fields.filter((_, j) => j !== i) })}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500 transition-all">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {addingField ? (
          <div className="mt-2 bg-muted/50 border border-border rounded-2xl p-4 space-y-2">
            <div className="flex gap-2">
              <input value={newField.key} onChange={e => setNewField(p => ({ ...p, key: e.target.value }))}
                placeholder="Nhãn (VD: Trường học)" className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none" />
              <input value={newField.value} onChange={e => setNewField(p => ({ ...p, value: e.target.value }))}
                placeholder="Giá trị" className="flex-1 bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground outline-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { if (newField.key && newField.value) { onUpdateMeta({ custom_fields: [...custom_fields, newField] }); setNewField({ key: '', value: '' }); setAddingField(false); } }}
                className={cn("flex-1 py-2 rounded-xl text-white text-sm font-bold", `bg-gradient-to-r ${theme.gradient}`)}>Thêm</button>
              <button onClick={() => setAddingField(false)} className="flex-1 py-2 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-muted">Hủy</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingField(true)}
            className="mt-2 w-full py-2.5 rounded-xl border-2 border-dashed border-border hover:border-current text-muted-foreground hover:text-foreground text-sm font-bold flex items-center justify-center gap-2 transition-all">
            <Plus size={14} /> Thêm thông tin
          </button>
        )}
      </div>
    </div>
  );
}

// ── Settings Drawer ───────────────────────────────────────────────────────────

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
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-80 bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-black text-foreground">⚙️ Tuỳ chỉnh Profile</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Theme color */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">🎨 Màu chủ đạo</p>
            <div className="flex gap-2">
              {(Object.keys(THEMES) as ThemeColor[]).map(c => (
                <button key={c} onClick={() => set({ theme_color: c })}
                  className={cn(`w-8 h-8 rounded-full bg-gradient-to-br ${THEMES[c].gradient} transition-all`, local.theme_color === c ? 'ring-2 ring-offset-2 ring-current scale-110' : 'hover:scale-105')} />
              ))}
            </div>
          </div>

          {/* Cover style */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">🖼️ Kiểu cover</p>
            <div className="flex gap-2">
              {(['gradient', 'solid', 'mesh'] as CoverStyle[]).map(s => (
                <button key={s} onClick={() => set({ cover_style: s })}
                  className={cn("flex-1 py-2 rounded-xl text-xs font-bold transition-all border", local.cover_style === s ? cn("border-current", theme.accent, theme.bg) : 'border-border text-muted-foreground hover:bg-muted')}>
                  {s === 'gradient' ? 'Gradient' : s === 'solid' ? 'Solid' : 'Mesh'}
                </button>
              ))}
            </div>
          </div>

          {/* Section toggles */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">👁️ Hiện / Ẩn</p>
            <div className="space-y-1">
              {TOGGLE_SECTIONS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-muted transition-all">
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <button onClick={() => set({ [key]: !local[key] })}
                    className={cn("relative w-10 h-5.5 rounded-full transition-colors", local[key] ? `bg-gradient-to-r ${theme.gradient}` : 'bg-muted-foreground/30')}>
                    <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform", local[key] ? 'translate-x-5' : 'translate-x-0.5')} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">🔒 Ai xem được?</p>
            <div className="space-y-1">
              {([
                { v: 'public', label: '🔓 Công khai', desc: 'Ai cũng xem được' },
                { v: 'class_only', label: '🏫 Lớp học', desc: 'Chỉ giáo viên lớp' },
                { v: 'private', label: '🔒 Riêng tư', desc: 'Chỉ mình tôi' },
              ] as { v: ProfileVisibility; label: string; desc: string }[]).map(({ v, label, desc }) => (
                <button key={v} onClick={() => set({ profile_visibility: v })}
                  className={cn("w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all", local.profile_visibility === v ? cn(theme.bg, theme.accent, "border border-current") : 'border border-transparent hover:bg-muted text-foreground')}>
                  <span className="text-sm font-bold">{label}</span>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-border">
          <button onClick={() => { onSave(local); onClose(); }}
            className={cn("w-full py-3 rounded-2xl text-white font-black text-sm shadow-lg", `bg-gradient-to-r ${theme.gradient}`)}>
            💾 Lưu cài đặt
          </button>
        </div>
      </div>
    </>
  );
}
