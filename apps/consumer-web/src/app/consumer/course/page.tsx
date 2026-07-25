'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@shared/components/LocaleProvider';
import { GraduationCap, Loader2, ArrowRight, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { consumerCourseApi, type CourseEnrolled, type PaginatedResponse } from '@/lib/api';

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

export default function MyCoursesPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [data, setData] = useState<PaginatedResponse<CourseEnrolled> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    consumerCourseApi
      .mine()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (!data || data.results.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="border-border">
          <CardContent className="p-12 text-center space-y-4">
            <GraduationCap size={64} className="mx-auto text-slate-300" />
            <h2 className="text-xl font-bold">{t('course.mine.empty', 'No courses yet.')}</h2>
            <p className="text-slate-500 dark:text-slate-400">{t('course.mine.empty_desc', 'Use a preview link from your teacher to enroll.')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
        <GraduationCap className="text-indigo-600" size={32} />
        {t('course.mine.title', 'My Courses')}
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.results.map((c) => (
          <Card
            key={c.uid}
            className="border-border hover:shadow-md transition-all cursor-pointer overflow-hidden group"
            onClick={() => router.push(`/consumer/course/${c.uid}`)}
          >
            <div className="aspect-video bg-gradient-to-br from-indigo-500 to-purple-600 relative">
              {c.cover_url ? (
                <img src={c.cover_url} alt={c.name} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <GraduationCap size={48} className="text-white/40" />
                </div>
              )}
              <span
                className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold ${
                  c.pricing_type === 'free'
                    ? 'bg-emerald-400/90 text-emerald-900'
                    : 'bg-amber-400/90 text-amber-900'
                }`}
              >
                {c.pricing_type === 'free' ? t('course.mine.free', 'Free') : formatVnd(c.price_vnd)}
              </span>
            </div>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-indigo-600">{c.name}</h3>
              {c.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BookOpen size={12} />
                {c.lesson_count} {c.lesson_count === 1 ? 'lesson' : 'lessons'}
              </div>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/consumer/course/${c.uid}`);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold gap-2"
              >
                {t('course.mine.go_to_classroom', 'Enter classroom')}
                <ArrowRight size={16} />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
