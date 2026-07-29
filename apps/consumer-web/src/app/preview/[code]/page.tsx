'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import {
  Play,
  Lock,
  Download,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  FileText,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { toast } from 'sonner';
import { useTranslation } from '@shared/components/LocaleProvider';
import { consumerCourseApi } from '@/lib/api/course';
import type { CoursePreview } from '@/lib/api/types';
import type { RootState } from '@/lib/redux/store';

const formatVnd = (n: number): string => {
  return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
};

export default function PreviewPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { t } = useTranslation();
  const isAuthenticated = useSelector((s: RootState) => s.user.isAuthenticated);

  const [preview, setPreview] = useState<CoursePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (code) {
      handleLoad();
    }
  }, [code]);

  const handleLoad = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await consumerCourseApi.previewByCode(code);
      setPreview(data);
      if (data.preview_lessons.length > 0) {
        setActiveVideo(data.preview_lessons[0].video_url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('course.preview.not_found', 'Course not found'));
    } finally {
      setLoading(false);
    }
  };

  const handleCta = async () => {
    if (!preview) return;
    if (!isAuthenticated) {
      // Redirect to login with return URL
      const ret = preview.is_free
        ? `/consumer/course/${preview.course.uid}`
        : `/consumer/checkout/${preview.course.uid}`;
      router.push(`/consumer/login?redirect=${encodeURIComponent(ret)}`);
      return;
    }

    if (preview.is_free) {
      try {
        setEnrolling(true);
        const result = await consumerCourseApi.enroll(preview.course.uid);
        toast.success(t('course.mine.go_to_classroom', 'Enrolled!'));
        router.push(result.redirect_to);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t('common.error', 'Error'));
      } finally {
        setEnrolling(false);
      }
    } else {
      // Paid: go to checkout page
      router.push(`/consumer/checkout/${preview.course.uid}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">{t('course.detail.loading', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted to-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-3xl shadow-xl border border-border p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
              <AlertCircle size={48} />
            </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground">
              {t('course.preview.not_found', 'Course not found')}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t('course.preview.not_found_desc', 'This course does not exist or has been unpublished.')}
            </p>
          </div>
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="w-full h-12"
          >
            <ArrowLeft size={18} className="mr-2" />
            {t('course.preview.back', 'Back to home')}
          </Button>
        </div>
      </div>
    );
  }

  const { course, is_free, preview_lessons, requires_payment } = preview;
  const ctaLabel = !isAuthenticated
    ? t('course.preview.cta_signin', 'Sign in to continue')
    : is_free
      ? t('course.preview.cta_join_free', 'Join for free')
      : t('course.preview.cta_buy', 'Buy now');

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-indigo-600 to-purple-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-20 grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm text-indigo-100">
              <GraduationCap size={18} />
              <span>{t('course.preview.course_by', 'Course')}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">{course.name}</h1>
            {course.description && (
              <p className="text-indigo-100 text-lg leading-relaxed line-clamp-4">
                {course.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${
                  is_free
                    ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-300/30'
                    : 'bg-amber-400/20 text-amber-100 border border-amber-300/30'
                }`}
              >
                {is_free
                  ? t('course.preview.free_badge', 'Free')
                  : `${t('course.preview.paid_badge', 'Paid')} · ${formatVnd(course.price_vnd)}`}
              </span>
              <span className="text-indigo-100 text-sm">
                {t('course.preview.lesson_count', `${preview_lessons.length} preview lessons`)}
              </span>
            </div>
            <div className="pt-2 flex flex-wrap gap-3">
              <Button
                onClick={handleCta}
                disabled={enrolling}
                className="h-12 px-8 rounded-xl bg-card text-primary hover:bg-accent font-bold gap-2"
              >
                {enrolling ? '...' : ctaLabel}
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="ghost"
                className="h-12 px-6 rounded-xl text-white hover:bg-white/10 font-medium"
              >
                {t('course.preview.back', 'Back to home')}
              </Button>
            </div>
          </div>

          {course.cover_url ? (
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/20">
              <img src={course.cover_url} alt={course.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="aspect-video rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
              <GraduationCap size={64} className="text-white/40" />
            </div>
          )}
        </div>
      </section>

      {/* Video Player */}
      {activeVideo && (
        <section className="max-w-6xl mx-auto px-4 -mt-8 md:-mt-12 relative z-10">
          <div className="aspect-video bg-black rounded-2xl shadow-2xl overflow-hidden ring-1 ring-border">
            <video
              key={activeVideo}
              src={activeVideo}
              controls
              controlsList="nodownload"
              className="w-full h-full"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </section>
      )}

      {/* Lessons list */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
          {t('course.preview.lessons_section', 'Preview lessons')}
        </h2>
        {preview_lessons.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center space-y-3">
            <Lock size={48} className="mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              {t('course.preview.no_preview', 'This course does not have any preview lessons yet.')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {preview_lessons.map((lesson, idx) => {
              const isActive = activeVideo === lesson.video_url;
              return (
                <div
                  key={lesson.uid}
                  data-active={isActive || undefined}
                  className="bg-card rounded-2xl border border-border transition-all data-[active=true]:border-primary data-[active=true]:ring-2 data-[active=true]:ring-primary/20"
                >
                  <div className="p-5 flex items-center gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{lesson.title}</h3>
                      {lesson.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{lesson.description}</p>
                      )}
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        {lesson.duration_seconds > 0 && (
                          <span>
                            {t('course.preview.duration_min', `${Math.ceil(lesson.duration_seconds / 60)} min`)}
                          </span>
                        )}
                        {lesson.material_urls.length > 0 && (
                          <span className="flex items-center gap-1">
                            <FileText size={12} />
                            {lesson.material_urls.length} {t('course.preview.materials', 'materials')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {lesson.video_url && (
                        <Button
                          onClick={() => setActiveVideo(lesson.video_url)}
                          size="sm"
                          variant={isActive ? 'default' : 'outline'}
                          className="gap-1"
                        >
                          <Play size={14} />
                          {t('course.preview.play_video', 'Play')}
                        </Button>
                      )}
                    </div>
                  </div>
                  {lesson.material_urls.length > 0 && (
                    <div className="border-t border-border bg-muted px-5 py-3 flex flex-wrap gap-2">
                      {lesson.material_urls.map((m) => (
                        <a
                          key={m.uid}
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary bg-background px-3 py-1.5 rounded-lg border border-border hover:border-primary/40"
                        >
                          <Download size={12} />
                          {m.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {requires_payment && preview_lessons.length > 0 && (
          <div className="mt-8 bg-warning/10 border border-warning/30 rounded-2xl p-6 text-center space-y-3">
            <Lock size={32} className="mx-auto text-warning" />
            <p className="text-foreground font-medium">
              {t('course.preview.locked_overlay', 'Sign in to unlock all lessons')}
            </p>
            <Button
              onClick={handleCta}
              disabled={enrolling}
              className="bg-warning hover:bg-warning/90 text-warning-foreground"
            >
              {ctaLabel}
            </Button>
          </div>
        )}
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border bg-background">
        <div className="max-w-4xl mx-auto px-4 py-10 text-center space-y-4">
          <h3 className="text-2xl font-bold text-foreground">{course.name}</h3>
          <p className="text-muted-foreground">
            {is_free
              ? t('course.preview.cta_join_free', 'Join for free')
              : `${t('course.preview.cta_buy', 'Buy now')} · ${formatVnd(course.price_vnd)}`}
          </p>
          <Button
            onClick={handleCta}
            disabled={enrolling}
            className="h-12"
          >
            {ctaLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
