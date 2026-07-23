'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  ArrowLeft,
  Award,
  Briefcase,
  ExternalLink,
  FileText,
  GraduationCap,
  Loader2,
  MapPin,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
} from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { useTranslation } from '@shared/components/LocaleProvider';
import { useImageLightbox } from '@shared/components/ui/image-lightbox';
import { PostImageGallery } from '@shared/components/ui/post-image-gallery';
import { portfolioApi, type Portfolio, type PortfolioEntry, type PublicTeacher } from '@/lib/api/portfolio';
import { communityApi } from '@/lib/api/community';
import type { RootState } from '@/lib/redux/store';
import {
  MONTHS,
  formatEducationPeriod,
  monthLabelLookup,
} from '@shared/lib/portfolio/education';

type Section = 'intro' | 'certificate' | 'experience' | 'achievement' | 'course' | 'education';

type Post = {
  uid: string;
  key: Section;
  value: Record<string, unknown>;
  is_public: boolean;
  display_order: number;
  created_at: string | null;
  updated_at: string | null;
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

function pickMediaUrls(v: Record<string, unknown>): string[] {
  const fromArray = Array.isArray(v.file_urls)
    ? (v.file_urls as unknown[]).filter((u): u is string => typeof u === 'string' && !!u)
    : [];
  const single = pickMediaUrl(v);
  if (single) {
    return fromArray.includes(single) ? fromArray : [single, ...fromArray];
  }
  return fromArray;
}

function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
}

export default function PublicTeacherPortfolioPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const teacherId = String(params?.uid ?? '');
  const currentUser = useSelector((s: RootState) => s.user.profile);
  const isAuthed = useSelector((s: RootState) => s.user.isAuthenticated);

  const [teacher, setTeacher] = useState<PublicTeacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    if (!teacherId) return;
    let mounted = true;
    (async () => {
      try {
        const res = await portfolioApi.getPublicTeacher(teacherId);
        if (!mounted) return;
        setTeacher(res);
      } catch (err) {
        console.error(err);
        if (mounted) setError(t('portfolio.labels.teacher_not_found'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [teacherId, t]);

  const isSelf = Boolean(currentUser?.uid && teacher?.uid && currentUser.uid === teacher.uid);

  const handleMessage = async () => {
    if (!isAuthed) {
      router.push(`/auth/login?next=${encodeURIComponent(`/teachers/${teacherId}/portfolio`)}`);
      return;
    }
    if (isSelf || !teacher?.uid) return;
    setMessaging(true);
    try {
      await communityApi.getOrCreateDirect(teacher.uid);
      router.push(`/consumer/messages/${teacher.uid}`);
    } catch (e) {
      console.error(e);
      toast.error(t('portfolio.labels.message_failed'));
    } finally {
      setMessaging(false);
    }
  };

  const messageLabel = !isAuthed
    ? t('portfolio.labels.message_login')
    : isSelf
      ? t('portfolio.labels.message_self')
      : t('portfolio.personal.message');

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {loading && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-[2px] z-50 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary-brand animate-spin" />
        </div>
      )}

      <div className="bg-gradient-to-br from-primary-brand via-primary-brand-dark to-violet-700 h-56 md:h-72 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-violet-300 blur-3xl" />
        </div>
        <div className="absolute top-4 left-4">
          <Button variant="secondary" size="sm" className="rounded-xl gap-2 bg-white/90 backdrop-blur" onClick={() => router.back()}>
            <ArrowLeft size={14} /> {t('portfolio.labels.back_to_list')}
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-16 md:-mt-20 relative z-10 space-y-6">
        {!loading && error && (
          <Card className="rounded-3xl border-border">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && teacher && (
          <TeacherHero
            teacher={teacher}
            messageLabel={messageLabel}
            messaging={messaging}
            isAuthed={isAuthed}
            isSelf={isSelf}
            onMessage={handleMessage}
            onSignIn={() => router.push(`/auth/login?next=${encodeURIComponent(`/teachers/${teacherId}/portfolio`)}`)}
            t={t}
          />
        )}

        {!loading && teacher?.portfolio && <Wall data={teacher.portfolio} />}
      </div>
    </div>
  );
}

function TeacherHero({
  teacher,
  messageLabel,
  messaging,
  isAuthed,
  isSelf,
  onMessage,
  onSignIn,
  t,
}: {
  teacher: PublicTeacher;
  messageLabel: string;
  messaging: boolean;
  isAuthed: boolean;
  isSelf: boolean;
  onMessage: () => void;
  onSignIn: () => void;
  t: (k: string) => string;
}) {
  const intro = teacher.portfolio?.intro;
  const introValue = ((intro?.value ?? {}) as { headline?: string; tagline?: string; about?: string });
  const displayName = teacher.full_name || teacher.name || t('portfolio.personal.default_name');
  const initials = (displayName || 'U').slice(0, 1).toUpperCase();

  const totalCount = teacher.portfolio
    ? (teacher.portfolio.certificate?.length || 0) +
      (teacher.portfolio.experience?.length || 0) +
      (teacher.portfolio.achievement?.length || 0) +
      (teacher.portfolio.education?.length || 0) +
      (teacher.portfolio.course?.length || 0)
    : 0;

  return (
    <Card className="rounded-3xl border-border shadow-sm overflow-hidden">
      <div
        className="h-40 md:h-48 w-full bg-gradient-to-br from-primary-brand via-fuchsia-500 to-orange-400 relative"
        style={teacher.cover_url ? { backgroundImage: `url(${teacher.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      />
      <CardContent className="p-6 -mt-16 md:-mt-20 relative">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-5">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl border-4 border-card bg-gradient-to-br from-primary-brand to-fuchsia-500 flex items-center justify-center text-white shadow-xl overflow-hidden shrink-0">
            {teacher.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={teacher.avatar_url} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl md:text-5xl font-black">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              {displayName}
            </h1>
            {introValue.tagline && (
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-primary-brand">{introValue.tagline}</p>
            )}
            {teacher.description && (
              <p className="mt-2 text-sm text-muted-foreground font-medium line-clamp-2">{teacher.description}</p>
            )}
            {totalCount > 0 && (
              <div className="mt-3 flex items-center gap-3 text-[11px] font-bold text-muted-foreground">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/60">
                  <Sparkles size={11} className="text-primary-brand" />
                  {totalCount} mục portfolio
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={isAuthed && !isSelf ? onMessage : onSignIn}
              disabled={messaging || (isAuthed && isSelf)}
              className="rounded-full gap-2"
              size="sm"
            >
              {messaging ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {t('portfolio.labels.messaging')}
                </>
              ) : (
                <>
                  <MessageCircle size={14} />
                  {messageLabel}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Wall({ data }: { data: Portfolio }) {
  const { t } = useTranslation();
  const intro = data.intro;
  const introValue = (intro?.value ?? {}) as { headline?: string; tagline?: string; about?: string };

  const groups: { key: Section; label: string; items: PortfolioEntry[] }[] = [
    { key: 'experience',   label: t('portfolio.labels.section_experience')   || 'Kinh nghiệm',    items: data.experience },
    { key: 'education',    label: t('portfolio.labels.section_education')    || 'Học vấn',         items: data.education },
    { key: 'certificate',  label: t('portfolio.labels.section_certificate')  || 'Chứng chỉ',      items: data.certificate },
    { key: 'achievement',  label: t('portfolio.labels.section_achievement')  || 'Thành tựu',       items: data.achievement },
    { key: 'course',       label: t('portfolio.labels.section_course')       || 'Khóa học',        items: data.course },
  ].filter(g => g.items.length > 0);

  return (
    <>
      {intro && (
        <Card className="rounded-3xl border-border shadow-sm">
          <CardContent className="p-6">
            {introValue.headline && (
              <h2 className="text-xl md:text-2xl font-extrabold text-foreground tracking-tight">
                {introValue.headline}
              </h2>
            )}
            {introValue.tagline && (
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-primary-brand">
                {introValue.tagline}
              </p>
            )}
            {introValue.about && (
              <p className="mt-4 text-sm text-foreground/80 font-medium whitespace-pre-line leading-relaxed">
                {introValue.about}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {groups.length === 0 && !intro && (
        <Card className="rounded-3xl border-border">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground font-medium">{t('portfolio.labels.no_intro')}</p>
          </CardContent>
        </Card>
      )}

      {groups.map(group => {
        const sorted = [...group.items].sort((a, b) => a.display_order - b.display_order);
        return (
          <section key={group.key} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <SectionHeaderIcon section={group.key} />
              <h3 className="text-base md:text-lg font-extrabold text-foreground tracking-tight">
                {group.label}
              </h3>
              <span className="text-[11px] font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                {sorted.length}
              </span>
            </div>
            <div className="space-y-3">
              {sorted.map(entry => (
                <PostCard key={entry.uid} post={{ ...entry, key: group.key }} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

function SectionHeaderIcon({ section }: { section: Section }) {
  const map: Record<Section, { Icon: typeof Award; cls: string }> = {
    intro:        { Icon: Sparkles,    cls: 'bg-amber-100 text-amber-700' },
    experience:   { Icon: Briefcase,   cls: 'bg-blue-100 text-blue-700' },
    education:    { Icon: GraduationCap, cls: 'bg-violet-100 text-violet-700' },
    certificate:  { Icon: Award,       cls: 'bg-amber-100 text-amber-700' },
    achievement:  { Icon: Award,       cls: 'bg-rose-100 text-rose-700' },
    course:       { Icon: GraduationCap, cls: 'bg-emerald-100 text-emerald-700' },
  };
  const { Icon, cls } = map[section] || { Icon: Sparkles, cls: 'bg-slate-100 text-slate-700' };
  return (
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${cls}`}>
      <Icon size={14} />
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const v = post.value ?? {};
  const mediaUrl = pickMediaUrl(v);
  const mediaUrls = pickMediaUrls(v);
  const isImage = mediaUrl && isImageUrl(mediaUrl);
  const lightbox = useImageLightbox();

  if (post.key === 'education') return <EducationCard v={v} />;
  if (post.key === 'experience') return <ExperienceCard v={v} />;
  if (post.key === 'certificate') return <CertificateCard v={v} />;
  if (post.key === 'achievement') return <AchievementCard v={v} mediaUrl={mediaUrl} isImage={!!isImage} lightbox={lightbox} mediaUrls={mediaUrls} />;
  return <CourseCard v={v} />;
}

function EducationCard({ v }: { v: Record<string, unknown> }) {
  const school = String(v.school ?? '');
  const degree = String(v.degree ?? '');
  const field = String(v.field_of_study ?? '');
  const grade = String(v.grade ?? '');
  const description = String(v.description ?? '');
  const activities = String(v.activities_and_societies ?? '');
  const skills = Array.isArray(v.skills) ? (v.skills as unknown[]).filter((s): s is string => typeof s === 'string' && !!s) : [];
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
          {degree && <p className="text-sm text-foreground/80 font-semibold mt-0.5">{degree}{field ? ` · ${field}` : ''}</p>}
          {period && (
            <p className="text-xs text-muted-foreground font-medium mt-1">
              {period}
              {isCurrent && <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">Đang học</span>}
            </p>
          )}
          {grade && (
            <p className="text-xs text-muted-foreground font-medium mt-0.5">GPA: <span className="font-bold text-foreground">{grade}</span></p>
          )}
        </div>
      </div>
      {(description || activities || skills.length > 0) && (
        <div className="px-5 pb-5 space-y-3">
          {description && (
            <p className="text-sm text-foreground/80 font-medium whitespace-pre-line leading-relaxed">{description}</p>
          )}
          {activities && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Hoạt động</p>
              <p className="text-sm text-foreground/80 font-medium whitespace-pre-line leading-relaxed">{activities}</p>
            </div>
          )}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {skills.map(s => (
                <span key={s} className="inline-flex items-center px-2.5 py-1 rounded-md bg-violet-50 text-violet-700 text-[11px] font-semibold border border-violet-100">
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
              {isCurrent && <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">Đang làm</span>}
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
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

function AchievementCard({ v, mediaUrl, isImage, lightbox, mediaUrls }: {
  v: Record<string, unknown>;
  mediaUrl: string;
  isImage: boolean;
  lightbox: ReturnType<typeof useImageLightbox>;
  mediaUrls: string[];
}) {
  const title = String(v.title ?? '');
  const description = String(v.description ?? '');
  const url = typeof v.url === 'string' ? v.url : '';

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
      {isImage && mediaUrls.length > 0 && (
        <div className="px-5 pb-5">
          <PostImageGallery
            images={mediaUrls.filter(u => isImageUrl(u))}
            onImageClick={(idx) => lightbox.open(mediaUrls.filter(u => isImageUrl(u)), idx)}
          />
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
      {lightbox.element}
    </Card>
  );
}

function CourseCard({ v }: { v: Record<string, unknown> }) {
  const title = String(v.title ?? '');
  const summary = String(v.summary ?? '');
  const url = typeof v.url === 'string' ? v.url : '';

  return (
    <Card className="rounded-2xl border-border shadow-sm overflow-hidden">
      <div className="p-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <GraduationCap size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Khóa học</p>
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
      {summary && (
        <div className="px-5 pb-5">
          <p className="text-sm text-foreground/80 font-medium whitespace-pre-line leading-relaxed">{summary}</p>
        </div>
      )}
    </Card>
  );
}
