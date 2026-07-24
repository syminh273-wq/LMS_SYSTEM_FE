'use client';

import { ChangeEvent, FormEvent, use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Check, ChevronDown, CircleDashed, ClipboardList, File, FileImage, FileText, Loader2, LockKeyhole, Monitor, Save, Send, UploadCloud, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { Classroom, ExamContentType, ExamStatus, quizApi, spaceApi, Quiz } from '@/lib/api';

interface CreateExamPageProps {
  params: Promise<{ uid: string }>;
}

const EXAM_TYPE_OPTIONS = [
  { value: 'assignment', label: 'Thi tự luận (Nộp bài)', description: 'Học sinh nộp file hoặc viết bài', icon: FileText },
  { value: 'quiz', label: 'Thi trắc nghiệm (Hệ thống)', description: 'Sử dụng bộ câu hỏi có sẵn, tự động chấm điểm', icon: ClipboardList },
] as const;

const EXAM_KIND_OPTIONS = [
  {
    key: 'midterm',
    label: 'Kiểm tra giữa kì',
    description: 'Bài kiểm tra giữa kỳ của lớp',
    icon: ClipboardList,
  },
  {
    key: 'final',
    label: 'Kiểm Tra Cuối Kì',
    description: 'Bài kiểm tra cuối kỳ của lớp',
    icon: Calendar,
  },
  {
    key: 'regular',
    label: 'Kiểm Tra Thường Xuyên',
    description: 'Bài kiểm tra thường xuyên',
    icon: FileText,
  },
] as const;

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Bản nháp', icon: CircleDashed, activeClassName: 'bg-amber-50 text-amber-700', iconClassName: 'text-amber-500' },
  { value: 'published', label: 'Công bố', icon: Send, activeClassName: 'bg-emerald-50 text-emerald-700', iconClassName: 'text-emerald-500' },
  { value: 'closed', label: 'Đóng bài', icon: LockKeyhole, activeClassName: 'bg-rose-50 text-rose-700', iconClassName: 'text-rose-500' },
] as const;

const CONTENT_TYPE_OPTIONS = [
  { value: 'markdown', label: 'Markdown', icon: FileText },
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'image', label: 'Hình ảnh', icon: FileImage },
  { value: 'file', label: 'File', icon: File },
  { value: 'quiz', label: 'Trắc nghiệm', icon: ClipboardList },
] as const;

type ExamKind = typeof EXAM_KIND_OPTIONS[number]['key'];

type ExamForm = {
  exam_kind: ExamKind;
  exam_type: 'assignment' | 'quiz';
  ref_id: string;       // quiz_id OR resource_uid — generic FK
  max_grade: number;
  title: string;
  description: string;
  content_type: ExamContentType;
  body: string;         // inline content (markdown)
  due_date: string;
  status: ExamStatus;
  exam_mode: 'online' | 'offline';
  duration_seconds: number;
  camera_required: boolean;
};

export default function CreateExamPage({ params }: CreateExamPageProps) {
  const { uid } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [form, setForm] = useState<ExamForm>({
    exam_kind: 'midterm',
    exam_type: 'assignment',
    ref_id: '',
    max_grade: 10,
    title: '',
    description: '',
    content_type: 'markdown',
    body: '',
    due_date: '',
    status: 'published',
    exam_mode: 'offline',
    duration_seconds: 0,
    camera_required: false,
  });

  useEffect(() => {
    // Permission check placeholder
    const getCanManageExams = () => true;

    if (!getCanManageExams()) {
      toast.error('Bạn không có quyền tạo bài kiểm tra');
      router.replace(`/space/classrooms/${uid}/details?tab=exams`);
      return;
    }

    const query = new URLSearchParams(window.location.search);
    const kind = query.get('kind');
    if (kind && EXAM_KIND_OPTIONS.some(o => o.key === kind)) {
      setForm(prev => ({ ...prev, exam_kind: kind as ExamKind }));
    }
  }, [router, uid]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetching(true);
        const [details, quizList] = await Promise.all([
          spaceApi.classrooms.retrieve(uid),
          quizApi.list(uid),
        ]);
        setClassroom(details);
        setQuizzes(quizList);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
      } finally {
        setFetching(false);
      }
    };

    void fetchData();
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

    if (form.exam_mode !== 'online' && !form.due_date) {
      toast.error('Vui lòng chọn hạn nộp');
      return;
    }

    if (form.exam_type === 'quiz' && !form.ref_id) {
      toast.error('Vui lòng chọn bộ đề trắc nghiệm');
      return;
    }

    const needsResource = form.exam_type === 'assignment' && ['file', 'pdf', 'image'].includes(form.content_type);
    if (form.exam_type === 'assignment' && form.content_type === 'markdown' && !form.body.trim()) {
      toast.error('Vui lòng nhập hướng dẫn làm bài');
      return;
    }

    if (needsResource && !selectedFile) {
      toast.error('Vui lòng chọn tệp đính kèm');
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
        exam_type: form.exam_type,
        exam_period: form.exam_kind,
        ref_id: form.exam_type === 'quiz' ? form.ref_id : (uploadedResource?.uid ?? null),
        max_grade: form.exam_type === 'quiz' ? form.max_grade : 10,
        content_type: form.exam_type === 'quiz' ? 'quiz' : form.content_type,
        body: form.exam_type === 'quiz' ? '' : (needsResource ? '' : form.body.trim()),
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        status: form.status,
        exam_mode: form.exam_mode,
        duration_seconds: form.exam_mode === 'online' ? form.duration_seconds : 0,
        camera_required: form.exam_mode === 'online' ? form.camera_required : false,
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
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <Loader2 className="mb-4 size-10 animate-spin" />
        <p className="text-sm font-medium">Đang tải dữ liệu lớp học...</p>
      </div>
    );
  }

  const needsResource = form.exam_type === 'assignment' && ['file', 'pdf', 'image'].includes(form.content_type);
  const selectedExamType = EXAM_TYPE_OPTIONS.find(option => option.value === form.exam_type) || EXAM_TYPE_OPTIONS[0];
  const SelectedExamTypeIcon = selectedExamType.icon;
  const selectedExamKind = EXAM_KIND_OPTIONS.find(option => option.key === form.exam_kind) || EXAM_KIND_OPTIONS[0];
  const SelectedExamKindIcon = selectedExamKind.icon;
  const selectedStatus = STATUS_OPTIONS.find(option => option.value === form.status) || STATUS_OPTIONS[0];
  const SelectedStatusIcon = selectedStatus.icon;
  const selectedContentType = CONTENT_TYPE_OPTIONS.find(option => option.value === (form.exam_type === 'quiz' ? 'quiz' : form.content_type)) || CONTENT_TYPE_OPTIONS[0];
  const SelectedContentTypeIcon = selectedContentType.icon;
  const selectedQuiz = quizzes.find(q => q.uid === form.ref_id);

  return (
    <div className="mx-auto max-w-4xl py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => router.push(`/space/classrooms/${uid}/details?tab=exams&kind=${form.exam_kind}`)}
          className="rounded-xl"
        >
          <ArrowLeft className="size-4 text-muted-foreground" />
        </Button>
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <ClipboardList className="size-3.5" />
            {classroom?.name || 'Lớp học'}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tạo bài kiểm tra mới</h1>
          <p className="text-sm text-muted-foreground">Nhập thông tin bài kiểm tra và chọn hình thức thi</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Hình thức thi — section đầu tiên ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-semibold">
              <Monitor className="size-5 text-primary" />
              Hình thức thi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateForm('exam_mode', 'offline')}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${form.exam_mode === 'offline' ? 'border-primary bg-primary/10' : 'border-border bg-muted/50 hover:bg-muted'}`}
              >
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${form.exam_mode === 'offline' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <WifiOff className="size-4.5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Ngoại tuyến</div>
                  <div className="text-xs text-muted-foreground">Học sinh nộp bài thông thường</div>
                </div>
                {form.exam_mode === 'offline' && <Check className="ml-auto size-4 text-primary" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  updateForm('exam_mode', 'online');
                  updateForm('exam_type', 'quiz');
                  updateForm('content_type', 'quiz');
                }}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${form.exam_mode === 'online' ? 'border-primary bg-primary/10' : 'border-border bg-muted/50 hover:bg-muted'}`}
              >
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${form.exam_mode === 'online' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <Wifi className="size-4.5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Trực tuyến</div>
                  <div className="text-xs text-muted-foreground">Thi trắc nghiệm, có camera & đếm giờ</div>
                </div>
                {form.exam_mode === 'online' && <Check className="ml-auto size-4 text-primary" />}
              </button>
            </div>

            {form.exam_mode === 'online' && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-medium leading-relaxed text-amber-700">
                  Thời gian làm bài, yêu cầu Camera và giới hạn vào trễ sẽ được thiết lập khi bạn bấm nút &quot;Mở ca thi&quot; tại danh sách bài kiểm tra.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Thông tin bài kiểm tra ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-semibold">
              <FileText className="size-5 text-primary" />
              Thông tin bài kiểm tra
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Hình thức bài thi</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={form.exam_mode === 'online'}>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={form.exam_mode === 'online'}
                      className="h-12 w-full justify-between gap-3 rounded-xl px-4"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <SelectedExamTypeIcon className="size-4 shrink-0 text-primary" />
                        <span className="truncate">{selectedExamType.label}</span>
                      </span>
                      {form.exam_mode !== 'online' && <ChevronDown className="size-4 shrink-0 text-muted-foreground" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={6}>
                    {EXAM_TYPE_OPTIONS.map(option => {
                      const Icon = option.icon;
                      const active = form.exam_type === option.value;

                      return (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => {
                            updateForm('exam_type', option.value as 'assignment' | 'quiz');
                            if (option.value === 'quiz') {
                              updateForm('content_type', 'quiz');
                            } else {
                              updateForm('content_type', 'markdown');
                            }
                          }}
                          className={`flex items-center justify-between gap-3 px-3 py-2.5 font-medium ${active ? 'bg-primary/10 text-primary focus:bg-primary/10 focus:text-primary' : ''}`}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <Icon className={`size-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="truncate">{option.label}</span>
                          </span>
                          {active && <Check className="size-4 text-primary" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                {form.exam_mode === 'online' && (
                  <p className="text-xs font-medium italic text-primary">
                    * Chế độ trực tuyến bắt buộc thi trắc nghiệm
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Phân loại</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 w-full justify-between gap-3 rounded-xl px-4"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <SelectedExamKindIcon className="size-4 shrink-0 text-primary" />
                        <span className="truncate">{selectedExamKind.label}</span>
                      </span>
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={6}>
                    {EXAM_KIND_OPTIONS.map(kind => {
                      const Icon = kind.icon;
                      const active = form.exam_kind === kind.key;

                      return (
                        <DropdownMenuItem
                          key={kind.key}
                          onClick={() => updateForm('exam_kind', kind.key)}
                          className={`flex items-center justify-between gap-3 px-3 py-2.5 font-medium ${active ? 'bg-primary/10 text-primary focus:bg-primary/10 focus:text-primary' : ''}`}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <Icon className={`size-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="truncate">{kind.label}</span>
                          </span>
                          {active && <Check className="size-4 text-primary" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tiêu đề <span className="text-rose-500">*</span></Label>
              <Input
                value={form.title}
                onChange={event => updateForm('title', event.target.value)}
                className="h-12 rounded-xl"
                placeholder="Ví dụ: Kiểm tra giữa kỳ - Chương 1"
              />
            </div>

            {form.exam_type === 'quiz' && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Bộ đề trắc nghiệm <span className="text-rose-500">*</span></Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 w-full justify-between gap-3 rounded-xl px-4"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <ClipboardList className="size-4 shrink-0 text-primary" />
                          <span className="truncate">{selectedQuiz?.title || 'Chọn bộ đề trắc nghiệm'}</span>
                        </span>
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" sideOffset={6} className="max-h-[300px] overflow-y-auto">
                      {quizzes.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground">Không có bộ đề nào khả dụng</div>
                      ) : (
                        quizzes.map(quiz => (
                          <DropdownMenuItem
                            key={quiz.uid}
                            onClick={() => updateForm('ref_id', quiz.uid)}
                            className={`flex items-center justify-between gap-3 px-3 py-2.5 font-medium ${form.ref_id === quiz.uid ? 'bg-primary/10 text-primary focus:bg-primary/10 focus:text-primary' : ''}`}
                          >
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate">{quiz.title}</span>
                              <span className="text-xs font-normal text-muted-foreground">{quiz.questions_count} câu hỏi</span>
                            </span>
                            {form.ref_id === quiz.uid && <Check className="size-4 text-primary" />}
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <Label>Thang điểm tối đa</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={form.max_grade}
                    onChange={event => updateForm('max_grade', parseFloat(event.target.value) || 0)}
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={form.description}
                onChange={event => updateForm('description', event.target.value)}
                rows={4}
                className="resize-none rounded-xl"
                placeholder="Mô tả ngắn về yêu cầu bài thi"
              />
            </div>
          </CardContent>
        </Card>

        {form.exam_mode !== 'online' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-semibold">
                <Calendar className="size-5 text-primary" />
                Thời hạn & Trạng thái
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Hạn nộp <span className="text-rose-500">*</span></Label>
                  <Input
                    type="datetime-local"
                    value={form.due_date}
                    onChange={event => updateForm('due_date', event.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Trạng thái</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 w-full justify-between gap-3 rounded-xl px-4"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <SelectedStatusIcon className={`size-4 shrink-0 ${selectedStatus.iconClassName}`} />
                          <span className="truncate">{selectedStatus.label}</span>
                        </span>
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" sideOffset={6}>
                      {STATUS_OPTIONS.map(status => {
                        const Icon = status.icon;
                        const active = form.status === status.value;

                        return (
                          <DropdownMenuItem
                            key={status.value}
                            onClick={() => updateForm('status', status.value as ExamStatus)}
                            className={`flex items-center justify-between gap-3 px-3 py-2.5 font-medium ${active ? status.activeClassName : ''}`}
                          >
                            <span className="flex items-center gap-2">
                              <Icon className={`size-4 ${active ? status.iconClassName : 'text-muted-foreground'}`} />
                              {status.label}
                            </span>
                            {active && <Check className={`size-4 ${status.iconClassName}`} />}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <Label>Loại nội dung</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild disabled={form.exam_type === 'quiz'}>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={form.exam_type === 'quiz'}
                        className="h-12 w-full justify-between gap-3 rounded-xl px-4"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <SelectedContentTypeIcon className="size-4 shrink-0 text-primary" />
                          <span className="truncate">{selectedContentType.label}</span>
                        </span>
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" sideOffset={6}>
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
                            disabled={option.value === 'quiz'}
                            className={`flex items-center justify-between gap-3 px-3 py-2.5 font-medium ${active ? 'bg-primary/10 text-primary focus:bg-primary/10 focus:text-primary' : ''} ${option.value === 'quiz' ? 'opacity-50' : ''}`}
                          >
                            <span className="flex items-center gap-2">
                              <Icon className={`size-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                              {option.label}
                            </span>
                            {active && <Check className="size-4 text-primary" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hướng dẫn làm bài <span className="text-rose-500">*</span></Label>
                <Textarea
                  value={form.body}
                  onChange={event => updateForm('body', event.target.value)}
                  rows={needsResource ? 2 : 6}
                  disabled={needsResource || form.exam_type === 'quiz'}
                  className="resize-none rounded-xl"
                  placeholder={form.exam_type === 'quiz' ? 'Nội dung sẽ được lấy từ bộ đề trắc nghiệm' : needsResource ? 'File đính kèm sẽ được upload khi lưu' : 'Nhập hướng dẫn làm bài cho học sinh'}
                />
              </div>

              {needsResource && (
                <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">
                      {selectedFile?.name || 'Chưa chọn tệp nào'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedFile ? 'Sẽ upload khi lưu' : 'Yêu cầu tệp đính kèm'}
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleResourceSelect}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                  >
                    <UploadCloud className="size-4" />
                    Chọn tệp
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(`/space/classrooms/${uid}/details?tab=exams&kind=${form.exam_kind}`)}
            disabled={saving}
            className="px-6 text-muted-foreground"
          >
            HỦY
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="h-12 min-w-[180px] rounded-xl px-6"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            TẠO BÀI THI
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

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
