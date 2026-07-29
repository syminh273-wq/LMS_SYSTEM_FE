'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@shared/components/LocaleProvider';
import {
  ArrowLeft, Loader2, GraduationCap, BookOpen, Users, QrCode, Copy,
  Save, Upload, Trash2, Eye, EyeOff, Play, FileText, GripVertical, Plus,
  CheckCircle2, BarChart3, Download, Pencil,
} from 'lucide-react';
import { Card, CardContent } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import {
  courseApi, type Course, type CourseLesson, type CreateLessonRequest,
  type CourseEnrollment, type CourseStats,
} from '@/lib/api';

type Tab = 'info' | 'lessons' | 'students' | 'sharing';

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

export default function CourseDetailPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = use(params);
  const router = useRouter();
  const { t } = useTranslation();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [sharingLink, setSharingLink] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('lessons');
  const [editingLesson, setEditingLesson] = useState<Partial<CreateLessonRequest> | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [c, l] = await Promise.all([courseApi.retrieve(uid), courseApi.lessons(uid)]);
      setCourse(c);
      setLessons(l);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('common.error', 'Error');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [uid, t]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (tab === 'students' && enrollments.length === 0) {
      courseApi.enrollments(uid).then(setEnrollments).catch(() => setEnrollments([]));
      courseApi.stats(uid).then(setStats).catch(() => setStats(null));
    }
    if (tab === 'sharing' && !sharingLink) {
      courseApi.sharingLink(uid).then((res: { qr_code_url?: string } | any) => {
        if (res?.qr_code_url) setSharingLink(res.qr_code_url);
      }).catch(() => setSharingLink(''));
    }
  }, [tab, uid, enrollments.length, sharingLink]);

  if (loading || !course) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/space/courses')}
          className="rounded-xl border border-border bg-card shadow-sm"
        >
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-foreground truncate">{course.name}</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <code className="text-xs bg-muted px-2 py-0.5 rounded">{course.pid}</code>
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                course.pricing_type === 'free' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {course.pricing_type === 'free' ? t('course.list.filter_free', 'Free') : formatVnd(course.price_vnd)}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                course.status === 'published'
                  ? 'bg-emerald-50 text-emerald-700'
                  : course.status === 'archived'
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-amber-50 text-amber-700'
              }`}
            >
              {t(`course.list.${course.status}_badge`, course.status)}
            </span>
          </p>
        </div>
        {course.status === 'draft' ? (
          <Button
            onClick={async () => {
              try {
                const updated = await courseApi.publish(uid);
                setCourse(updated);
                toast.success(t('course.detail.publish_success', 'Published.'));
              } catch (err) {
                const msg = err instanceof Error ? err.message : t('common.error', 'Error');
                toast.error(msg);
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold gap-2"
          >
            <CheckCircle2 size={16} />
            {t('course.detail.publish', 'Publish')}
          </Button>
        ) : (
          <Button
            onClick={async () => {
              try {
                const updated = await courseApi.unpublish(uid);
                setCourse(updated);
                toast.success(t('course.detail.unpublish_success', 'Unpublished.'));
              } catch (err) {
                const msg = err instanceof Error ? err.message : t('common.error', 'Error');
                toast.error(msg);
              }
            }}
            variant="outline"
            className="rounded-xl font-bold"
          >
            {t('course.detail.unpublish', 'Unpublish')}
          </Button>
        )}
      </div>

      <div className="border-b border-border">
        <div className="flex gap-1">
          {(['info', 'lessons', 'students', 'sharing'] as Tab[]).map((k) => (
            <Button
              key={k}
              onClick={() => setTab(k)}
              className={`px-4 py-3 font-bold text-sm border-b-2 transition-colors ${
                tab === k ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t(`course.detail.tabs.${k}`, k)}
            </Button>
          ))}
        </div>
      </div>

      {tab === 'info' && <InfoTab course={course} onUpdated={setCourse} />}
      {tab === 'lessons' && (
        <LessonsTab
          lessons={lessons}
          courseUid={uid}
          onChange={fetchAll}
        />
      )}
      {tab === 'students' && <StudentsTab enrollments={enrollments} stats={stats} />}
      {tab === 'sharing' && <SharingTab course={course} sharingLink={sharingLink} setSharingLink={setSharingLink} />}
    </div>
  );
}

function InfoTab({ course, onUpdated }: { course: Course; onUpdated: (c: Course) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState(course.name);
  const [description, setDescription] = useState(course.description || '');
  const [coverUrl, setCoverUrl] = useState(course.cover_url || '');
  const [priceVnd, setPriceVnd] = useState(String(course.price_vnd || 0));
  const [pricingType, setPricingType] = useState(course.pricing_type);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const form = new FormData();
      form.append('file', file);
      form.append('owner_type', 'course');
      form.append('owner_id', course.uid);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/resource/upload/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}` },
        body: form,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setCoverUrl(data.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await courseApi.update(course.uid, {
        name,
        description,
        cover_url: coverUrl,
        pricing_type: pricingType,
        price_vnd: pricingType === 'paid' ? Number(priceVnd) || 0 : 0,
      });
      onUpdated(updated);
      toast.success(t('course.edit.success', 'Saved.'));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('common.error', 'Error');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border">
      <CardContent className="p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-bold">{t('course.create.name_label', 'Name')}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl outline-none focus:bg-card focus:border-indigo-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-bold">{t('course.create.cover_label', 'Cover')}</Label>
            <div className="border-2 border-dashed border-border rounded-xl p-2">
              {coverUrl ? (
                <div className="relative">
                  <img src={coverUrl} alt="cover" className="w-full h-24 object-cover rounded-lg" />
                  <Button type="button" size="sm" variant="ghost" onClick={() => setCoverUrl('')} className="absolute top-1 right-1 bg-white/80">
                    <Trash2 size={12} />
                  </Button>
                </div>
              ) : (
                <Label className="cursor-pointer block py-4 text-center">
                  <Input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                  <Upload size={20} className="mx-auto text-slate-300" />
                  <p className="text-xs text-muted-foreground mt-1">{uploading ? 'Uploading...' : 'Click to upload'}</p>
                </Label>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-bold">{t('course.create.description_label', 'Description')}</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl outline-none focus:bg-card focus:border-indigo-500 resize-none"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-bold">{t('course.create.pricing_label', 'Pricing')}</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['free', 'paid'] as const).map((p) => (
                <Button
                  key={p}
                  type="button"
                  onClick={() => setPricingType(p)}
                  className={`px-3 py-2 rounded-xl border-2 font-bold capitalize ${
                    pricingType === p ? 'border-indigo-500 bg-indigo-50' : 'border-border'
                  }`}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>
          {pricingType === 'paid' && (
            <div className="space-y-2">
              <Label className="text-sm font-bold">{t('course.create.price_label', 'Price (VND)')}</Label>
              <Input
                type="number"
                min={1000}
                value={priceVnd}
                onChange={(e) => setPriceVnd(e.target.value)}
                className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl outline-none focus:bg-card focus:border-indigo-500 font-bold"
              />
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {t('course.edit.submit', 'Save changes')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LessonsTab({
  lessons,
  courseUid,
  onChange,
}: {
  lessons: CourseLesson[];
  courseUid: string;
  onChange: () => void;
}) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<Partial<CreateLessonRequest> & { uid?: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editing || !editing.title) return;
    try {
      setSaving(true);
      if (editing.uid) {
        await courseApi.updateLesson(courseUid, editing.uid, editing);
      } else {
        await courseApi.createLesson(courseUid, editing as any);
      }
      setEditing(null);
      onChange();
      toast.success('Saved.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lessonUid: string) => {
    if (!confirm(t('course.detail.lesson_delete_confirm', 'Delete this lesson?'))) return;
    try {
      await courseApi.deleteLesson(courseUid, lessonUid);
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleMove = async (idx: number, dir: -1 | 1) => {
    const next = [...lessons];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    const items = next.map((l, i) => ({ uid: l.uid, order_index: i }));
    try {
      await courseApi.reorderLessons(courseUid, items);
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('course.detail.lesson_reorder_hint', 'Drag to reorder, or use the up/down arrows.')}
        </p>
        <Button
          onClick={() => setEditing({ title: '', description: '', is_preview: false, is_published: true })}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold gap-2"
        >
          <Plus size={16} />
          {t('course.detail.add_lesson', 'Add lesson')}
        </Button>
      </div>

      {lessons.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-12 text-center space-y-3">
            <BookOpen size={48} className="mx-auto text-slate-300" />
            <p className="text-slate-500">{t('course.detail.lesson_empty', 'No lessons yet.')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {lessons.map((l, idx) => (
            <div
              key={l.uid}
              className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3"
            >
              <div className="flex flex-col gap-0.5">
                <Button
                  onClick={() => handleMove(idx, -1)}
                  disabled={idx === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                >
                  ▲
                </Button>
                <Button
                  onClick={() => handleMove(idx, 1)}
                  disabled={idx === lessons.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                >
                  ▼
                </Button>
              </div>
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground truncate flex items-center gap-2">
                  {l.title}
                  {l.is_preview && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold">
                      {t('course.detail.preview_badge', 'Preview')}
                    </span>
                  )}
                  {!l.is_published && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {t('course.detail.draft_lesson_badge', 'Draft')}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                  {l.video_url && <span className="flex items-center gap-1"><Play size={10} />Video</span>}
                  {l.material_urls.length > 0 && (
                    <span className="flex items-center gap-1">
                      <FileText size={10} />{l.material_urls.length}
                    </span>
                  )}
                  {l.duration_seconds > 0 && <span>{l.duration_seconds}s</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setEditing({
                      uid: l.uid,
                      title: l.title,
                      description: l.description,
                      is_preview: l.is_preview,
                      is_published: l.is_published,
                      video_resource_uid: undefined,
                      material_resource_uids: l.material_urls.map((m) => m.uid),
                      duration_seconds: l.duration_seconds,
                    })
                  }
                  className="h-8 w-8"
                >
                  <Pencil size={14} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(l.uid)}
                  className="h-8 w-8 text-rose-500 hover:text-rose-600"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold">
              {editing.uid ? t('course.detail.edit_lesson', 'Edit lesson') : t('course.detail.add_lesson', 'Add lesson')}
            </h3>
            <div className="space-y-2">
              <Label className="text-sm font-bold">{t('course.detail.lesson_title_label', 'Title')}</Label>
              <Input
                value={editing.title || ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl outline-none focus:bg-card focus:border-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold">{t('course.detail.lesson_description_label', 'Description')}</Label>
              <Textarea
                value={editing.description || ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl outline-none focus:bg-card focus:border-indigo-500 resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-bold">{t('course.detail.lesson_duration_label', 'Duration (s)')}</Label>
              <Input
                type="number"
                min={0}
                value={editing.duration_seconds || 0}
                onChange={(e) => setEditing({ ...editing, duration_seconds: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-muted/50 border border-border rounded-xl outline-none focus:bg-card focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <div className="font-bold text-sm">{t('course.detail.lesson_preview_toggle', 'Allow preview')}</div>
                <p className="text-xs text-muted-foreground">Non-enrolled students can watch</p>
              </div>
              <Button
                onClick={() => setEditing({ ...editing, is_preview: !editing.is_preview })}
                className={`w-11 h-6 rounded-full transition-colors ${editing.is_preview ? 'bg-amber-500' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${editing.is_preview ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <div className="font-bold text-sm">{t('course.detail.lesson_published_toggle', 'Published')}</div>
                <p className="text-xs text-muted-foreground">Visible to enrolled students</p>
              </div>
              <Button
                onClick={() => setEditing({ ...editing, is_published: !editing.is_published })}
                className={`w-11 h-6 rounded-full transition-colors ${editing.is_published ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${editing.is_published ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </Button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                {t('course.create.cancel', 'Cancel')}
              </Button>
              <Button onClick={handleSave} disabled={saving || !editing.title} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold">
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                {t('course.detail.lesson_save', 'Save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StudentsTab({ enrollments, stats }: { enrollments: CourseEnrollment[]; stats: CourseStats | null }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground font-bold uppercase">{t('course.stats.total_enrollments', 'Total')}</div>
              <div className="text-2xl font-black mt-1">{stats.total_enrollments}</div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground font-bold uppercase">{t('course.stats.free_enrollments', 'Free')}</div>
              <div className="text-2xl font-black mt-1 text-emerald-600">{stats.free_enrollments}</div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground font-bold uppercase">{t('course.stats.paid_enrollments', 'Paid')}</div>
              <div className="text-2xl font-black mt-1 text-amber-600">{stats.paid_enrollments}</div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground font-bold uppercase">{t('course.stats.total_revenue', 'Revenue')}</div>
              <div className="text-2xl font-black mt-1 text-indigo-600">{formatVnd(stats.total_revenue_vnd)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {enrollments.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-12 text-center space-y-3">
            <Users size={48} className="mx-auto text-slate-300" />
            <p className="text-slate-500">{t('course.students.empty', 'No students enrolled yet.')}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-bold">Student</th>
                <th className="text-left px-4 py-3 font-bold">Type</th>
                <th className="text-left px-4 py-3 font-bold">Amount</th>
                <th className="text-left px-4 py-3 font-bold">Enrolled at</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e.consumer_id} className="border-t border-border">
                  <td className="px-4 py-3 flex items-center gap-2">
                    {e.consumer_avatar && (
                      <img src={e.consumer_avatar} alt="" className="w-8 h-8 rounded-full" />
                    )}
                    <span className="font-medium">{e.consumer_name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        e.pricing_type === 'free' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {e.pricing_type === 'free' ? t('course.students.free', 'Free') : t('course.students.paid', 'Paid')}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">{formatVnd(e.amount_vnd)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(e.enrolled_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function SharingTab({ course, sharingLink, setSharingLink }: { course: Course; sharingLink: string; setSharingLink: (s: string) => void }) {
  const { t } = useTranslation();
  const previewUrl = typeof window !== 'undefined' ? `${window.location.origin}/preview/${course.pid}` : `/preview/${course.pid}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('course.sharing.copied', 'Copied!'));
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="border-border">
        <CardContent className="p-6 space-y-4 text-center">
          <div className="inline-block p-4 bg-white rounded-2xl border border-border">
            <QRCodeSVG value={previewUrl} size={180} />
          </div>
          <p className="text-sm text-muted-foreground">
            {t('course.sharing.preview_link_hint', 'Anyone with this link can view the course preview for free.')}
          </p>
          {sharingLink && (
            <a href={sharingLink} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 underline inline-flex items-center gap-1">
              <Download size={12} /> Download high-res QR
            </a>
          )}
          {!sharingLink && (
            <Button size="sm" variant="ghost" onClick={async () => {
              try {
                const res: { qr_code_url?: string } = (await courseApi.sharingLink(course.uid)) as { qr_code_url?: string };
                if (res?.qr_code_url) setSharingLink(res.qr_code_url);
              } catch {}
            }}>
              Generate download
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label className="text-sm font-bold">{t('course.sharing.code_label', 'Public code')}</Label>
            <div className="flex gap-2 mt-1">
              <code className="flex-1 px-4 py-2.5 bg-muted/50 border border-border rounded-xl font-mono text-lg">
                {course.pid}
              </code>
              <Button size="icon" variant="outline" onClick={() => handleCopy(course.pid)}>
                <Copy size={16} />
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-sm font-bold">{t('course.sharing.url_label', 'Public link')}</Label>
            <div className="flex gap-2 mt-1">
              <Input
                readOnly
                value={previewUrl}
                className="flex-1 px-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm"
              />
              <Button size="icon" variant="outline" onClick={() => handleCopy(previewUrl)}>
                <Copy size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
