'use client';

import { ChangeEvent, use, useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/components/ui/form';
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
    title: z.string().min(1, 'Vui lòng nhập tiêu đề'),
    description: z.string(),
    content_type: z.enum(['markdown', 'pdf', 'image', 'file', 'quiz']),
    body: z.string(),
    due_date: z.string(),
    status: z.enum(['draft', 'published', 'closed']),
    exam_mode: z.enum(['online', 'offline']),
    duration_seconds: z.number().nonnegative(),
    camera_required: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.exam_mode !== 'online' && !data.due_date) {
      ctx.addIssue({
        code: 'custom',
        path: ['due_date'],
        message: 'Vui lòng chọn hạn nộp',
      });
    }
    if (data.exam_type === 'quiz' && !data.ref_id) {
      ctx.addIssue({
        code: 'custom',
        path: ['ref_id'],
        message: 'Vui lòng chọn bộ đề trắc nghiệm',
      });
    }
    if (data.exam_type === 'assignment' && data.content_type === 'markdown' && !data.body.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['body'],
        message: 'Vui lòng nhập hướng dẫn làm bài',
      });
    }
  });

type ExamForm = z.infer<typeof examSchema>;

export default function CreateExamPage({ params }: CreateExamPageProps) {
  const { uid } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);
  const [classroom, setClassroom] = useState<Classroom | null>(null);
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
      status: 'published',
      exam_mode: 'offline',
      duration_seconds: 0,
      camera_required: false,
    },
  });

  const examMode = form.watch('exam_mode');
  const examType = form.watch('exam_type');
  const contentType = form.watch('content_type');

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
    if (kind && EXAM_KIND_OPTIONS.some((o) => o.key === kind)) {
      form.setValue('exam_kind', kind as ExamKind);
    }
  }, [router, uid, form]);

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
      if (needsResource && !fileRef.current) {
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

      await spaceApi.exams.create({
        classroom_id: uid,
        title,
        description: data.description.trim(),
        exam_type: data.exam_type,
        exam_period: data.exam_kind,
        ref_id: data.exam_type === 'quiz' ? data.ref_id : (uploadedResource?.uid ?? null),
        max_grade: data.exam_type === 'quiz' ? data.max_grade : 10,
        content_type: data.exam_type === 'quiz' ? 'quiz' : data.content_type,
        body: data.exam_type === 'quiz' ? '' : (needsResource ? '' : data.body.trim()),
        due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
        status: data.status,
        exam_mode: data.exam_mode,
        duration_seconds: data.exam_mode === 'online' ? data.duration_seconds : 0,
        camera_required: data.exam_mode === 'online' ? data.camera_required : false,
      });

      toast.success('Đã tạo bài kiểm tra');
      router.push(`/space/classrooms/${uid}/details?tab=exams&kind=${data.exam_kind}`);
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

  const needsResource = examType === 'assignment' && ['file', 'pdf', 'image'].includes(contentType);
  const selectedExamType = EXAM_TYPE_OPTIONS.find((option) => option.value === examType) || EXAM_TYPE_OPTIONS[0];
  const SelectedExamTypeIcon = selectedExamType.icon;
  const selectedExamKind = EXAM_KIND_OPTIONS.find((option) => option.key === form.watch('exam_kind')) || EXAM_KIND_OPTIONS[0];
  const SelectedExamKindIcon = selectedExamKind.icon;
  const selectedStatus = STATUS_OPTIONS.find((option) => option.value === form.watch('status')) || STATUS_OPTIONS[0];
  const SelectedStatusIcon = selectedStatus.icon;
  const selectedContentType = CONTENT_TYPE_OPTIONS.find((option) => option.value === (examType === 'quiz' ? 'quiz' : contentType)) || CONTENT_TYPE_OPTIONS[0];
  const SelectedContentTypeIcon = selectedContentType.icon;
  const selectedQuiz = quizzes.find((q) => q.uid === form.watch('ref_id'));

  return (
    <div className="mx-auto max-w-4xl py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => router.push(`/space/classrooms/${uid}/details?tab=exams&kind=${form.watch('exam_kind')}`)}
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-semibold">
                <Monitor className="size-5 text-primary" />
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
                          onSelect={(v) => {
                            field.onChange(v);
                          }}
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
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs font-medium leading-relaxed text-amber-700">
                    Thời gian làm bài, yêu cầu Camera và giới hạn vào trễ sẽ được thiết lập khi bạn bấm nút &quot;Mở ca thi&quot; tại danh sách bài kiểm tra.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-semibold">
                <FileText className="size-5 text-primary" />
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
                          value={selectedExamType.value}
                          icon={<SelectedExamTypeIcon className="size-4 shrink-0 text-primary" />}
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
                                  if (option.value === 'quiz') {
                                    form.setValue('content_type', 'quiz');
                                  } else {
                                    form.setValue('content_type', 'markdown');
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
                        </PickerDropdown>
                      </FormControl>
                      {examMode === 'online' && (
                        <p className="text-xs font-medium italic text-primary">* Chế độ trực tuyến bắt buộc thi trắc nghiệm</p>
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
                          icon={<SelectedExamKindIcon className="size-4 shrink-0 text-primary" />}
                          label={selectedExamKind.label}
                        >
                          {EXAM_KIND_OPTIONS.map((kind) => {
                            const Icon = kind.icon;
                            const active = field.value === kind.key;
                            return (
                              <DropdownMenuItem
                                key={kind.key}
                                onClick={() => field.onChange(kind.key)}
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
                      <Input className="h-12 rounded-xl" placeholder="Ví dụ: Kiểm tra giữa kỳ - Chương 1" {...field} />
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
                            icon={<ClipboardList className="size-4 shrink-0 text-primary" />}
                            label={selectedQuiz?.title || 'Chọn bộ đề trắc nghiệm'}
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
                                    className={`flex items-center justify-between gap-3 px-3 py-2.5 font-medium ${active ? 'bg-primary/10 text-primary focus:bg-primary/10 focus:text-primary' : ''}`}
                                  >
                                    <span className="flex min-w-0 flex-col">
                                      <span className="truncate">{quiz.title}</span>
                                      <span className="text-xs font-normal text-muted-foreground">{quiz.questions_count} câu hỏi</span>
                                    </span>
                                    {active && <Check className="size-4 text-primary" />}
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
                            className="h-12 rounded-xl"
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
                        className="resize-none rounded-xl"
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

          {examMode !== 'online' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-semibold">
                  <Calendar className="size-5 text-primary" />
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
                          <Input type="datetime-local" className="h-12 rounded-xl" {...field} />
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
                            icon={<SelectedStatusIcon className={`size-4 shrink-0 ${selectedStatus.iconClassName}`} />}
                            label={selectedStatus.label}
                          >
                            {STATUS_OPTIONS.map((status) => {
                              const Icon = status.icon;
                              const active = field.value === status.value;
                              return (
                                <DropdownMenuItem
                                  key={status.value}
                                  onClick={() => field.onChange(status.value as ExamStatus)}
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
                            icon={<SelectedContentTypeIcon className="size-4 shrink-0 text-primary" />}
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
                          className="resize-none rounded-xl"
                          placeholder={examType === 'quiz' ? 'Nội dung sẽ được lấy từ bộ đề trắc nghiệm' : needsResource ? 'File đính kèm sẽ được upload khi lưu' : 'Nhập hướng dẫn làm bài cho học sinh'}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {needsResource && (
                  <div className="flex flex-col gap-3 rounded-xl border border-dashed bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">
                        {fileRef.current?.name || 'Chưa chọn tệp nào'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {fileRef.current ? 'Sẽ upload khi lưu' : 'Yêu cầu tệp đính kèm'}
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
              onClick={() => router.push(`/space/classrooms/${uid}/details?tab=exams&kind=${form.watch('exam_kind')}`)}
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
      </Form>
    </div>
  );
}

function PickerDropdown({
  value,
  icon,
  label,
  disabled,
  children,
}: {
  value: string;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
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
      <DropdownMenuContent align="start" sideOffset={6} className={value === 'ref_id' ? 'max-h-[300px] overflow-y-auto' : ''}>
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
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => onSelect(value)}
      className={`flex items-center gap-3 rounded-xl border-2 p-4 h-auto text-left transition-all ${active ? 'border-primary bg-primary/10' : 'border-border bg-muted/30 hover:bg-muted/50'}`}
    >
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
        <Icon className="size-4" />
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      {active && <Check className="ml-auto size-4 text-primary" />}
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

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
