'use client';

import { ChangeEvent, use, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Check, ChevronDown, CircleDashed, Eye, File, FileImage, FileText, Loader2, Save, Send, UploadCloud } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { ClassroomProps, Exam, ExamStatus, spaceApi } from '@/lib/api';

interface EditAssignmentPageProps {
  params: Promise<{ uid: string; assignmentUid: string }>;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Bản nháp', icon: CircleDashed, activeClassName: 'bg-amber-50 text-amber-700', iconClassName: 'text-amber-500' },
  { value: 'published', label: 'Công bố', icon: Send, activeClassName: 'bg-emerald-50 text-emerald-700', iconClassName: 'text-emerald-500' },
] as const;

const CONTENT_TYPE_OPTIONS = [
  { value: 'markdown', label: 'Văn bản hướng dẫn', icon: FileText },
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'image', label: 'Hình ảnh', icon: FileImage },
  { value: 'file', label: 'File', icon: File },
] as const;

const assignmentSchema = z
  .object({
    title: z.string().min(1, 'Vui lòng nhập tiêu đề'),
    description: z.string(),
    content_type: z.enum(['markdown', 'pdf', 'image', 'file']),
    body: z.string(),
    due_date: z.string().min(1, 'Vui lòng chọn hạn nộp'),
    status: z.enum(['draft', 'published']),
  })
  .superRefine((data, ctx) => {
    if (data.content_type === 'markdown' && !data.body.trim()) {
      ctx.addIssue({ code: 'custom', path: ['body'], message: 'Vui lòng nhập hướng dẫn làm bài' });
    }
  });

type AssignmentForm = z.infer<typeof assignmentSchema>;

export default function EditAssignmentPage({ params }: EditAssignmentPageProps) {
  const { uid, assignmentUid } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [classroom, setClassroom] = useState<ClassroomProps | null>(null);
  const [assignment, setAssignment] = useState<Exam | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const form = useForm<AssignmentForm>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      content_type: 'markdown',
      body: '',
      due_date: '',
      status: 'published',
    },
  });

  const contentType = form.watch('content_type');
  const needsResource = ['file', 'pdf', 'image'].includes(contentType);

  const objectUrl = useMemo(() => (selectedFile ? URL.createObjectURL(selectedFile) : null), [selectedFile]);
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const previewUrl = objectUrl || assignment?.meta?.url || null;
  const previewName = selectedFile?.name || assignment?.meta?.name || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetching(true);
        const [classroomDetails, assignmentDetails] = await Promise.all([
          spaceApi.classrooms.getClassroom(uid),
          spaceApi.assignments.retrieve(assignmentUid),
        ]);
        setClassroom(classroomDetails);
        setAssignment(assignmentDetails);
        form.reset({
          title: assignmentDetails.title,
          description: assignmentDetails.description || '',
          content_type: assignmentDetails.content_type === 'quiz' ? 'markdown' : assignmentDetails.content_type,
          body: assignmentDetails.body || '',
          due_date: toDatetimeLocalValue(assignmentDetails.due_date),
          status: assignmentDetails.status === 'closed' || assignmentDetails.status === 'ongoing' ? 'published' : assignmentDetails.status,
        });
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Không thể tải bài tập');
      } finally {
        setFetching(false);
      }
    };
    void fetchData();
  }, [uid, assignmentUid, form]);

  const handleResourceSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    setSelectedFile(file);
  };

  const onSubmit = async (data: AssignmentForm) => {
    setSaving(true);
    try {
      if (needsResource && !selectedFile && !assignment?.ref_id) {
        toast.error('Vui lòng chọn tệp đính kèm');
        setSaving(false);
        return;
      }

      const formData = new FormData();
      formData.append('classroom_id', uid);
      formData.append('title', data.title.trim());
      formData.append('description', data.description.trim());
      formData.append('content_type', data.content_type);
      formData.append('body', needsResource ? '' : data.body.trim());
      formData.append('due_date', new Date(data.due_date).toISOString());
      formData.append('status', data.status);
      if (needsResource) {
        if (selectedFile) {
          formData.append('file', selectedFile);
        } else if (assignment?.ref_id) {
          formData.append('ref_id', assignment.ref_id);
        }
      }

      await spaceApi.assignments.update(assignmentUid, formData);

      toast.success('Đã cập nhật bài tập');
      router.push(`/space/classrooms/${uid}/details?tab=assignments`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật bài tập');
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <Loader2 className="mb-4 size-10 animate-spin" />
        <p className="text-sm font-medium">Đang tải dữ liệu bài tập...</p>
      </div>
    );
  }

  const selectedStatus = STATUS_OPTIONS.find((option) => option.value === form.watch('status')) || STATUS_OPTIONS[0];
  const SelectedStatusIcon = selectedStatus.icon;
  const selectedContentType = CONTENT_TYPE_OPTIONS.find((option) => option.value === contentType) || CONTENT_TYPE_OPTIONS[0];
  const SelectedContentTypeIcon = selectedContentType.icon;

  return (
    <div className="mx-auto max-w-4xl py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => router.push(`/space/classrooms/${uid}/details?tab=assignments`)}
          className="rounded-xl"
        >
          <ArrowLeft className="size-4 text-muted-foreground" />
        </Button>
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <FileText className="size-3.5" />
            {classroom?.name || 'Lớp học'}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Chỉnh sửa bài tập</h1>
          <p className="text-sm text-muted-foreground">Cập nhật nội dung và thời hạn bài tập</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-semibold">
                <FileText className="size-5 text-primary" />
                Thông tin bài tập
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tiêu đề <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input className="h-12 rounded-xl" placeholder="Ví dụ: Bài tập chương 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        placeholder="Mô tả ngắn về yêu cầu bài tập"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-semibold">
                <Calendar className="size-5 text-primary" />
                Nội dung, thời hạn & Trạng thái
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
                                  setSelectedFile(null);
                                  field.onChange(option.value);
                                }}
                                className={`flex items-center justify-between gap-3 px-3 py-2.5 font-medium ${active ? 'bg-primary/10 text-primary focus:bg-primary/10 focus:text-primary' : ''}`}
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
                        disabled={needsResource}
                        className="resize-none rounded-xl"
                        placeholder={needsResource ? 'File đính kèm sẽ được upload khi lưu' : 'Nhập hướng dẫn làm bài cho học sinh'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {needsResource && (
                <div className="flex flex-col gap-3 rounded-xl border border-dashed bg-muted/30 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      {contentType === 'image' && previewUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewOpen(true)}
                          className="group relative size-12 shrink-0 overflow-hidden rounded-lg border border-border"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={previewUrl} alt={previewName} className="size-full object-cover" />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                            <Eye className="size-4" />
                          </span>
                        </button>
                      ) : (
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          {contentType === 'pdf' ? <FileText className="size-5" /> : <File className="size-5" />}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">
                          {previewName || 'Chưa chọn tệp nào'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {selectedFile ? 'Sẽ upload khi lưu' : assignment?.ref_id ? 'Đang dùng tệp hiện tại' : 'Yêu cầu tệp đính kèm'}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {previewUrl && (
                        <Button type="button" variant="ghost" onClick={() => setPreviewOpen(true)}>
                          <Eye className="size-4" />
                          Xem trước
                        </Button>
                      )}
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
                  </div>

                  {contentType === 'pdf' && previewUrl && (
                    <iframe src={previewUrl} title={previewName} className="h-64 w-full rounded-lg border border-border bg-background" />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push(`/space/classrooms/${uid}/details?tab=assignments`)}
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
              LƯU THAY ĐỔI
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="w-[90vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="truncate">{previewName || 'Xem trước tệp đính kèm'}</DialogTitle>
          </DialogHeader>
          {previewUrl && contentType === 'image' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={previewName} className="max-h-[75vh] w-full rounded-lg object-contain" />
          )}
          {previewUrl && contentType === 'pdf' && (
            <iframe src={previewUrl} title={previewName} className="h-[75vh] w-full rounded-lg border border-border" />
          )}
          {previewUrl && contentType === 'file' && (
            <div className="flex flex-col items-center gap-4 py-10 text-center text-muted-foreground">
              <File className="size-10" />
              <p className="text-sm font-medium">Không thể xem trước loại tệp này trong trình duyệt</p>
              <Button asChild variant="outline">
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  Mở tệp trong tab mới
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PickerDropdown({
  value,
  icon,
  label,
  children,
}: {
  value: string;
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full justify-between gap-3 rounded-xl px-4"
        >
          <span className="flex min-w-0 items-center gap-2">
            {icon}
            <span className="truncate">{label}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className={value === 'ref_id' ? 'max-h-[300px] overflow-y-auto' : ''}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function toDatetimeLocalValue(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}
