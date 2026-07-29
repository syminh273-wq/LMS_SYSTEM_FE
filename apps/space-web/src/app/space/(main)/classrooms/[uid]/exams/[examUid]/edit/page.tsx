'use client';

import { ChangeEvent, FormEvent, use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Camera, Check, ChevronDown, CircleDashed, ClipboardList, File, FileImage, FileText, Loader2, LockKeyhole, Monitor, Save, Send, Timer, UploadCloud, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { Classroom, Exam, ExamContentType, ExamStatus, quizApi, Quiz, spaceApi } from '@/lib/api';

interface EditExamPageProps {
  params: Promise<{ uid: string; examUid: string }>;
}

const EXAM_TYPE_OPTIONS = [
  { value: 'assignment', label: 'Thi tự luận (Nộp bài)', description: 'Học sinh nộp file hoặc viết bài', icon: FileText },
  { value: 'quiz', label: 'Thi trắc nghiệm (Hệ thống)', description: 'Sử dụng bộ câu hỏi có sẵn, tự động chấm điểm', icon: ClipboardList },
] as const;

const EXAM_KIND_OPTIONS = [
  { key: 'midterm', label: 'Kiểm tra giữa kì', description: 'Bài kiểm tra giữa kỳ của lớp', icon: ClipboardList },
  { key: 'final', label: 'Kiểm Tra Cuối Kì', description: 'Bài kiểm tra cuối kỳ của lớp', icon: Calendar },
  { key: 'regular', label: 'Kiểm Tra Thường Xuyên', description: 'Bài kiểm tra thường xuyên', icon: FileText },
] as const;

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Bản nháp', icon: CircleDashed, activeClassName: 'bg-amber-50 text-amber-700', iconClassName: 'text-amber-500' },
  { value: 'published', label: 'Công bố', icon: Send, activeClassName: 'bg-emerald-50 text-emerald-700', iconClassName: 'text-emerald-500' },
  { value: 'closed', label: 'Đóng bài', icon: LockKeyhole, activeClassName: 'bg-destructive/10 text-destructive', iconClassName: 'text-destructive' },
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
  ref_id: string;
  max_grade: number;
  title: string;
  description: string;
  content_type: ExamContentType;
  body: string;
  due_date: string;
  status: ExamStatus;
  exam_mode: 'online' | 'offline';
  duration_seconds: number;
  camera_required: boolean;
};

export default function EditExamPage({ params }: EditExamPageProps) {
  const { uid, examUid } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
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
    status: 'draft',
    exam_mode: 'offline',
    duration_seconds: 0,
    camera_required: false,
  });

  useEffect(() => {
    // Permission check placeholder
    const getCanManageExams = () => true;

    if (!getCanManageExams()) {
      toast.error('Bạn không có quyền sửa bài kiểm tra');
      router.replace(`/space/classrooms/${uid}/details?tab=exams`);
      return;
    }

    const fetchData = async () => {
      try {
        setFetching(true);
        const [classroomDetails, examDetails, quizList] = await Promise.all([
          spaceApi.classrooms.retrieve(uid),
          spaceApi.exams.retrieve(examUid),
          quizApi.list(uid),
        ]);
        setClassroom(classroomDetails);
        setExam(examDetails);
        setQuizzes(quizList);
        setForm({
          exam_kind: inferExamKind(examDetails.title),
          exam_type: examDetails.exam_type || 'assignment',
          ref_id: examDetails.ref_id || '',
          max_grade: examDetails.max_grade || 10,
          title: stripExamKindPrefix(examDetails.title),
          description: examDetails.description || '',
          content_type: examDetails.content_type,
          body: examDetails.body || '',
          due_date: toDatetimeLocalValue(examDetails.due_date),
          status: examDetails.status,
          exam_mode: examDetails.exam_mode || 'offline',
          duration_seconds: examDetails.duration_seconds || 0,
          camera_required: examDetails.camera_required || false,
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
      toast.error('Vui lòng nhập nội dung hướng dẫn');
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
        exam_type: form.exam_type,
        exam_period: form.exam_kind,
        ref_id: form.exam_type === 'quiz' ? form.ref_id : (uploadedResource?.uid ?? exam?.ref_id ?? null),
        max_grade: form.exam_type === 'quiz' ? form.max_grade : 10,
        content_type: form.exam_type === 'quiz' ? 'quiz' : form.content_type,
        body: form.exam_type === 'quiz' ? '' : (needsResource ? '' : form.body.trim()),
        due_date: form.due_date ? new Date(form.due_date).toISOString() : '',
        status: form.status,
        exam_mode: form.exam_mode,
        duration_seconds: form.exam_mode === 'online' ? form.duration_seconds : 0,
        camera_required: form.exam_mode === 'online' ? form.camera_required : false,
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
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <Loader2 size={40} className="mb-4 animate-spin" />
        <p className="text-sm font-medium">Đang tải bài kiểm tra...</p>
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
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/space/classrooms/${uid}/details?tab=exams&kind=${form.exam_kind}`)}
        >
          <ArrowLeft size={18} className="text-muted-foreground" />
        </Button>
        <div>
          <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-primary-brand">
            <ClipboardList size={14} />
            {classroom?.name || 'Lớp học'}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Chỉnh sửa bài kiểm tra</h1>
          <p className="text-sm font-medium text-muted-foreground">Cập nhật nội dung và thiết lập bài kiểm tra</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
          <div className="h-2 bg-primary-brand" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <FileText size={20} className="text-primary-brand" />
              Thông tin bài kiểm tra
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Label className="space-y-2">
                <span className="px-1 text-sm font-bold text-foreground">Hình thức bài thi</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={form.exam_mode === 'online'}>
                    <Button
                      type="button"
                      disabled={form.exam_mode === 'online'}
                      className="flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-4 text-left text-sm font-medium text-foreground outline-none transition-all hover:bg-card focus:border-primary-brand focus:bg-card focus:ring-4 focus:ring-primary-brand/10 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <SelectedExamTypeIcon size={17} className="shrink-0 text-primary-brand" />
                        <span className="truncate">{selectedExamType.label}</span>
                      </span>
                      {form.exam_mode !== 'online' && <ChevronDown size={16} className="shrink-0 text-muted-foreground" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={6} className="rounded-xl border border-border bg-card p-1.5 shadow-lg">
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
                          className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-muted-foreground data-[active=true]:text-foreground data-[active=true]:font-semibold"
                          data-active={active}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <Icon size={16} className="text-muted-foreground data-[active=true]:text-foreground" data-active={active} />
                            <span className="truncate">{option.label}</span>
                          </span>
                          {active && <Check size={15} className="text-primary-brand" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                {form.exam_mode === 'online' && (
                  <p className="px-1 text-[10px] font-bold text-primary-brand italic">
                    * Chế độ trực tuyến bắt buộc thi trắc nghiệm
                  </p>
                )}
              </Label>

              <Label className="space-y-2">
                <span className="px-1 text-sm font-bold text-foreground">Phân loại</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      className="flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-4 text-left text-sm font-medium text-foreground outline-none transition-all hover:bg-card focus:border-primary-brand focus:bg-card focus:ring-4 focus:ring-primary-brand/10"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <SelectedExamKindIcon size={17} className="shrink-0 text-primary-brand" />
                        <span className="truncate">{selectedExamKind.label}</span>
                      </span>
                      <ChevronDown size={16} className="shrink-0 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={6} className="rounded-xl border border-border bg-card p-1.5 shadow-lg">
                    {EXAM_KIND_OPTIONS.map(kind => {
                      const Icon = kind.icon;
                      const active = form.exam_kind === kind.key;

                      return (
                        <DropdownMenuItem
                          key={kind.key}
                          onClick={() => updateForm('exam_kind', kind.key)}
                          className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-muted-foreground data-[active=true]:text-foreground data-[active=true]:font-semibold"
                          data-active={active}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <Icon size={16} className="text-muted-foreground data-[active=true]:text-foreground" data-active={active} />
                            <span className="truncate">{kind.label}</span>
                          </span>
                          {active && <Check size={15} className="text-primary-brand" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </Label>
            </div>

            <Label className="block space-y-2">
              <span className="px-1 text-sm font-bold text-foreground">Tiêu đề <span className="text-destructive">*</span></span>
              <Input
                value={form.title}
                onChange={event => updateForm('title', event.target.value)}
                className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm font-medium text-foreground outline-none transition-all focus:border-primary-brand focus:bg-card focus:ring-4 focus:ring-primary-brand/10"
                placeholder="Ví dụ: Kiểm tra giữa kỳ - Chương 1"
              />
            </Label>

            {form.exam_type === 'quiz' && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Label className="space-y-2">
                  <span className="px-1 text-sm font-bold text-foreground">Bộ đề trắc nghiệm <span className="text-destructive">*</span></span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        className="flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-4 text-left text-sm font-medium text-foreground outline-none transition-all hover:bg-card focus:border-primary-brand focus:bg-card focus:ring-4 focus:ring-primary-brand/10"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <ClipboardList size={17} className="shrink-0 text-primary-brand" />
                          <span className="truncate">{selectedQuiz?.title || 'Chọn bộ đề trắc nghiệm'}</span>
                        </span>
                        <ChevronDown size={16} className="shrink-0 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" sideOffset={6} className="max-h-[300px] overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-lg">
                      {quizzes.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground">Không có bộ đề nào khả dụng</div>
                      ) : (
                        quizzes.map(quiz => (
                          <DropdownMenuItem
                            key={quiz.uid}
                            onClick={() => updateForm('ref_id', quiz.uid)}
                            className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-muted-foreground data-[active=true]:text-foreground data-[active=true]:font-semibold"
                            data-active={form.ref_id === quiz.uid}
                          >
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate">{quiz.title}</span>
                              <span className="text-[10px] text-muted-foreground font-medium">{quiz.questions_count} câu hỏi</span>
                            </span>
                            {form.ref_id === quiz.uid && <Check size={15} className="text-primary-brand" />}
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Label>

                <Label className="space-y-2">
                  <span className="px-1 text-sm font-bold text-foreground">Thang điểm tối đa</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={form.max_grade}
                    onChange={event => updateForm('max_grade', parseFloat(event.target.value) || 0)}
                    className="w-full h-12 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm font-medium text-foreground outline-none transition-all focus:border-primary-brand focus:bg-card focus:ring-4 focus:ring-primary-brand/10"
                  />
                </Label>
              </div>
            )}

            <Label className="block space-y-2">
              <span className="px-1 text-sm font-bold text-foreground">Mô tả</span>
              <Textarea
                value={form.description}
                onChange={event => updateForm('description', event.target.value)}
                rows={4}
                className="w-full resize-none rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm font-medium text-foreground outline-none transition-all focus:border-primary-brand focus:bg-card focus:ring-4 focus:ring-primary-brand/10"
                placeholder="Mô tả ngắn về yêu cầu bài thi"
              />
            </Label>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
          <div className="h-2 bg-primary-brand" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Monitor size={20} className="text-violet-500" />
              Hình thức thi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={() => updateForm('exam_mode', 'offline')}
                data-selected={form.exam_mode === 'offline'}
                className="flex items-center gap-3 rounded-2xl border-2 border-border bg-muted/50 p-4 text-left data-[selected=true]:border-primary data-[selected=true]:text-primary"
              >
                <div
                  data-selected={form.exam_mode === 'offline'}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground data-[selected=true]:border data-[selected=true]:border-primary data-[selected=true]:text-primary"
                >
                  <WifiOff size={18} />
                </div>
                <div>
                  <div className="text-sm font-black text-foreground">Ngoại tuyến</div>
                  <div className="text-[11px] font-bold text-muted-foreground">Học sinh nộp bài thông thường</div>
                </div>
                {form.exam_mode === 'offline' && <Check size={16} className="ml-auto text-primary-brand" />}
              </Button>

              <Button
                type="button"
                onClick={() => {
                  updateForm('exam_mode', 'online');
                  updateForm('exam_type', 'quiz');
                  updateForm('content_type', 'quiz');
                }}
                data-selected={form.exam_mode === 'online'}
                className="flex items-center gap-3 rounded-2xl border-2 border-border bg-muted/50 p-4 text-left data-[selected=true]:border-violet-500 data-[selected=true]:text-violet-500"
              >
                <div
                  data-selected={form.exam_mode === 'online'}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground data-[selected=true]:border data-[selected=true]:border-violet-500 data-[selected=true]:text-violet-500"
                >
                  <Wifi size={18} />
                </div>
                <div>
                  <div className="text-sm font-black text-foreground">Trực tuyến</div>
                  <div className="text-[11px] font-bold text-muted-foreground">Thi trắc nghiệm, có camera & đếm giờ</div>
                </div>
                {form.exam_mode === 'online' && <Check size={16} className="ml-auto text-violet-500" />}
              </Button>
            </div>

            {form.exam_mode === 'online' && (
              <div className="space-y-4 rounded-2xl border border-violet-100 bg-primary-brand-light/50 p-4">
                <Label className="block space-y-2">
                  <span className="flex items-center gap-1.5 px-1 text-sm font-bold text-foreground">
                    <Timer size={15} className="text-violet-500" />
                    Thời gian làm bài (giây)
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={form.duration_seconds}
                    onChange={event => updateForm('duration_seconds', parseInt(event.target.value) || 0)}
                    className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground outline-none transition-all focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                  />
                </Label>

                <div className="flex items-center justify-between px-1">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Camera size={15} className="text-violet-500" />
                      Yêu cầu Camera
                    </div>
                    <div className="text-[11px] font-medium text-muted-foreground">Giám sát học sinh qua camera trong suốt quá trình thi</div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => updateForm('camera_required', !form.camera_required)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${form.camera_required ? 'bg-primary-brand' : 'bg-muted'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out ${form.camera_required ? 'translate-x-5' : 'translate-x-0'}`} />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
          <div className="h-2 bg-primary-brand" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Calendar size={20} className="text-primary-brand" />
              Thời hạn & Trạng thái
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Label className="space-y-2">
                <span className="px-1 text-sm font-bold text-foreground">Hạn nộp <span className="text-destructive">*</span></span>
                <Input
                  type="datetime-local"
                  value={form.due_date}
                  onChange={event => updateForm('due_date', event.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm font-medium text-foreground outline-none transition-all focus:border-primary-brand focus:bg-card focus:ring-4 focus:ring-primary-brand/10"
                />
              </Label>

              <Label className="space-y-2">
                <span className="px-1 text-sm font-bold text-foreground">Trạng thái</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3 text-left text-sm font-medium text-foreground outline-none transition-all hover:bg-card focus:border-primary-brand focus:bg-card focus:ring-4 focus:ring-primary-brand/10"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <SelectedStatusIcon size={17} className={`shrink-0 ${selectedStatus.iconClassName}`} />
                        <span className="truncate">{selectedStatus.label}</span>
                      </span>
                      <ChevronDown size={16} className="shrink-0 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={6} className="rounded-xl border border-border bg-card p-1.5 shadow-lg">
                    {STATUS_OPTIONS.map(status => {
                      const Icon = status.icon;
                      const active = form.status === status.value;

                      return (
                        <DropdownMenuItem
                          key={status.value}
                          onClick={() => updateForm('status', status.value as ExamStatus)}
                          className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${active ? status.activeClassName : 'text-muted-foreground hover:bg-muted/50 focus:bg-muted/50'}`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon size={16} className={active ? status.iconClassName : 'text-muted-foreground'} />
                            {status.label}
                          </span>
                          {active && <Check size={15} className={status.iconClassName} />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </Label>

              <Label className="space-y-2">
                <span className="px-1 text-sm font-bold text-foreground">Loại nội dung</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={form.exam_type === 'quiz'}>
                    <Button
                      type="button"
                      disabled={form.exam_type === 'quiz'}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3 text-left text-sm font-medium text-foreground outline-none transition-all hover:bg-card focus:border-primary-brand focus:bg-card focus:ring-4 focus:ring-primary-brand/10 disabled:opacity-70"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <SelectedContentTypeIcon size={17} className="shrink-0 text-primary-brand" />
                        <span className="truncate">{selectedContentType.label}</span>
                      </span>
                      <ChevronDown size={16} className="shrink-0 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" sideOffset={6} className="rounded-xl border border-border bg-card p-1.5 shadow-lg">
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
                          className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-muted-foreground data-[active=true]:text-foreground data-[active=true]:font-semibold ${option.value === 'quiz' ? 'opacity-50' : ''}`}
                          data-active={active}
                        >
                          <span className="flex items-center gap-2">
                            <Icon size={16} className={active ? 'text-primary-brand' : 'text-muted-foreground'} />
                            {option.label}
                          </span>
                          {active && <Check size={15} className="text-primary-brand" />}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </Label>
            </div>

            <Label className="block space-y-2">
              <span className="px-1 text-sm font-bold text-foreground">Hướng dẫn làm bài <span className="text-destructive">*</span></span>
              <Textarea
                value={form.body}
                onChange={event => updateForm('body', event.target.value)}
                rows={needsResource ? 2 : 6}
                disabled={needsResource || form.exam_type === 'quiz'}
                className="w-full resize-none rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm font-medium text-foreground outline-none transition-all focus:border-primary-brand focus:bg-card focus:ring-4 focus:ring-primary-brand/10 disabled:opacity-70"
                placeholder={form.exam_type === 'quiz' ? 'Nội dung sẽ được lấy từ bộ đề trắc nghiệm' : needsResource ? 'File mới sẽ được upload khi lưu' : 'Nhập hướng dẫn làm bài cho học sinh'}
              />
            </Label>

            {needsResource && (
              <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-foreground">
                    {selectedFile?.name || exam?.meta?.name || 'Chưa chọn tệp nào'}
                  </div>
                  <div className="text-[11px] font-bold uppercase text-muted-foreground">
                    {selectedFile ? 'Sẽ upload khi lưu' : exam?.meta?.url ? 'Đang dùng tài nguyên hiện tại' : 'Yêu cầu tệp đính kèm'}
                  </div>
                </div>
                <Input
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
            className="rounded-xl px-6 text-xs font-bold text-muted-foreground"
          >
            HỦY
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="h-12 min-w-[180px] rounded-xl bg-primary-brand px-6 text-xs font-bold text-white shadow-lg shadow-primary-brand/20 hover:bg-primary-brand-dark"
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
  if (normalized.includes('cuoi ki')) return 'final';
  if (normalized.includes('thuong xuyen')) return 'regular';
  return 'midterm';
}

function stripExamKindPrefix(title: string) {
  return title.replace(/^(Kiểm tra giữa kì|Kiểm Tra Cuối Kì|Kiểm Tra Thường Xuyên)\s*-\s*/i, '').trim();
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
