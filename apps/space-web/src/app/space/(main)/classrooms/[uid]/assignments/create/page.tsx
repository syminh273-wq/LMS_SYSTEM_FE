'use client';

import { ChangeEvent, use, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Check, ChevronDown, CircleDashed, File, FileImage, FileText, Loader2, Save, Send, UploadCloud } from 'lucide-react';
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
import { Classroom, ExamStatus, spaceApi } from '@/lib/api';

interface CreateAssignmentPageProps {
  params: Promise<{ uid: string }>;
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

export default function CreateAssignmentPage({ params }: CreateAssignmentPageProps) {
  const { uid } = use(params);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetching(true);
        const details = await spaceApi.classrooms.retrieve(uid);
        setClassroom(details);
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

  const onSubmit = async (data: AssignmentForm) => {
    setSaving(true);
    try {
      if (needsResource && !fileRef.current) {
        toast.error('Vui lòng chọn tệp đính kèm');
        setSaving(false);
        return;
      }

      const uploadedResource = needsResource && fileRef.current
        ? await uploadAssignmentResource(fileRef.current, uid)
        : null;

      await spaceApi.assignments.create({
        classroom_id: uid,
        title: data.title.trim(),
        description: data.description.trim(),
        content_type: data.content_type,
        ref_id: uploadedResource?.uid ?? null,
        body: needsResource ? '' : data.body.trim(),
        due_date: new Date(data.due_date).toISOString(),
        status: data.status,
      });

      toast.success('Đã tạo bài tập');
      router.push(`/space/classrooms/${uid}/details?tab=assignments`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể tạo bài tập');
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
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Tạo bài tập mới</h1>
          <p className="text-sm text-muted-foreground">Giao bài tập để học sinh nộp file hoặc viết bài</p>
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
                                  fileRef.current = null;
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
              TẠO BÀI TẬP
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

async function uploadAssignmentResource(file: File, classroomUid: string) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify({ context: 'classroom_assignment', classroom_uid: classroomUid }));
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
