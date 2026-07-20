'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@shared/components/LocaleProvider';
import { ArrowLeft, Loader2, GraduationCap, Play, FileText, Download, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { toast } from 'sonner';
import { consumerCourseApi, type Course, type CourseLesson } from '@/lib/api';

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

export default function CourseDetailPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = use(params);
  const router = useRouter();
  const { t } = useTranslation();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'unauthorized' | 'notfound' | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    Promise.all([consumerCourseApi.retrieve(uid), consumerCourseApi.lessons(uid)])
      .then(([c, l]) => {
        setCourse(c);
        setLessons(l);
        if (l.length > 0 && l[0].video_url) setActiveVideo(l[0].video_url);
      })
      .catch((err) => {
        if (err?.status === 403) setError('unauthorized');
        else if (err?.status === 404) setError('notfound');
        else toast.error(err instanceof Error ? err.message : 'Error');
      })
      .finally(() => setLoading(false));
  }, [uid]);

  const handleJoinFree = async () => {
    try {
      setJoining(true);
      const result = await consumerCourseApi.enroll(uid);
      toast.success(t('course.mine.go_to_classroom', 'Enrolled!'));
      router.push(result.redirect_to);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (error === 'unauthorized' && course) {
    // User is not enrolled, but we may have data from preview endpoint. Re-fetch via preview
    // For now, show a CTA based on the course's pricing_type (we got it before 403)
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-4">
        <Button variant="ghost" onClick={() => router.back()} className="rounded-xl gap-2">
          <ArrowLeft size={16} /> {t('common.back', 'Back')}
        </Button>
        <Card className="border-border">
          <CardContent className="p-8 text-center space-y-4">
            <Lock size={48} className="mx-auto text-amber-500" />
            <h2 className="text-xl font-bold">{t('course.detail.unenrolled', "You haven't purchased this course yet.")}</h2>
            {course.pricing_type === 'free' ? (
              <Button
                onClick={handleJoinFree}
                disabled={joining}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
              >
                {joining ? <Loader2 size={16} className="animate-spin" /> : t('course.preview.cta_join_free', 'Join for free')}
              </Button>
            ) : (
              <Button
                onClick={() => router.push(`/consumer/checkout/${uid}`)}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold"
              >
                {t('course.preview.cta_buy', 'Buy now')} · {formatVnd(course.price_vnd)}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error === 'notfound' || !course) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="border-border">
          <CardContent className="p-12 text-center space-y-3">
            <AlertCircle size={48} className="mx-auto text-slate-300" />
            <p className="text-slate-500">{t('course.preview.not_found', 'Course not found')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push('/consumer/course')} className="rounded-xl gap-2">
        <ArrowLeft size={16} /> {t('course.mine.title', 'My Courses')}
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {activeVideo && (
            <div className="aspect-video bg-black rounded-2xl shadow-xl overflow-hidden">
              <video key={activeVideo} src={activeVideo} controls className="w-full h-full" />
            </div>
          )}

          <div>
            <h1 className="text-2xl font-black">{course.name}</h1>
            {course.description && <p className="text-muted-foreground mt-1">{course.description}</p>}
          </div>

          <Card className="border-border">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {lessons.map((l, idx) => (
                  <div
                    key={l.uid}
                    className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/30 ${activeVideo === l.video_url ? 'bg-indigo-50' : ''}`}
                    onClick={() => l.video_url && setActiveVideo(l.video_url)}
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate flex items-center gap-2">
                        {l.title}
                        {l.is_preview && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold">
                            {t('course.detail.preview_badge', 'Preview')}
                          </span>
                        )}
                      </h3>
                      {l.description && <p className="text-xs text-muted-foreground line-clamp-1">{l.description}</p>}
                    </div>
                    {l.video_url && <Play size={18} className="text-indigo-600 flex-shrink-0" />}
                    {l.material_urls.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FileText size={12} />
                        {l.material_urls.length}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {course.cover_url && (
            <div className="aspect-video rounded-2xl overflow-hidden">
              <img src={course.cover_url} alt={course.name} className="w-full h-full object-cover" />
            </div>
          )}
          <Card className="border-border">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold">{t('course.detail.lessons', 'Lessons')}</h3>
              <div className="text-2xl font-black">{lessons.length}</div>
              <Button
                onClick={() => course.classroom_uid && router.push(`/consumer/classroom/${course.classroom_uid}`)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
                disabled={!course.classroom_uid}
              >
                {t('course.mine.go_to_classroom', 'Enter classroom')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
