'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@shared/components/LocaleProvider';
import { Plus, Search, Loader2, GraduationCap, BookOpen, Users, MoreVertical, Pencil, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, QrCode } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '@shared/components/ui/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { courseApi, type Course, type PaginatedResponse } from '@/lib/api';

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-700 border border-amber-200',
  published: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  archived: 'bg-slate-100 text-slate-600 border border-slate-200',
};

export default function CoursesListPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [data, setData] = useState<PaginatedResponse<Course> | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

  const fetchCourses = async (page: number) => {
    try {
      setLoading(true);
      const res = await courseApi.list(page);
      setData(res);
      setCurrentPage(res.current_page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('common.error', 'Error');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(1);
  }, []);

  const handleDelete = async (uid: string) => {
    if (!confirm(t('course.list.delete_confirm', 'Are you sure?'))) return;
    try {
      await courseApi.delete(uid);
      toast.success(t('course.list.delete_success', 'Course deleted.'));
      fetchCourses(currentPage);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('common.error', 'Error');
      toast.error(msg);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('course.sharing.copied', 'Copied!'));
  };

  const filtered = data?.results?.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.pid.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-2">
            <GraduationCap className="text-indigo-600" size={32} />
            {t('course.list.title', 'My Courses')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('course.list.empty_desc', 'Manage your paid and free courses.')}
          </p>
        </div>
        <Button
          onClick={() => router.push('/space/courses/create')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl gap-2 h-11"
        >
          <Plus size={18} />
          {t('course.list.create_cta', 'Create new course')}
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('course.list.search_placeholder', 'Search...')}
          className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl outline-none focus:bg-card focus:border-indigo-500 transition-all"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-12 text-center space-y-3">
            <GraduationCap size={48} className="mx-auto text-slate-300" />
            <p className="text-slate-500">{t('course.list.empty', 'No courses yet.')}</p>
            <Button
              onClick={() => router.push('/space/courses/create')}
              variant="outline"
              className="mt-2 rounded-xl"
            >
              {t('course.list.create_cta', 'Create new course')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card
              key={c.uid}
              className="border-border hover:shadow-md transition-all cursor-pointer overflow-hidden group"
              onClick={() => router.push(`/space/courses/${c.uid}`)}
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
                  className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[c.status] || STATUS_BADGE.draft}`}
                >
                  {t(`course.list.${c.status}_badge`, c.status)}
                </span>
              </div>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-indigo-600 transition-colors">
                  {c.name}
                </h3>
                {c.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                  <span
                    className={`px-2 py-0.5 rounded-md font-semibold ${
                      c.pricing_type === 'free'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {c.pricing_type === 'free'
                      ? t('course.list.filter_free', 'Free')
                      : formatVnd(c.price_vnd)}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} />
                    {t('course.list.lessons', `${c.lesson_count} lessons`)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {c.enrollment_count}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <code
                    className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(c.pid);
                    }}
                  >
                    {c.pid}
                  </code>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => router.push(`/space/courses/${c.uid}`)}
                      className="h-8 w-8"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreVertical size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => window.open(`/preview/${c.pid}`, '_blank')}
                          className="gap-2"
                        >
                          <QrCode size={14} />
                          {t('course.sharing.qr_label', 'Preview link')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(c.uid)}
                          className="gap-2 text-rose-600"
                        >
                          <Trash2 size={14} />
                          {t('course.list.delete_confirm', 'Delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data && data.total_pages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button size="icon" variant="ghost" disabled={!data.links?.previous} onClick={() => fetchCourses(1)}>
                <ChevronsLeft size={16} />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button size="icon" variant="ghost" disabled={!data.links?.previous} onClick={() => fetchCourses(currentPage - 1)}>
                <ChevronLeft size={16} />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <span className="text-sm font-medium text-muted-foreground px-3">
                {currentPage} / {data.total_pages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <Button size="icon" variant="ghost" disabled={!data.links?.next} onClick={() => fetchCourses(currentPage + 1)}>
                <ChevronRight size={16} />
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button size="icon" variant="ghost" disabled={!data.links?.next} onClick={() => fetchCourses(data.total_pages)}>
                <ChevronsRight size={16} />
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
