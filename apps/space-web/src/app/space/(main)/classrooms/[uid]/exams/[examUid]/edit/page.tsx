'use client';

import { ChangeEvent, use, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Camera, Check, ChevronDown, CircleDashed, ClipboardList, File, FileImage, FileText, Loader2, LockKeyhole, Monitor, Save, Send, Timer, UploadCloud, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Switch } from '@shared/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/components/ui/form';
import { Textarea } from '@shared/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@shared/components/ui/dropdown-menu';
import { ClassroomProps, Exam, ExamContentType, ExamStatus, quizApi, Quiz, spaceApi } from '@/lib/api';

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

const examSchema = z
  .object({
    exam_kind: z.enum(['midterm', 'final', 'regular']),
    exam_type: z.enum(['assignment', 'quiz']),
    ref_id: z.string(),
    max_grade: z.number().nonnegative(),
    title: z.string().min(1, 'Vui lòng nhập tiêu đề bài kiểm tra'),
    description: z.string(),
    content_type: z.enum(['markdown', 'pdf', 'image', 'file', 'quiz']),
    body: z.string(),
    due_date: z.string(),
    status: z.enum(['draft', 'published', 'closed', 'ongoing']),
    exam_mode: z.enum(['online', 'offline']),
    duration_seconds: z.number().nonnegative(),
    camera_required: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.exam_mode !== 'online' && !data.due_date) {
      ctx.addIssue({ code: 'custom', path: ['due_date'], message: 'Vui lòng chọn hạn nộp' });
    }
    if (data.exam_type === 'quiz' && !data.ref_id) {
      ctx.addIssue({ code: 'custom', path: ['ref_id'], message: 'Vui lòng chọn bộ đề trắc nghiệm' });
    }
    if (data.exam_type === 'assignment' && data.content_type === 'markdown' && !data.body.trim()) {
      ctx.addIssue({ code: 'custom', path: ['body'], message: 'Vui lòng nhập nội dung hướng dẫn' });
    }
  });

type ExamForm = z.infer<typeof examSchema>;

export default function EditExamPage({ params }: EditExamPageProps) {
  const { uid, examUid } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);
  const [classroom, setClassroom] = useState<ClassroomProps | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<ExamForm>({
    resolver: zodResolver(examSchema),
    defaultValues: {
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
    },
  });

  const examMode = form.watch('exam_mode');
  const examType = form.watch('exam_type');
  const contentType = form.watch('content_type');

  useEffect(() => {
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
          spaceApi.classrooms.getClassroom(uid),
          spaceApi.exams.retrieve(examUid),
          quizApi.list(uid),
        ]);
        setClassroom(classroomDetails);
        setExam(examDetails);
        setQuizzes(quizList);
        form.reset({
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
  }, [router, uid, examUid, form]);

  const handleResourceSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    fileRef.current = file;
  };

  const onSubmit = async (data: ExamForm) => {
    setSaving(true);
    try {
      const needsResource = data.exam_type === 'assignment' && ['file', 'pdf', 'image'].includes(data.content_type);
      if (needsResource && !fileRef.current && !exam?.ref_id) {
        toast.error('Vui lòng chọn tệp đính kèm');
        setSaving(false);
        return;
      }

      const uploadedResource = needsResource && fileRef.current
        ? await uploadExamResource(fileRef.current, uid)
        : null;

      const kindLabel = getExamKindLabel(data.exam_kind);
      const normalizedTitle = normalizeText(data.title);
      const title = !normalizedTitle.includes(normalizeText(kindLabel))
        ? `${kindLabel} - ${data.title.trim()}`
        : data.title.trim();

      await spaceApi.exams.update(examUid, {
        classroom_id: uid,
        title,
        description: data.description.trim(),
        exam_type: data.exam_type,
        exam_period: data.exam_kind,
        ref_id: data.exam_type === 'quiz' ? data.ref_id : (uploadedResource?.uid ?? exam?.ref_id ?? null),
        max_grade: data.exam_type === 'quiz' ? data.max_grade : 10,
        content_type: data.exam_type === 'quiz' ? 'quiz' : data.content_type,
        body: data.exam_type === 'quiz' ? '' : (needsResource ? '' : data.body.trim()),
        due_date: data.due_date ? new Date(data.due_date).toISOString() : '',
        status: data.status,
        exam_mode: data.exam_mode,
        duration_seconds: data.exam_mode === 'online' ? data.duration_seconds : 0,
        camera_required: data.exam_mode === 'online' ? data.camera_required : false,
      });

      toast.success('Đã cập nhật bài kiểm tra');
      router.push(`/space/classrooms/${uid}/details?tab=exams&kind=${data.exam_kind}`);
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

  const needsResource = examType === 'assignment' && ['file', 'pdf', 'image'].includes(contentType);
  const selectedExamType = EXAM_TYPE_OPTIONS.find((o) => o.value === examType) || EXAM_TYPE_OPTIONS[0];
  const SelectedExamTypeIcon = selectedExamType.icon;
  const selectedExamKind = EXAM_KIND_OPTIONS.find((o) => o.key === form.watch('exam_kind')) || EXAM_KIND_OPTIONS[0];
  const SelectedExamKindIcon = selectedExamKind.icon;
  const selectedStatus = STATUS_OPTIONS.find((o) => o.value === form.watch('status')) || STATUS_OPTIONS[0];
  const SelectedStatusIcon = selectedStatus.icon;
  const selectedContentType = CONTENT_TYPE_OPTIONS.find((o) => o.value === (examType === 'quiz' ? 'quiz' : contentType)) || CONTENT_TYPE_OPTIONS[0];
  const SelectedContentTypeIcon = selectedContentType.icon;
  const selectedQuiz = quizzes.find((q) => q.uid === form.watch('ref_id'));

  return (
    <div className="mx-auto max-w-4xl py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.push(`/space/classrooms/${uid}/details?tab=exams&kind=${form.watch('exam_kind')}`)}
        >
          <ArrowLeft size={18} className="text-muted-foreground" />
        </Button>
        <div>
          <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-primary">
            <ClipboardList size={14} />
            {classroom?.name || 'Lớp học'}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Chỉnh sửa bài kiểm tra</h1>
          <p className="text-sm font-medium text-muted-foreground">Cập nhật nội dung và thiết lập bài kiểm tra</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
            <div className="h-2 bg-primary" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <FileText size={20} className="text-primary" />
                Thông tin bài kiểm tra
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="exam_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hình thức bài thi</FormLabel>
                      <FormControl>
                        <PickerDropdown
                          disabled={examMode === 'online'}
                          value={field.value}
                          icon={<SelectedExamTypeIcon size={17} className="shrink-0 text-primary" />}
                          label={selectedExamType.label}
                        >
                          {EXAM_TYPE_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            const active = field.value === option.value;
                            return (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() => {
                                  field.onChange(option.value as 'assignment' | 'quiz');
                                  if (option.value === 'quiz') form.setValue('content_type', 'quiz');
                                  else form.setValue('content_type', 'markdown');
                                }}
                                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-muted-foreground data-[active=true]:text-foreground data-[active=true]:font-semibold"
                                data-active={active}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <Icon size={16} className="text-muted-foreground data-[active=true]:text-foreground" data-active={active} />
                                  <span className="truncate">{option.label}</span>
                                </span>
                                {active && <Check size={15} className="text-primary" />}
                              </DropdownMenuItem>
                            );
                          })}
                        </PickerDropdown>
                      </FormControl>
                      {examMode === 'online' && (
                        <p className="px-1 text-[10px] font-bold text-primary italic">* Chế độ trực tuyến bắt buộc thi trắc nghiệm</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="exam_kind"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phân loại</FormLabel>
                      <FormControl>
                        <PickerDropdown
                          value={field.value}
                          icon={<SelectedExamKindIcon size={17} className="shrink-0 text-primary" />}
                          label={selectedExamKind.label}
                        >
                          {EXAM_KIND_OPTIONS.map((kind) => {
                            const Icon = kind.icon;
                            const active = field.value === kind.key;
                            return (
                              <DropdownMenuItem
                                key={kind.key}
                                onClick={() => field.onChange(kind.key)}
                                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-muted-foreground data-[active=true]:text-foreground data-[active=true]:font-semibold"
                                data-active={active}
                              >
                                <span className="flex min-w-0 items-center gap-2">
                                  <Icon size={16} className="text-muted-foreground data-[active=true]:text-foreground" data-active={active} />
                                  <span className="truncate">{kind.label}</span>
                                </span>
                                {active && <Check size={15} className="text-primary" />}
                              </DropdownMenuItem>
                            );
                          })}
                        </PickerDropdown>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tiêu đề <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: Kiểm tra giữa kỳ - Chương 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {examType === 'quiz' && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="ref_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Bộ đề trắc nghiệm <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <PickerDropdown
                            value={field.value}
                            icon={<ClipboardList size={17} className="shrink-0 text-primary" />}
                            label={selectedQuiz?.title || 'Chọn bộ đề trắc nghiệm'}
                            contentClassName="max-h-[300px] overflow-y-auto"
                          >
                            {quizzes.length === 0 ? (
                              <div className="px-3 py-2 text-xs text-muted-foreground">Không có bộ đề nào khả dụng</div>
                            ) : (
                              quizzes.map((quiz) => {
                                const active = field.value === quiz.uid;
                                return (
                                  <DropdownMenuItem
                                    key={quiz.uid}
                                    onClick={() => field.onChange(quiz.uid)}
                                    className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-muted-foreground data-[active=true]:text-foreground data-[active=true]:font-semibold"
                                    data-active={active}
                                  >
                                    <span className="flex min-w-0 flex-col">
                                      <span className="truncate">{quiz.title}</span>
                                      <span className="text-[10px] text-muted-foreground font-medium">{quiz.questions_count} câu hỏi</span>
                                    </span>
                                    {active && <Check size={15} className="text-primary" />}
                                  </DropdownMenuItem>
                                );
                              })
                            )}
                          </PickerDropdown>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thang điểm tối đa</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={0.5}
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        className="resize-none"
                        placeholder="Mô tả ngắn về yêu cầu bài thi"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
            <div className="h-2 bg-primary" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Monitor size={20} className="text-violet-500" />
                Hình thức thi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField
                control={form.control}
                name="exam_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <ModeOption
                          value="offline"
                          active={field.value === 'offline'}
                          onSelect={(v) => field.onChange(v)}
                          icon={WifiOff}
                          title="Ngoại tuyến"
                          desc="Học sinh nộp bài thông thường"
                        />
                        <ModeOption
                          value="online"
                          active={field.value === 'online'}
                          onSelect={(v) => {
                            field.onChange(v);
                            if (v === 'online') {
                              form.setValue('exam_type', 'quiz');
                              form.setValue('content_type', 'quiz');
                            }
                          }}
                          icon={Wifi}
                          title="Trực tuyến"
                          desc="Thi trắc nghiệm, có camera & đếm giờ"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {examMode === 'online' && (
                <div className="space-y-4 rounded-2xl border border-violet-100 bg-primary/5 p-4">
                  <FormField
                    control={form.control}
                    name="duration_seconds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <span className="flex items-center gap-1.5">
                            <Timer size={15} className="text-violet-500" />
                            Thời gian làm bài (giây)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="camera_required"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between px-1">
                          <div className="space-y-0.5">
                            <FormLabel className="flex items-center gap-2">
                              <Camera size={15} className="text-violet-500" />
                              Yêu cầu Camera
                            </FormLabel>
                            <p className="text-[11px] font-medium text-muted-foreground">Giám sát học sinh qua camera trong suốt quá trình thi</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
            <div className="h-2 bg-primary" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Calendar size={20} className="text-primary" />
                Thời hạn & Trạng thái
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Hạn nộp <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trạng thái</FormLabel>
                      <FormControl>
                        <PickerDropdown
                          value={field.value}
                          icon={<SelectedStatusIcon size={17} className={`shrink-0 ${selectedStatus.iconClassName}`} />}
                          label={selectedStatus.label}
                        >
                          {STATUS_OPTIONS.map((status) => {
                            const Icon = status.icon;
                            const active = field.value === status.value;
                            return (
                              <DropdownMenuItem
                                key={status.value}
                                onClick={() => field.onChange(status.value as ExamStatus)}
                                className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-bold ${active ? status.activeClassName : 'text-muted-foreground'}`}
                              >
                                <span className="flex items-center gap-2">
                                  <Icon size={16} className={active ? status.iconClassName : 'text-muted-foreground'} />
                                  {status.label}
                                </span>
                                {active && <Check size={15} className={status.iconClassName} />}
                              </DropdownMenuItem>
                            );
                          })}
                        </PickerDropdown>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại nội dung</FormLabel>
                      <FormControl>
                        <PickerDropdown
                          disabled={examType === 'quiz'}
                          value={field.value}
                          icon={<SelectedContentTypeIcon size={17} className="shrink-0 text-primary" />}
                          label={selectedContentType.label}
                        >
                          {CONTENT_TYPE_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            const active = field.value === option.value;
                            return (
                              <DropdownMenuItem
                                key={option.value}
                                onClick={() => {
                                  fileRef.current = null;
                                  field.onChange(option.value as ExamContentType);
                                }}
                                disabled={option.value === 'quiz'}
                                className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-muted-foreground data-[active=true]:text-foreground data-[active=true]:font-semibold ${option.value === 'quiz' ? 'opacity-50' : ''}`}
                                data-active={active}
                              >
                                <span className="flex items-center gap-2">
                                  <Icon size={16} className={active ? 'text-primary' : 'text-muted-foreground'} />
                                  {option.label}
                                </span>
                                {active && <Check size={15} className="text-primary" />}
                              </DropdownMenuItem>
                            );
                          })}
                        </PickerDropdown>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Hướng dẫn làm bài <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={needsResource ? 2 : 6}
                        disabled={needsResource || examType === 'quiz'}
                        className="resize-none"
                        placeholder={examType === 'quiz' ? 'Nội dung sẽ được lấy từ bộ đề trắc nghiệm' : needsResource ? 'File mới sẽ được upload khi lưu' : 'Nhập hướng dẫn làm bài cho học sinh'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {needsResource && (
                <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-foreground">
                      {fileRef.current?.name || exam?.meta?.name || 'Chưa chọn tệp nào'}
                    </div>
                    <div className="text-[11px] font-bold uppercase text-muted-foreground">
                      {fileRef.current ? 'Sẽ upload khi lưu' : exam?.meta?.url ? 'Đang dùng tài nguyên hiện tại' : 'Yêu cầu tệp đính kèm'}
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
              onClick={() => router.push(`/space/classrooms/${uid}/details?tab=exams&kind=${form.watch('exam_kind')}`)}
              disabled={saving}
              className="rounded-xl px-6 text-xs font-bold text-muted-foreground"
            >
              HỦY
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="h-12 min-w-[180px] rounded-xl px-6"
            >
              {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
              LƯU THAY ĐỔI
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function PickerDropdown({
  value,
  icon,
  label,
  disabled,
  contentClassName,
  children,
}: {
  value: string;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="h-12 w-full justify-between gap-3 rounded-xl px-4"
        >
          <span className="flex min-w-0 items-center gap-2">
            {icon}
            <span className="truncate">{label}</span>
          </span>
          {!disabled && <ChevronDown className="size-4 shrink-0 text-muted-foreground" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className={contentClassName}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ModeOption({
  value,
  active,
  onSelect,
  icon: Icon,
  title,
  desc,
}: {
  value: 'online' | 'offline';
  active: boolean;
  onSelect: (v: 'online' | 'offline') => void;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => onSelect(value)}
      className={`flex items-center gap-3 rounded-2xl border-2 p-4 h-auto text-left ${active ? (value === 'online' ? 'border-violet-500 bg-violet-500/10' : 'border-primary bg-primary/10') : 'border-border bg-muted/30 hover:bg-muted/50'}`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? (value === 'online' ? 'bg-violet-500 text-white' : 'bg-primary text-primary-foreground') : 'bg-muted text-muted-foreground'}`}>
        <Icon size={18} />
      </div>
      <div>
        <div className="text-sm font-black text-foreground">{title}</div>
        <div className="text-[11px] font-bold text-muted-foreground">{desc}</div>
      </div>
      {active && <Check size={16} className={`ml-auto ${value === 'online' ? 'text-violet-500' : 'text-primary'}`} />}
    </Button>
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
  return EXAM_KIND_OPTIONS.find((option) => option.key === kind)?.label || EXAM_KIND_OPTIONS[0].label;
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
