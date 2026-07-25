'use client';

import * as React from 'react';
import {
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle,
  Download,
  ExternalLink,
  Facebook,
  FileText,
  Flame,
  Github,
  Globe,
  GraduationCap,
  Instagram,
  Linkedin,
  Loader2,
  MapPin,
  QrCode,
  Sparkles,
  Star,
  Twitter,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { cn } from '../../lib/utils';
import {
  MONTHS,
  formatEducationPeriod,
  monthLabelLookup,
} from '../../lib/portfolio/education';

export type ThemeColor = 'indigo' | 'rose' | 'emerald' | 'amber' | 'violet';
export type CoverStyle = 'mesh' | 'gradient';
export type SocialLink = { platform: string; label: string; url: string };

export type PortfolioEntry = {
  uid: string;
  key: 'intro' | 'certificate' | 'experience' | 'achievement' | 'course' | 'education';
  value: Record<string, unknown>;
  is_public: boolean;
  display_order: number;
};

export type PortfolioLike = {
  intro: PortfolioEntry | null;
  certificate: PortfolioEntry[];
  experience: PortfolioEntry[];
  achievement: PortfolioEntry[];
  course: PortfolioEntry[];
  education: PortfolioEntry[];
};

export type PostLike = {
  uid: string;
  [key: string]: unknown;
};

export type IssuedCertificate = {
  uid: string;
  title?: string;
  collection_title?: string;
  verification_code?: string;
  issued_at?: string | null;
  pdf_url?: string;
};

export type ProfileStats = {
  postsCount: number;
  followersCount: number;
  followingCount: number;
};

export type ProfileActions = {
  onFollow?: () => void;
  followLoading?: boolean;
  isFollowing?: boolean;
  isSelf?: boolean;
  profileUrl?: string;
  onDownloadQR?: () => void;
  onLikePost?: (postUid: string, liked: boolean, count: number) => void;
  onDeletePost?: (postUid: string) => void;
};

export type PostRenderer = (post: PostLike) => React.ReactNode;

export type PublicProfileLayoutProps = {
  displayName: string;
  username?: string | null;
  pid?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  address?: string | null;
  city?: string | null;
  createdAt?: string | null;
  themeColor: ThemeColor;
  coverStyle: CoverStyle;
  hobbies?: string[];
  socialLinks?: SocialLink[];
  portfolio: PortfolioLike;
  issuedCertificates?: IssuedCertificate[];
  posts?: PostLike[];
  stats: ProfileStats;
  currentUserId?: string | null;
  actions?: ProfileActions;
  renderPost?: PostRenderer;
};

type ThemeConfig = { gradient: string; accent: string; bg: string; ring: string };

const THEMES: Record<ThemeColor, ThemeConfig> = {
  indigo: { gradient: 'from-indigo-500 via-indigo-600 to-violet-600', accent: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', ring: 'ring-indigo-500' },
  rose: { gradient: 'from-rose-400 via-pink-500 to-rose-600', accent: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30', ring: 'ring-rose-500' },
  emerald: { gradient: 'from-emerald-400 via-teal-500 to-emerald-600', accent: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', ring: 'ring-emerald-500' },
  amber: { gradient: 'from-amber-400 via-orange-500 to-amber-600', accent: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', ring: 'ring-amber-500' },
  violet: { gradient: 'from-violet-500 via-purple-600 to-violet-700', accent: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', ring: 'ring-violet-500' },
};

const MESH_COVERS: Record<ThemeColor, string> = {
  indigo: 'radial-gradient(at 40% 20%, #6366f1 0, transparent 50%), radial-gradient(at 80% 0%, #818cf8 0, transparent 50%), radial-gradient(at 0% 50%, #4f46e5 0, transparent 50%)',
  rose: 'radial-gradient(at 40% 20%, #f43f5e 0, transparent 50%), radial-gradient(at 80% 0%, #fb7185 0, transparent 50%), radial-gradient(at 0% 50%, #e11d48 0, transparent 50%)',
  emerald: 'radial-gradient(at 40% 20%, #10b981 0, transparent 50%), radial-gradient(at 80% 0%, #34d399 0, transparent 50%), radial-gradient(at 0% 50%, #059669 0, transparent 50%)',
  amber: 'radial-gradient(at 40% 20%, #f59e0b 0, transparent 50%), radial-gradient(at 80% 0%, #fbbf24 0, transparent 50%), radial-gradient(at 0% 50%, #d97706 0, transparent 50%)',
  violet: 'radial-gradient(at 40% 20%, #8b5cf6 0, transparent 50%), radial-gradient(at 80% 0%, #a78bfa 0, transparent 50%), radial-gradient(at 0% 50%, #7c3aed 0, transparent 50%)',
};

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  facebook: Facebook,
  linkedin: Linkedin,
  github: Github,
  twitter: Twitter,
  instagram: Instagram,
  website: Globe,
};

const MONTH_LABEL = monthLabelLookup(MONTHS);

function formatPeriod(
  startMonth: string,
  startYear: string,
  endMonth: string,
  endYear: string,
  isCurrent: boolean,
): string {
  return formatEducationPeriod(
    startMonth,
    startYear,
    endMonth,
    endYear,
    isCurrent,
    (m) => MONTH_LABEL(m),
    'Hiện tại',
    ' – ',
  );
}

function pickMediaUrl(v: Record<string, unknown>): string {
  return (
    (typeof v.image === 'string' && v.image) ||
    (typeof v.file_url === 'string' && v.file_url) ||
    (typeof v.url === 'string' && v.url) ||
    ''
  );
}

function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
}

function formatCertDate(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return '';
  }
}

export function PublicProfileLayout(props: PublicProfileLayoutProps) {
  const {
    displayName,
    username,
    pid,
    avatarUrl,
    bio,
    address,
    city,
    createdAt,
    themeColor,
    coverStyle,
    hobbies = [],
    socialLinks = [],
    portfolio,
    issuedCertificates = [],
    posts = [],
    stats,
    currentUserId = null,
    actions,
    renderPost,
  } = props;

  const [activeTab, setActiveTab] = React.useState<'posts' | 'about'>('posts');

  const theme = THEMES[themeColor] ?? THEMES.indigo;
  const coverInline = coverStyle === 'mesh' ? { background: MESH_COVERS[themeColor] } : {};
  const coverClass = coverStyle !== 'mesh' ? `bg-gradient-to-r ${theme.gradient}` : '';

  const introValue = ((portfolio.intro?.value ?? {}) as { headline?: string; tagline?: string; about?: string });

  const portfolioCount =
    (portfolio.education?.length || 0) +
    (portfolio.experience?.length || 0) +
    (portfolio.certificate?.length || 0) +
    (portfolio.achievement?.length || 0) +
    issuedCertificates.length;

  const statItems = [
    { value: stats.postsCount, label: 'bài đăng', icon: BookOpen },
    { value: stats.followersCount, label: 'người theo dõi', icon: Users },
    { value: stats.followingCount, label: 'đang theo dõi', icon: Star },
  ];

  const showFollow = actions?.isSelf === false && !!actions?.onFollow;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 via-background to-background pb-24">
      <div className={cn('h-[240px] md:h-[360px] w-full relative overflow-hidden', coverClass)} style={coverInline}>
        {coverStyle === 'mesh' && <div className="absolute inset-0 bg-black/10" />}
        <div className="absolute -top-16 -left-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-10 right-0 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />

        {actions?.onDownloadQR && (
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
                    QR của {displayName}
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center p-4 gap-5">
                  <p className="text-xs text-center text-muted-foreground">Quét mã để truy cập hồ sơ này</p>
                  <Button
                    className={cn('w-full gap-2 text-white rounded-xl font-bold h-11', `bg-gradient-to-r ${theme.gradient}`)}
                    onClick={actions.onDownloadQR}
                  >
                    <Download size={16} /> Tải mã QR
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="max-w-[1400px] mx-auto px-4 -mt-20 md:-mt-24 relative z-10">
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-3xl shadow-xl shadow-black/5">
          <div className="px-5 md:px-8 pt-5">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="shrink-0 -mt-24 sm:-mt-28">
                <div className="relative inline-block group">
                  <div className={cn('absolute -inset-1 rounded-full bg-gradient-to-br opacity-70 blur-sm transition group-hover:opacity-100', theme.gradient)} />
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-card shadow-2xl object-cover"
                    />
                  ) : (
                    <div className={cn('relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-card shadow-2xl flex items-center justify-center text-white text-4xl md:text-5xl font-black', `bg-gradient-to-br ${theme.gradient}`)}>
                      {displayName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 md:bottom-3 md:right-3 w-5 h-5 rounded-full bg-emerald-500 border-[3px] border-card shadow" />
                </div>
              </div>

              <div className="flex-1 flex flex-col sm:flex-row sm:items-end justify-between pb-1 gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-[28px] font-black text-foreground leading-tight truncate">
                      {displayName}
                    </h1>
                    <CheckCircle size={22} className={cn('shrink-0', theme.accent)} />
                  </div>
                  {username && <p className="text-sm text-muted-foreground">@{username}</p>}
                  {pid && (
                    <span className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 border border-border text-xs font-mono font-bold text-muted-foreground">
                      🪪 {pid}
                    </span>
                  )}
                  {introValue.tagline && (
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest text-primary-brand">
                      {introValue.tagline}
                    </p>
                  )}
                  {portfolioCount > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground bg-muted/60 px-2 py-1 rounded-md">
                      <Sparkles size={11} className={theme.accent} />
                      {portfolioCount} mục portfolio
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {showFollow && (
                    <Button
                      onClick={actions!.onFollow}
                      disabled={actions?.followLoading}
                      className={cn(
                        'h-11 px-7 rounded-xl font-bold transition-all active:scale-95',
                        actions?.isFollowing
                          ? 'bg-muted text-foreground hover:bg-muted/80 border border-border'
                          : cn('text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5', `bg-gradient-to-r ${theme.gradient}`),
                      )}
                    >
                      {actions?.followLoading ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : actions?.isFollowing ? (
                        '✓ Đang theo dõi'
                      ) : (
                        '+ Theo dõi'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-5 mb-5">
              {statItems.map((s, i) => (
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

          <div className="border-t border-border px-4 md:px-6 py-2 flex gap-1 overflow-x-auto">
            {([
              { key: 'posts', label: 'Bài đăng', icon: BookOpen },
              { key: 'about', label: 'Giới thiệu', icon: UserIcon },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 text-[15px] font-semibold rounded-xl transition-all shrink-0',
                  activeTab === tab.key
                    ? cn(theme.bg, theme.accent, 'shadow-sm')
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 mt-4 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2 space-y-4 md:sticky md:top-4 md:self-start">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <h3 className="font-black text-lg text-foreground mb-4 flex items-center gap-2">
              <span className={cn('w-1.5 h-5 rounded-full bg-gradient-to-b', theme.gradient)} />
              Giới thiệu
            </h3>
            {bio ? (
              <div
                dangerouslySetInnerHTML={{ __html: bio }}
                className="text-sm text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none"
              />
            ) : introValue.about ? (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{introValue.about}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Chưa có thông tin giới thiệu</p>
            )}

            <div className="mt-5 space-y-2.5 pt-5 border-t border-border/60">
              {(address || city) && (
                <div className="flex items-center gap-3 text-sm text-foreground/90 rounded-xl px-3 py-2.5 bg-muted/30">
                  <span className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', theme.bg, theme.accent)}>
                    <MapPin size={16} />
                  </span>
                  <span className="truncate">{[address, city].filter(Boolean).join(', ')}</span>
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
                <span>Tham gia {createdAt ? new Date(createdAt).toLocaleDateString('vi-VN') : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-4">
          {activeTab === 'posts' && (
            <>
              {posts.length === 0 ? (
                <div className="bg-card border border-border rounded-3xl p-14 text-center shadow-sm">
                  <div className={cn('w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center', theme.bg, theme.accent)}>
                    <BookOpen size={34} />
                  </div>
                  <h4 className="text-lg font-bold text-foreground mb-1">Chưa có bài đăng</h4>
                  <p className="text-sm text-muted-foreground">Người dùng này chưa chia sẻ bài đăng nào</p>
                </div>
              ) : (
                posts.map(post => (
                  <div key={post.uid}>
                    {renderPost ? renderPost(post) : <DefaultPostPreview post={post} />}
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4">
              {introValue.headline && (
                <Card className="rounded-3xl border-border shadow-sm">
                  <CardContent className="p-6">
                    <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
                      {introValue.headline}
                    </h2>
                    {introValue.tagline && (
                      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-primary-brand">
                        {introValue.tagline}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="rounded-3xl border-border shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <section>
                    <h4 className="font-bold text-base text-foreground mb-3 flex items-center gap-2">
                      <span className={cn('w-8 h-8 rounded-xl flex items-center justify-center', theme.bg, theme.accent)}>
                        <Star size={16} />
                      </span>
                      Sở thích cá nhân
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {hobbies.length > 0 ? (
                        hobbies.map((h, i) => (
                          <span
                            key={i}
                            className={cn('px-4 py-2 rounded-full text-sm font-semibold border border-border/60 transition-transform hover:scale-105', theme.bg, theme.accent)}
                          >
                            {h}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Chưa cập nhật sở thích</p>
                      )}
                    </div>
                  </section>

                  <section>
                    <h4 className="font-bold text-base text-foreground mb-3 flex items-center gap-2">
                      <span className={cn('w-8 h-8 rounded-xl flex items-center justify-center', theme.bg, theme.accent)}>
                        <Flame size={16} />
                      </span>
                      Mạng xã hội
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {socialLinks.length > 0 ? (
                        socialLinks.map((link, i) => {
                          const Icon = SOCIAL_ICONS[link.platform] ?? Globe;
                          return (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center gap-3 bg-muted/30 border border-border/60 rounded-2xl px-4 py-3 hover:bg-muted/60 hover:border-border hover:-translate-y-0.5 hover:shadow-sm transition-all"
                            >
                              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', theme.bg, theme.accent)}>
                                <Icon size={19} />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-sm text-foreground">{link.label}</span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {link.url.replace(/^https?:\/\//, '')}
                                </span>
                              </div>
                            </a>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Chưa kết nối mạng xã hội</p>
                      )}
                    </div>
                  </section>
                </CardContent>
              </Card>

              {(portfolio.education?.length || 0) > 0 && (
                <PortfolioSection
                  icon={GraduationCap}
                  iconClass="bg-violet-100 text-violet-700"
                  title="Học vấn"
                  count={portfolio.education.length}
                  items={portfolio.education}
                  renderItem={(v) => <EducationCard v={v} />}
                />
              )}

              {(portfolio.experience?.length || 0) > 0 && (
                <PortfolioSection
                  icon={Briefcase}
                  iconClass="bg-blue-100 text-blue-700"
                  title="Kinh nghiệm"
                  count={portfolio.experience.length}
                  items={portfolio.experience}
                  renderItem={(v) => <ExperienceCard v={v} />}
                />
              )}

              {issuedCertificates.length > 0 && (
                <Card className="rounded-3xl border-border shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-base text-foreground mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-100 text-amber-700">
                        <Award size={16} />
                      </span>
                      Chứng chỉ & Giải thưởng
                      <span className="text-[11px] font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                        {issuedCertificates.length}
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {issuedCertificates.map(c => {
                        const title = c.title || c.collection_title || 'Chứng chỉ';
                        return (
                          <div key={c.uid} className="border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                <Award size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 line-clamp-2">{title}</p>
                                {c.collection_title && c.title && c.title !== c.collection_title && (
                                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{c.collection_title}</p>
                                )}
                                <p className="text-[11px] text-slate-500 mt-1 font-mono">{c.verification_code}</p>
                                {c.issued_at && (
                                  <p className="text-[10px] text-slate-400 mt-0.5">{formatCertDate(c.issued_at)}</p>
                                )}
                              </div>
                            </div>
                            {c.pdf_url && (
                              <a
                                href={c.pdf_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-900 font-semibold"
                              >
                                Xem PDF <ExternalLink size={11} />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {(portfolio.certificate?.length || 0) > 0 && (
                <PortfolioSection
                  icon={Award}
                  iconClass="bg-amber-100 text-amber-700"
                  title="Chứng chỉ khác"
                  count={portfolio.certificate.length}
                  items={portfolio.certificate}
                  renderItem={(v) => <CertificateCard v={v} />}
                />
              )}

              {(portfolio.achievement?.length || 0) > 0 && (
                <PortfolioSection
                  icon={Award}
                  iconClass="bg-rose-100 text-rose-700"
                  title="Thành tựu / Dự án"
                  count={portfolio.achievement.length}
                  items={portfolio.achievement}
                  renderItem={(v) => <AchievementCard v={v} />}
                />
              )}

              {portfolioCount === 0 && hobbies.length === 0 && socialLinks.length === 0 && !bio && !introValue.about && (
                <Card className="rounded-3xl border-border">
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground font-medium">Chưa có thông tin chi tiết</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PortfolioSection({
  icon: Icon,
  iconClass,
  title,
  count,
  items,
  renderItem,
}: {
  icon: React.ElementType;
  iconClass: string;
  title: string;
  count: number;
  items: PortfolioEntry[];
  renderItem: (v: Record<string, unknown>) => React.ReactNode;
}) {
  const sorted = [...items].sort((a, b) => a.display_order - b.display_order);
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
          <Icon size={14} />
        </div>
        <h3 className="text-base md:text-lg font-extrabold text-foreground tracking-tight">{title}</h3>
        <span className="text-[11px] font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      <div className="space-y-3">
        {sorted.map(entry => (
          <React.Fragment key={entry.uid}>{renderItem(entry.value ?? {})}</React.Fragment>
        ))}
      </div>
    </section>
  );
}

function EducationCard({ v }: { v: Record<string, unknown> }) {
  const school = String(v.school ?? '');
  const degree = String(v.degree ?? '');
  const field = String(v.field_of_study ?? '');
  const grade = String(v.grade ?? '');
  const description = String(v.description ?? '');
  const activities = String(v.activities_and_societies ?? '');
  const skills = Array.isArray(v.skills)
    ? (v.skills as unknown[]).filter((s): s is string => typeof s === 'string' && !!s)
    : [];
  const period = formatPeriod(
    String(v.start_month ?? ''),
    String(v.start_year ?? ''),
    String(v.end_month ?? ''),
    String(v.end_year ?? ''),
    v.is_current === true,
  );
  const isCurrent = v.is_current === true;

  return (
    <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
      <div className="p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
          <GraduationCap size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Học vấn</p>
          {school && <p className="text-base font-extrabold text-foreground mt-1">{school}</p>}
          {degree && (
            <p className="text-sm text-foreground/80 font-semibold mt-0.5">
              {degree}
              {field ? ` · ${field}` : ''}
            </p>
          )}
          {period && (
            <p className="text-xs text-muted-foreground font-medium mt-1">
              {period}
              {isCurrent && (
                <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                  Đang học
                </span>
              )}
            </p>
          )}
          {grade && (
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              GPA: <span className="font-bold text-foreground">{grade}</span>
            </p>
          )}
        </div>
      </div>
      {(description || activities || skills.length > 0) && (
        <div className="px-5 pb-5 space-y-3">
          {description && <p className="text-sm text-foreground/80 font-medium whitespace-pre-line leading-relaxed">{description}</p>}
          {activities && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Hoạt động</p>
              <p className="text-sm text-foreground/80 font-medium whitespace-pre-line leading-relaxed">{activities}</p>
            </div>
          )}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {skills.map(s => (
                <span
                  key={s}
                  className="inline-flex items-center px-2.5 py-1 rounded-md bg-violet-50 text-violet-700 text-[11px] font-semibold border border-violet-100"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function ExperienceCard({ v }: { v: Record<string, unknown> }) {
  const position = String(v.position ?? '');
  const company = String(v.company ?? '');
  const location = String(v.location ?? '');
  const description = String(v.description ?? '');
  const period = formatPeriod(
    String(v.start_month ?? ''),
    String(v.start_year ?? ''),
    String(v.end_month ?? ''),
    String(v.end_year ?? ''),
    v.is_current === true,
  );
  const isCurrent = v.is_current === true;

  return (
    <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
      <div className="p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
          <Briefcase size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Kinh nghiệm làm việc</p>
          {position && <p className="text-base font-extrabold text-foreground mt-1">{position}</p>}
          {company && <p className="text-sm text-foreground/80 font-semibold mt-0.5">{company}</p>}
          {period && (
            <p className="text-xs text-muted-foreground font-medium mt-1">
              {period}
              {isCurrent && (
                <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                  Đang làm
                </span>
              )}
            </p>
          )}
          {location && (
            <p className="text-xs text-muted-foreground font-medium mt-1 inline-flex items-center gap-1">
              <MapPin size={11} /> {location}
            </p>
          )}
        </div>
      </div>
      {description && (
        <div className="px-5 pb-5">
          <p className="text-sm text-foreground/80 font-medium whitespace-pre-line leading-relaxed">{description}</p>
        </div>
      )}
    </Card>
  );
}

function CertificateCard({ v }: { v: Record<string, unknown> }) {
  const title = String(v.title ?? '');
  const issuer = String(v.issuer ?? '');
  const year = String(v.year ?? '');
  const fileUrl = typeof v.file_url === 'string' ? v.file_url : '';
  const isImage = fileUrl && isImageUrl(fileUrl);

  return (
    <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
      <div className="p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Award size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Chứng chỉ</p>
          {title && <p className="text-base font-extrabold text-foreground mt-1">{title}</p>}
          {(issuer || year) && (
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              {[issuer, year].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>
      {fileUrl && (
        <div className="px-5 pb-5">
          {isImage ? (
            <a href={fileUrl} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-border hover:opacity-95">
              <img src={fileUrl} alt={title} className="w-full max-h-72 object-cover" />
            </a>
          ) : (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted text-sm font-bold text-foreground"
            >
              <FileText size={16} className="text-primary-brand" />
              <span className="truncate max-w-[260px]">{title || 'Mở tệp đính kèm'}</span>
              <ExternalLink size={12} className="text-muted-foreground" />
            </a>
          )}
        </div>
      )}
    </Card>
  );
}

function AchievementCard({ v }: { v: Record<string, unknown> }) {
  const title = String(v.title ?? '');
  const description = String(v.description ?? '');
  const url = typeof v.url === 'string' ? v.url : '';
  const mediaUrl = pickMediaUrl(v);
  const isImage = mediaUrl && isImageUrl(mediaUrl);

  return (
    <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
      <div className="p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
          <Award size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Thành tựu / Dự án</p>
          {title && <p className="text-base font-extrabold text-foreground mt-1">{title}</p>}
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted/60 hover:bg-muted text-[11px] font-bold text-foreground"
          >
            <ExternalLink size={11} /> Liên kết
          </a>
        )}
      </div>
      {description && (
        <div className="px-5 pb-3">
          <p className="text-sm text-foreground/80 font-medium whitespace-pre-line leading-relaxed">{description}</p>
        </div>
      )}
      {isImage && (
        <div className="px-5 pb-5">
          <a href={mediaUrl} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-border hover:opacity-95">
            <img src={mediaUrl} alt={title} className="w-full max-h-72 object-cover" />
          </a>
        </div>
      )}
      {!isImage && mediaUrl && (
        <div className="px-5 pb-5">
          <a
            href={mediaUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted text-sm font-bold text-foreground"
          >
            <FileText size={16} className="text-primary-brand" />
            <span className="truncate max-w-[260px]">{title || 'Mở tệp đính kèm'}</span>
            <ExternalLink size={12} className="text-muted-foreground" />
          </a>
        </div>
      )}
    </Card>
  );
}

function DefaultPostPreview({ post }: { post: PostLike }) {
  const title = typeof post.title === 'string' ? post.title : '';
  const content = typeof post.content === 'string' ? post.content : '';
  return (
    <Card className="rounded-3xl border-border shadow-sm">
      <CardContent className="p-5">
        {title && <p className="text-base font-extrabold text-foreground">{title}</p>}
        {content && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{content}</p>}
      </CardContent>
    </Card>
  );
}
