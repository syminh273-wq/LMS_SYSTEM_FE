'use client';

import { ChangeEvent, FormEvent, use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Check, ChevronDown, CircleDashed, Clock, ClipboardList, File, FileImage, FileText, Loader2, LockKeyhole, Save, Send, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { Classroom, ExamContentType, ExamStatus, spaceApi } from '@/lib/api';

interface CreateExamPageProps {
  params: Promise<{ uid: string }>;
}

const EXAM_KIND_OPTIONS = [
  {
    key: 'midterm',
    label: 'Kiem tra giua ki',
    description: 'Bài kiểm tra giữa kỳ của lớp',
    icon: ClipboardList,
  },
  {
    key: 'final',
    label: 'Kiem Tra Cuoi Ki',
    description: 'Bài kiểm tra cuối kỳ của lớp',
    icon: Calendar,
  },
  {
    key: 'regular',
    label: 'Kiem Tra Thuong Xuyen',
    description: 'Bài kiểm tra thường xuyên',
    icon: FileText,
  },
] as const;

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', icon: CircleDashed, activeClassName: 'bg-amber-50 text-amber-700', iconClassName: 'text-amber-500' },
  { value: 'published', label: 'Published', icon: Send, activeClassName: 'bg-emerald-50 text-emerald-700', iconClassName: 'text-emerald-500' },
  { value: 'closed', label: 'Closed', icon: LockKeyhole, activeClassName: 'bg-rose-50 text-rose-700', iconClassName: 'text-rose-500' },
] as const;

const CONTENT_TYPE_OPTIONS = [
  { value: 'markdown', label: 'Markdown', icon: FileText },
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'image', label: 'Hình ảnh', icon: FileImage },
  { value: 'file', label: 'File', icon: File },
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

export default function CreateExamPage({ params }: CreateExamPageProps) {
  const { uid } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [classroom, setClassroom] = useState<Classroom | null>(null);
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
      toast.error('Bạn không có quyền tạo bài kiểm tra');
      router.replace(`/space/classrooms/${uid}/details?tab=exams`);
      return;
    }

    const query = new URLSearchParams(window.location.search);
    const kind = query.get('kind');
    if (isExamKind(kind)) {
      setForm(prev => ({ ...prev, exam_kind: kind }));
    }
  }, [router, uid]);

  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        setFetching(true);
        const details = await spaceApi.classrooms.retrieve(uid);
        setClassroom(details);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Không thể tải thông tin lớp học');
      } finally {
        setFetching(false);
      }
    };

    void fetchClassroom();
  }, [uid]);

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

    if (needsResource && !selectedFile) {
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

      await spaceApi.exams.create({
        classroom_id: uid,
        title,
        description: form.description.trim(),
        content_type: form.content_type,
        content: needsResource ? uploadedResource?.url || '' : form.content.trim(),
        due_date: new Date(form.due_date).toISOString(),
        status: form.status,
        resource_uid: uploadedResource?.uid || null,
        resource_url: uploadedResource?.url || null,
        resource_name: uploadedResource?.name || '',
      });

      toast.success('Đã tạo bài kiểm tra');
      router.push(`/space/classrooms/${uid}/details?tab=exams&kind=${form.exam_kind}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể tạo bài kiểm tra');
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Loader2 size={40} className="mb-4 animate-spin" />
        <p className="text-sm font-medium">Đang tải dữ liệu lớp học...</p>
      </div>
    );
  }

  const needsResource = ['file', 'pdf', 'image'].includes(form.content_type);
  const selectedExamKind = EXAM_KIND_OPTIONS.find(option => option.key === form.exam_kind) || EXAM_KIND_OPTIONS[0];
  const SelectedExamKindIcon = selectedExamKind.icon;
  const selectedStatus = STATUS_OPTIONS.find(option => option.value === form.status) || STATUS_OPTIONS[0];
  const SelectedStatusIcon = selectedStatus.icon;
  const selectedContentType = CONTENT_TYPE_OPTIONS.find(option => option.value === form.content_type) || CONTENT_TYPE_OPTIONS[0];
  const SelectedContentTypeIcon = selectedContentType.icon;
  const dueDateDate = form.due_date ? form.due_date.slice(0, 10) : '';
  const dueDateTime = form.due_date ? form.due_date.slice(11, 16) : '';
  const dueDateLabel = formatDueDateLabel(form.due_date);

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
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Tạo bài kiểm tra mới</h1>
          <p className="text-sm font-medium text-slate-500">Nhập thông tin bài kiểm tra và chọn trạng thái công bố</p>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-900 outline-none transition-all hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <SelectedExamKindIcon size={17} className="shrink-0 text-indigo-500" />
                        <span className="truncate">{selectedExamKind.label}</span>
                      </span>
                      <ChevronDown size={16} className="shrink-0 text-slate-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={6} className="rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg shadow-slate-200/60">
                    {EXAM_KIND_OPTIONS.map(kind => {
                      const Icon = kind.icon;
                      const active = form.exam_kind === kind.key;

                      return (
                        <DropdownMenuItem
                          key={kind.key}
                          onClick={() => updateForm('exam_kind', kind.key)}
                          className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50 focus:bg-slate-50'}`}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <Icon size={16} className={active ? 'text-indigo-500' : 'text-slate-400'} />
                            <span className="truncate">{kind.label}</span>
                          </span>
                          {active && <Check size={15} className="text-indigo-500" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                <p className="px-1 text-[11px] font-bold uppercase tracking-tighter text-slate-400">
                  {selectedExamKind.description}
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 text-left text-sm font-semibold text-slate-900 outline-none transition-all hover:border-slate-300 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Calendar size={17} className="shrink-0 text-indigo-500" />
                        <span className={`truncate ${dueDateLabel ? 'text-slate-900' : 'text-slate-400'}`}>
                          {dueDateLabel || 'Chọn ngày và giờ'}
                        </span>
                      </span>
                      <ChevronDown size={16} className="shrink-0 text-slate-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={6} className="z-50 rounded-xl border border-slate-100 bg-white p-3 shadow-xl shadow-slate-200/70">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <Calendar size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900">Hạn nộp</div>
                          <div className="text-[11px] font-bold uppercase text-slate-400">Chọn ngày và giờ kết thúc</div>
                        </div>
                      </div>

                      <label className="block space-y-1.5">
                        <span className="px-1 text-[11px] font-black uppercase tracking-wider text-slate-500">Ngày</span>
                        <div className="relative">
                          <Calendar size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500" />
                          <input
                            type="date"
                            value={dueDateDate}
                            onChange={event => updateForm('due_date', combineDueDate(event.target.value, dueDateTime))}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none [color-scheme:light] hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                          />
                        </div>
                      </label>

                      <label className="block space-y-1.5">
                        <span className="px-1 text-[11px] font-black uppercase tracking-wider text-slate-500">Giờ</span>
                        <div className="relative">
                          <Clock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500" />
                          <input
                            type="time"
                            value={dueDateTime}
                            onChange={event => updateForm('due_date', combineDueDate(dueDateDate, event.target.value))}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none [color-scheme:light] hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                          />
                        </div>
                      </label>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </label>

              <label className="space-y-2">
                <span className="px-1 text-sm font-bold text-slate-700">Trạng thái</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-900 outline-none transition-all hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <SelectedStatusIcon size={17} className={`shrink-0 ${selectedStatus.iconClassName}`} />
                        <span className="truncate">{selectedStatus.label}</span>
                      </span>
                      <ChevronDown size={16} className="shrink-0 text-slate-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={6} className="rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg shadow-slate-200/60">
                    {STATUS_OPTIONS.map(status => {
                      const Icon = status.icon;
                      const active = form.status === status.value;

                      return (
                        <DropdownMenuItem
                          key={status.value}
                          onClick={() => updateForm('status', status.value as ExamStatus)}
                          className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${active ? status.activeClassName : 'text-slate-600 hover:bg-slate-50 focus:bg-slate-50'}`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon size={16} className={active ? status.iconClassName : 'text-slate-400'} />
                            {status.label}
                          </span>
                          {active && <Check size={15} className={status.iconClassName} />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </label>

              <label className="space-y-2">
                <span className="px-1 text-sm font-bold text-slate-700">Loại nội dung</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-900 outline-none transition-all hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <SelectedContentTypeIcon size={17} className="shrink-0 text-indigo-500" />
                        <span className="truncate">{selectedContentType.label}</span>
                      </span>
                      <ChevronDown size={16} className="shrink-0 text-slate-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={6} className="rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg shadow-slate-200/60">
                    {CONTENT_TYPE_OPTIONS.map(option => {
                      const Icon = option.icon;
                      const active = form.content_type === option.value;

                      return (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => {
                            setSelectedFile(null);
                            setForm(prev => ({ ...prev, content_type: option.value as ExamContentType, content: '' }));
                          }}
                          className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50 focus:bg-slate-50'}`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon size={16} className={active ? 'text-indigo-500' : 'text-slate-400'} />
                            {option.label}
                          </span>
                          {active && <Check size={15} className="text-indigo-500" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
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
                placeholder={needsResource ? 'File sẽ được upload khi bấm Lưu bài kiểm tra' : 'Nhập nội dung markdown hoặc hướng dẫn làm bài'}
              />
            </label>

            {needsResource && (
              <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-slate-800">
                    {selectedFile?.name || 'Chưa chọn tệp nào'}
                  </div>
                  <div className="text-[11px] font-bold uppercase text-slate-400">
                    {selectedFile ? 'Sẽ upload khi lưu' : form.content_type === 'image' ? 'Ảnh' : form.content_type === 'pdf' ? 'PDF' : 'Tệp đính kèm'}
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
            LƯU BÀI KIỂM TRA
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

function isExamKind(value: string | null): value is ExamKind {
  return EXAM_KIND_OPTIONS.some(option => option.key === value);
}

function combineDueDate(date: string, time: string) {
  if (!date) return '';
  return `${date}T${time || '23:59'}`;
}

function formatDueDateLabel(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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
