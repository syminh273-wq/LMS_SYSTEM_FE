'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { accountService } from '@/lib/api/account';
import { Loader2, MapPin, Globe, GraduationCap, Calendar, QrCode, Download, BookOpen, User, Facebook, Github, Instagram, Linkedin, Twitter, Users, Star, Flame, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Consumer, Post, ThemeColor } from '@/lib/api/types';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { socialApi } from '@/lib/api/social';
import { PostCard } from '../../feed/PostCard';
import { cn } from '@shared/lib/utils';
import { useRouter } from 'next/navigation';

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';

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

export default function PublicProfilePage() {
  const { uid } = useParams();
  const router = useRouter();
  const { profile: currentUser } = useSelector((s: RootState) => s.user);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'classrooms' | 'certificates' | 'about'>('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!uid) return;
      try {
        const [profileData, postsData, followers, following, followStatus] = await Promise.all([
          accountService.getPublicProfile(uid as string),
          socialApi.getUserPosts(uid as string, 10).catch(() => []),
          socialApi.getFollowers(uid as string).catch(() => []),
          socialApi.getFollowing(uid as string).catch(() => []),
          uid !== currentUser?.uid ? socialApi.getFollowStatus(uid as string).catch(() => ({ following: false })) : { following: false }
        ]);
        setProfile(profileData);
        setPosts(postsData);
        setFollowersCount(followers.length);
        setFollowingCount(following.length);
        setIsFollowing(followStatus.following);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast.error("Không thể tải thông tin profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [uid, currentUser?.uid]);

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để theo dõi");
      return;
    }
    setFollowLoading(true);
    try {
      const res = await socialApi.toggleFollow(uid as string);
      setIsFollowing(res.following);
      setFollowersCount(prev => res.following ? prev + 1 : prev - 1);
      toast.success(res.following ? "Đã theo dõi" : "Đã hủy theo dõi");
    } catch {
      toast.error("Thao tác thất bại");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLikePost = (postUid: string, liked: boolean, count: number) => {
    setPosts(prev => prev.map(p => p.uid === postUid ? { ...p, liked_by_me: liked, likes_count: count } : p));
  };

  const handleDeletePost = (postUid: string) => {
    setPosts(prev => prev.filter(p => p.uid !== postUid));
  };

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

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-gradient-to-b from-muted/40 to-background">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <User className="text-muted-foreground" size={36} />
        </div>
        <p className="text-muted-foreground font-medium">Không tìm thấy người dùng</p>
        <Button variant="outline" className="rounded-xl" onClick={() => router.back()}>Quay lại</Button>
      </div>
    );
  }

  const consumer = profile.consumer as Consumer;
  const settings = profile;
  
  const themeColor = settings.theme_color as ThemeColor;
  const theme = THEMES[themeColor] ?? THEMES.indigo;
  const coverStyle = settings.cover_style === 'mesh'
    ? { background: MESH_COVERS[themeColor] }
    : {};
  const coverClass = settings.cover_style !== 'mesh'
    ? `bg-gradient-to-r ${theme.gradient}`
    : '';

  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/consumer/profile/${uid}` : '';

  const handleDownloadQR = () => {
    const svg = document.getElementById('profile-qr') as unknown as SVGGraphicsElement;
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
        downloadLink.download = `QR_Profile_${consumer.username}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const stats = [
    { value: posts.length, label: 'bài đăng', icon: BookOpen },
    { value: followersCount, label: 'người theo dõi', icon: Users },
    { value: followingCount, label: 'đang theo dõi', icon: Star },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 via-background to-background pb-24">
      {/* ── Cover Photo ── */}
      <div className={cn("h-[240px] md:h-[360px] w-full relative overflow-hidden", coverClass)} style={coverStyle}>
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

        {/* floating QR button */}
        <div className="absolute top-4 right-4 z-10">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 shadow-lg">
                <QrCode size={18} />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xs rounded-3xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-center font-bold text-lg">
                  QR của {consumer.full_name || consumer.username}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center p-4 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-border shadow-lg">
                  <QRCodeSVG id="profile-qr" value={profileUrl} size={200} level="H" />
                </div>
                <p className="text-xs text-center text-muted-foreground">Quét mã để truy cập hồ sơ này</p>
                <Button
                  className={cn("w-full gap-2 text-white rounded-xl font-bold h-11", `bg-gradient-to-r ${theme.gradient}`)}
                  onClick={handleDownloadQR}
                >
                  <Download size={16} /> Tải mã QR
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Profile Card ── */}
      <div className="max-w-[1400px] mx-auto px-4 -mt-20 md:-mt-24 relative z-10">
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-3xl shadow-xl shadow-black/5">
          <div className="px-5 md:px-8 pt-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              {/* Avatar */}
              <div className="shrink-0 -mt-24 sm:-mt-28">
                <div className="relative inline-block group">
                  <div className={cn("absolute -inset-1 rounded-full bg-gradient-to-br opacity-70 blur-sm transition group-hover:opacity-100", theme.gradient)} />
                  {consumer.avatar_url ? (
                    <img
                      src={consumer.avatar_url}
                      alt={consumer.full_name}
                      className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-card shadow-2xl object-cover"
                    />
                  ) : (
                    <div className={cn("relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-card shadow-2xl flex items-center justify-center text-white text-4xl md:text-5xl font-black", `bg-gradient-to-br ${theme.gradient}`)}>
                      {(consumer.full_name || consumer.username).slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  {/* online dot */}
                  <span className="absolute bottom-2 right-2 md:bottom-3 md:right-3 w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-card shadow" />
                </div>
              </div>

              {/* Name + Actions */}
              <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between pb-1 gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-[28px] font-black text-foreground leading-tight truncate">
                      {consumer.full_name || consumer.username}
                    </h1>
                    <CheckCircle size={22} className={cn("shrink-0", theme.accent)} />
                  </div>
                  <p className="text-sm text-muted-foreground">@{consumer.username}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {uid !== currentUser?.uid && (
                    <Button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={cn(
                        "h-11 px-7 rounded-xl font-bold transition-all active:scale-95",
                        isFollowing
                          ? "bg-muted text-foreground hover:bg-muted/80 border border-border"
                          : cn("text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5", `bg-gradient-to-r ${theme.gradient}`)
                      )}
                    >
                      {followLoading
                        ? <Loader2 className="animate-spin" size={16} />
                        : isFollowing ? "✓ Đang theo dõi" : "+ Theo dõi"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-5 mb-5">
              {stats.map((s, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center py-3 rounded-2xl bg-muted/40 border border-border/60 transition-all hover:bg-muted/70 hover:-translate-y-0.5 hover:shadow-sm cursor-default"
                >
                  <div className="flex items-center gap-1.5">
                    <s.icon size={15} className={theme.accent} />
                    <span className="text-lg md:text-xl font-black text-foreground">{s.value}</span>
                  </div>
                  <span className="text-[11px] md:text-xs text-muted-foreground mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="border-t border-border px-4 md:px-6 py-2 flex gap-1">
            {([
              { key: 'posts', label: 'Bài đăng', icon: BookOpen },
              { key: 'about', label: 'Giới thiệu', icon: User },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 text-[15px] font-semibold rounded-xl transition-all",
                  activeTab === tab.key
                    ? cn(theme.bg, theme.accent, "shadow-sm")
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
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
        <div className="md:col-span-2 space-y-4 md:sticky md:top-4 md:self-start">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <h3 className="font-black text-lg text-foreground mb-4 flex items-center gap-2">
              <span className={cn("w-1.5 h-5 rounded-full bg-gradient-to-b", theme.gradient)} />
              Giới thiệu
            </h3>
            {settings.bio ? (
              <div dangerouslySetInnerHTML={{ __html: settings.bio }} className="text-sm text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none" />
            ) : (
              <p className="text-sm text-muted-foreground italic">Chưa có thông tin giới thiệu</p>
            )}

            <div className="mt-5 space-y-2.5 pt-5 border-t border-border/60">
              {(settings.address || settings.city) && (
                <div className="flex items-center gap-3 text-sm text-foreground/90 rounded-xl px-3 py-2.5 bg-muted/30">
                  <span className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", theme.bg, theme.accent)}>
                    <MapPin size={16} />
                  </span>
                  <span className="truncate">{[settings.address, settings.city].filter(Boolean).join(', ')}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-foreground/90 rounded-xl px-3 py-2.5 bg-muted/30">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
                  <GraduationCap size={16} />
                </span>
                <span>Học sinh</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground/90 rounded-xl px-3 py-2.5 bg-muted/30">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 dark:bg-blue-950/30">
                  <Calendar size={16} />
                </span>
                <span>Tham gia {new Date(consumer.created_at).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Content */}
        <div className="md:col-span-3 space-y-4">
          {activeTab === 'posts' && (
            <>
              {posts.length === 0 ? (
                <div className="bg-card border border-border rounded-3xl p-14 text-center shadow-sm">
                  <div className={cn("w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center", theme.bg, theme.accent)}>
                    <BookOpen size={34} />
                  </div>
                  <h4 className="text-lg font-bold text-foreground mb-1">Chưa có bài đăng</h4>
                  <p className="text-sm text-muted-foreground">Người dùng này chưa chia sẻ bài đăng nào</p>
                </div>
              ) : (
                posts.map(post => (
                  <PostCard
                    key={post.uid}
                    post={post}
                    currentUserId={currentUser?.uid ?? null}
                    onLike={handleLikePost}
                    onDelete={handleDeletePost}
                  />
                ))
              )}
            </>
          )}

          {activeTab === 'about' && (
            <div className="bg-card border border-border rounded-3xl p-7 shadow-sm space-y-8">
              <section>
                <h4 className="font-bold text-base text-foreground mb-4 flex items-center gap-2">
                  <span className={cn("w-8 h-8 rounded-xl flex items-center justify-center", theme.bg, theme.accent)}>
                    <Star size={16} />
                  </span>
                  Sở thích cá nhân
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(settings.metadata?.hobbies || []).length > 0 ? (
                    settings.metadata.hobbies.map((h: string, i: number) => (
                      <span key={i} className={cn("px-4 py-2 rounded-full text-sm font-semibold border border-border/60 transition-transform hover:scale-105", theme.bg, theme.accent)}>
                        {h}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Chưa cập nhật sở thích</p>
                  )}
                </div>
              </section>

              <section>
                <h4 className="font-bold text-base text-foreground mb-4 flex items-center gap-2">
                  <span className={cn("w-8 h-8 rounded-xl flex items-center justify-center", theme.bg, theme.accent)}>
                    <Flame size={16} />
                  </span>
                  Mạng xã hội
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(settings.metadata?.social_links || []).length > 0 ? (
                    settings.metadata.social_links.map((link: any, i: number) => {
                      const Icon = SOCIAL_ICONS[link.platform] ?? Globe;
                      return (
                        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                          className="group flex items-center gap-3 bg-muted/30 border border-border/60 rounded-2xl px-4 py-3 hover:bg-muted/60 hover:border-border hover:-translate-y-0.5 hover:shadow-sm transition-all">
                          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", theme.bg, theme.accent)}>
                            <Icon size={19} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm text-foreground">{link.label}</span>
                            <span className="text-xs text-muted-foreground truncate">{link.url.replace(/^https?:\/\//, '')}</span>
                          </div>
                        </a>
                      );
                    })
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Chưa kết nối mạng xã hội</p>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
