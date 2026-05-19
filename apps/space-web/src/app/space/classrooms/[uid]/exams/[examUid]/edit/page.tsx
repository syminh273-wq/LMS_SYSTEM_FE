'use client';

import { ChangeEvent, FormEvent, use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardList, FileText, Loader2, Save, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Classroom, Exam, ExamContentType, ExamStatus, spaceApi } from '@/lib/api';

interface EditExamPageProps {
  params: Promise<{ uid: string; examUid: string }>;
}

const EXAM_KIND_OPTIONS = [
  { key: 'midterm', label: 'Kiem tra giua ki', description: 'Bài kiểm tra giữa kỳ của lớp' },
  { key: 'final', label: 'Kiem Tra Cuoi Ki', description: 'Bài kiểm tra cuối kỳ của lớp' },
  { key: 'regular', label: 'Kiem Tra Thuong Xuyen', description: 'Bài kiểm tra thường xuyên' },
] as const;

type ExamKind = typeof EXAM_KIND_OPTIONS[number]['key'];

type ExamForm = {
  exam_kind: ExamKind;
  title: string;
  description: string;
  content_type: ExamContentType;
  content: string;
  due_date: string;
  status: ExamStatus;
};

export default function EditExamPage({ params }: EditExamPageProps) {
  const { uid, examUid } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [form, setForm] = useState<ExamForm>({
    exam_kind: 'midterm',
    title: '',
    description: '',
    content_type: 'markdown',
    content: '',
    due_date: '',
    status: 'draft',
  });

  useEffect(() => {
    if (!getCanManageExams()) {
      toast.error('Bạn không có quyền sửa bài kiểm tra');
      router.replace(`/space/classrooms/${uid}/details?tab=exams`);
      return;
    }

    const fetchData = async () => {
      try {
        setFetching(true);
        const [classroomDetails, examDetails] = await Promise.all([
          spaceApi.classrooms.retrieve(uid),
          spaceApi.exams.retrieve(examUid),
        ]);
        setClassroom(classroomDetails);
        setExam(examDetails);
        setForm({
          exam_kind: inferExamKind(examDetails.title),
          title: stripExamKindPrefix(examDetails.title),
          description: examDetails.description || '',
          content_type: examDetails.content_type,
          content: examDetails.content || '',
          due_date: toDatetimeLocalValue(examDetails.due_date),
          status: examDetails.status,
        });
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Không thể tải bài kiểm tra');
      } finally {
        setFetching(false);
      }
    };

    void fetchData();
  }, [router, uid, examUid]);

  const updateForm = <TKey extends keyof ExamForm>(key: TKey, value: ExamForm[TKey]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleResourceSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    setSelectedFile(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài kiểm tra');
      return;
    }
    if (!form.due_date) {
      toast.error('Vui lòng chọn hạn nộp');
      return;
    }

    const needsResource = ['file', 'pdf', 'image'].includes(form.content_type);
    if (form.content_type === 'markdown' && !form.content.trim()) {
      toast.error('Vui lòng nhập nội dung markdown cho bài kiểm tra');
      return;
    }
    if (needsResource && !selectedFile && !exam?.resource_url) {
      toast.error('Vui lòng chọn tệp cho loại nội dung này');
      return;
    }

    setSaving(true);
    try {
      const uploadedResource = needsResource && selectedFile
        ? await uploadExamResource(selectedFile, uid)
        : null;
      const kindLabel = getExamKindLabel(form.exam_kind);
      const normalizedTitle = normalizeText(form.title);
      const title = !normalizedTitle.includes(normalizeText(kindLabel))
        ? `${kindLabel} - ${form.title.trim()}`
        : form.title.trim();

      await spaceApi.exams.update(examUid, {
        classroom_id: uid,
        title,
        description: form.description.trim(),
        content_type: form.content_type,
        content: needsResource ? uploadedResource?.url || exam?.resource_url || form.content : form.content.trim(),
        due_date: new Date(form.due_date).toISOString(),
        status: form.status,
        resource_uid: uploadedResource?.uid || exam?.resource_uid || null,
        resource_url: uploadedResource?.url || exam?.resource_url || null,
        resource_name: uploadedResource?.name || exam?.resource_name || '',
      });

      toast.success('Đã cập nhật bài kiểm tra');
      router.push(`/space/classrooms/${uid}/details?tab=exams&kind=${form.exam_kind}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật bài kiểm tra');
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Loader2 size={40} className="mb-4 animate-spin" />
        <p className="text-sm font-medium">Đang tải bài kiểm tra...</p>
      </div>
    );
  }

  const needsResource = ['file', 'pdf', 'image'].includes(form.content_type);

  return (
    <div className="mx-auto max-w-4xl py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/space/classrooms/${uid}/details?tab=exams&kind=${form.exam_kind}`)}
          className="rounded-xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft size={18} className="text-slate-600" />
        </Button>
        <div>
          <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-indigo-500">
            <ClipboardList size={14} />
            {classroom?.name || 'Lớp học'}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Chỉnh sửa bài kiểm tra</h1>
          <p className="text-sm font-medium text-slate-500">Cập nhật nội dung, hạn nộp và trạng thái bài kiểm tra</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
          <div className="h-2 bg-indigo-600" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <FileText size={20} className="text-indigo-500" />
              Thông tin bài kiểm tra
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="px-1 text-sm font-bold text-slate-700">Loại kiểm tra</span>
                <select
                  value={form.exam_kind}
                  onChange={event => updateForm('exam_kind', event.target.value as ExamKind)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                >
                  {EXAM_KIND_OPTIONS.map(kind => (
                    <option key={kind.key} value={kind.key}>{kind.label}</option>
                  ))}
                </select>
                <p className="px-1 text-[11px] font-bold uppercase tracking-tighter text-slate-400">
                  {EXAM_KIND_OPTIONS.find(kind => kind.key === form.exam_kind)?.description}
                </p>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="px-1 text-sm font-bold text-slate-700">Tiêu đề <span className="text-rose-500">*</span></span>
                <input
                  value={form.title}
                  onChange={event => updateForm('title', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  placeholder="Ví dụ: Chương 1 - Hàm số"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="px-1 text-sm font-bold text-slate-700">Mô tả</span>
              <textarea
                value={form.description}
                onChange={event => updateForm('description', event.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                placeholder="Mô tả ngắn về yêu cầu, phạm vi hoặc lưu ý cho học sinh"
              />
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="space-y-2">
                <span className="px-1 text-sm font-bold text-slate-700">Hạn nộp <span className="text-rose-500">*</span></span>
                <input
                  type="datetime-local"
                  value={form.due_date}
                  onChange={event => updateForm('due_date', event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                />
              </label>

              <label className="space-y-2">
                <span className="px-1 text-sm font-bold text-slate-700">Trạng thái</span>
                <select
                  value={form.status}
                  onChange={event => updateForm('status', event.target.value as ExamStatus)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="px-1 text-sm font-bold text-slate-700">Loại nội dung</span>
                <select
                  value={form.content_type}
                  onChange={event => {
                    setSelectedFile(null);
                    setForm(prev => ({ ...prev, content_type: event.target.value as ExamContentType, content: '' }));
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                >
                  <option value="markdown">Markdown</option>
                  <option value="file">File</option>
                  <option value="pdf">PDF</option>
                  <option value="image">Image</option>
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="px-1 text-sm font-bold text-slate-700">Nội dung <span className="text-rose-500">*</span></span>
              <textarea
                value={form.content}
                onChange={event => updateForm('content', event.target.value)}
                rows={needsResource ? 2 : 6}
                disabled={needsResource}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                placeholder={needsResource ? 'File mới sẽ được upload khi bấm Lưu bài kiểm tra' : 'Nhập nội dung markdown hoặc hướng dẫn làm bài'}
              />
            </label>

            {needsResource && (
              <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-slate-800">
                    {selectedFile?.name || exam?.resource_name || 'Chưa chọn tệp nào'}
                  </div>
                  <div className="text-[11px] font-bold uppercase text-slate-400">
                    {selectedFile ? 'Sẽ upload khi lưu' : exam?.resource_url ? 'Đang dùng tài nguyên hiện tại' : form.content_type === 'image' ? 'Ảnh' : form.content_type === 'pdf' ? 'PDF' : 'Tệp đính kèm'}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={form.content_type === 'image' ? 'image/*' : form.content_type === 'pdf' ? 'application/pdf' : 'image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip'}
                  onChange={handleResourceSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="rounded-xl text-xs font-bold"
                >
                  <UploadCloud size={16} className="mr-2" />
                  Chọn tệp
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(`/space/classrooms/${uid}/details?tab=exams&kind=${form.exam_kind}`)}
            disabled={saving}
            className="rounded-xl px-6 text-xs font-bold text-slate-500"
          >
            HỦY
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="h-12 min-w-[180px] rounded-xl bg-indigo-600 px-6 text-xs font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700"
          >
            {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
            LƯU THAY ĐỔI
          </Button>
        </div>
      </form>
    </div>
  );
}

async function uploadExamResource(file: File, classroomUid: string) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify({ context: 'classroom_exam', classroom_uid: classroomUid }));
  formData.append('owner_id', classroomUid);
  formData.append('owner_type', 'classroom');

  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${apiBase}/api/v1/resource/upload/`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error((error.message as string) || (error.detail as string) || 'Upload thất bại');
  }

  return response.json() as Promise<{ uid: string; url: string; name: string }>;
}

function getExamKindLabel(kind: ExamKind) {
  return EXAM_KIND_OPTIONS.find(option => option.key === kind)?.label || EXAM_KIND_OPTIONS[0].label;
}

function inferExamKind(title: string): ExamKind {
  const normalized = normalizeText(title);
  if (normalized.includes('kiem tra cuoi ki') || normalized.includes('cuoi ki')) return 'final';
  if (normalized.includes('kiem tra thuong xuyen') || normalized.includes('thuong xuyen')) return 'regular';
  return 'midterm';
}

function stripExamKindPrefix(title: string) {
  return title.replace(/^(Kiem tra giua ki|Kiem Tra Cuoi Ki|Kiem Tra Thuong Xuyen)\s*-\s*/i, '').trim();
}

function toDatetimeLocalValue(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getCanManageExams() {
  try {
    const raw = localStorage.getItem('userProfile');
    if (!raw) return true;
    const profile = JSON.parse(raw) as { role?: string; user_type?: string; is_admin?: boolean; is_staff?: boolean };
    const role = (profile.role || profile.user_type || '').toLowerCase();
    return profile.is_admin === true || profile.is_staff === true || role === 'admin' || role === 'teacher' || role === 'space' || !role;
  } catch {
    return true;
  }
}
