'use client';

import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { spaceApi, UpdateClassroomRequest, ValidationException, ClassroomProps, ClassroomJoinLink } from '@/lib/api';
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  Users,
  Info,
  Save,
  QrCode,
  Download,
  Tag,
  Wallet,
  Globe,
  Lock,
  Sparkles,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@shared/components/ui/radio-group';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { renderToStaticMarkup } from 'react-dom/server';

const CATEGORIES: Array<{ value: NonNullable<UpdateClassroomRequest['category']>; label: string }> = [
  { value: 'math', label: 'Toán học' },
  { value: 'physics', label: 'Vật lý' },
  { value: 'chemistry', label: 'Hóa học' },
  { value: 'biology', label: 'Sinh học' },
  { value: 'language', label: 'Ngoại ngữ' },
  { value: 'programming', label: 'Lập trình' },
  { value: 'business', label: 'Kinh doanh' },
  { value: 'design', label: 'Thiết kế' },
  { value: 'music', label: 'Âm nhạc' },
  { value: 'other', label: 'Khác' },
];

const editSchema = z
  .object({
    name: z.string().min(1, 'Tên phòng học là bắt buộc'),
    description: z.string().min(1, 'Mô tả là bắt buộc'),
    max_students: z.number().min(1, 'Tối thiểu 1 học sinh'),
    pricing_type: z.enum(['free', 'paid']),
    price_vnd: z.number().nonnegative().optional(),
    category: z.enum([
      'math', 'physics', 'chemistry', 'biology', 'language',
      'programming', 'business', 'design', 'music', 'other',
    ]),
    visibility_type: z.enum(['public', 'private']),
  })
  .refine((d) => d.pricing_type === 'free' || (d.price_vnd !== undefined && d.price_vnd >= 1000), {
    message: 'Giá là bắt buộc khi trả phí',
    path: ['price_vnd'],
  });

type EditFormValues = z.infer<typeof editSchema>;

interface EditClassroomPageProps {
  params: Promise<{ uid: string }>;
}

export default function EditClassroomPage({ params }: EditClassroomPageProps) {
  const { uid } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [globalError, setGlobalError] = useState('');
  const [classroom, setClassroom] = useState<ClassroomProps | null>(null);
  const [linkData, setLinkData] = useState<ClassroomJoinLink | null>(null);

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: '',
      description: '',
      max_students: 30,
      pricing_type: 'free',
      price_vnd: 0,
      category: 'other',
      visibility_type: 'public',
    },
  });

  const pricingType = form.watch('pricing_type');
  const visibilityType = form.watch('visibility_type');

  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        setFetching(true);
        const data = await spaceApi.classrooms.getClassroom(uid);
        setClassroom(data);
        setLinkData(data.pid ? { code: data.pid } : null);
        form.reset({
          name: data.name,
          description: data.description,
          max_students: data.max_students,
          pricing_type: (data.pricing_type as any) || 'free',
          price_vnd: (data.price_vnd as any) || 0,
          category: (data.category as any) || 'other',
          visibility_type: (data.visibility_type as any) || 'public',
        });
      } catch (err: any) {
        setGlobalError(err.message || 'Không thể tải thông tin phòng học');
        toast.error('Không thể tải thông tin phòng học');
      } finally {
        setFetching(false);
      }
    };

    fetchClassroom();
  }, [uid, form]);

  const handleDownloadQr = () => {
    if (!linkData || !classroom) return;

    try {
      toast.info('Đang tạo ảnh QR...');
      const joinUrl = `${window.location.origin.replace('3003', '3000')}/join/${linkData.code}`;

      let svgString = renderToStaticMarkup(
        <QRCodeSVG value={joinUrl} size={400} level="H" includeMargin={true} />
      );

      if (!svgString.includes('xmlns=')) {
        svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = document.createElement('img');
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = 500;
        canvas.height = 500;
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 50, 50, 400, 400);

          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `QR_Lop_${classroom.name}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          toast.success('Đã tải mã QR xuống');
        }
        URL.revokeObjectURL(url);
      };

      img.onerror = () => {
        toast.error('Có lỗi xảy ra khi tạo ảnh QR');
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (err) {
      toast.error('Không thể tải mã QR');
    }
  };

  const onSubmit = async (data: EditFormValues) => {
    setLoading(true);
    setGlobalError('');
    try {
      const payload: UpdateClassroomRequest = {
        ...data,
        price_vnd: data.pricing_type === 'free' ? 0 : (data.price_vnd ?? 0),
      };
      await spaceApi.classrooms.updateClassroom(uid, payload);
      toast.success('Cập nhật phòng học thành công');
      router.push('/space/classrooms');
    } catch (err: any) {
      if (err instanceof ValidationException) {
        Object.entries(err.errors).forEach(([field, message]) => {
          form.setError(field as any, { type: 'server', message });
        });
      } else {
        setGlobalError(err.message || 'Đã có lỗi xảy ra khi cập nhật phòng học');
        toast.error(err.message || 'Cập nhật thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
        <Loader2 className="size-10 animate-spin mb-4" />
        <p className="text-sm font-medium">Đang tải thông tin phòng học...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/space/classrooms')}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Chỉnh sửa phòng học</h1>
          <p className="text-sm text-muted-foreground">Cập nhật thông tin cấu hình cho phòng học {classroom?.name}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-semibold">
                <Info className="size-5 text-primary" />
                Thông tin cấu hình
              </CardTitle>
              <CardDescription>Chỉnh sửa các thông tin cần thiết bên dưới</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {globalError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                  <div className="size-1.5 rounded-full bg-destructive shrink-0" />
                  {globalError}
                </div>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tên phòng học <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none size-4" />
                        <Input
                          className="pl-10"
                          placeholder="Ví dụ: Toán học nâng cao lớp 12A1"
                          {...field}
                        />
                      </div>
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
                    <FormLabel>
                      Mô tả khóa học <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        className="resize-none"
                        placeholder="Mô tả tóm tắt về mục tiêu, kiến thức sẽ đạt được trong khóa học này..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_students"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Giới hạn học sinh <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative max-w-[240px]">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none size-4" />
                        <Input
                          type="number"
                          className="pl-10"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </div>
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
                <Tag className="size-5 text-primary" />
                Hình thức lớp học
              </CardTitle>
              <CardDescription>Cập nhật miễn phí hoặc trả phí</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField
                control={form.control}
                name="pricing_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hình thức</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                      >
                        <PricingOption
                          value="free"
                          active={field.value === 'free'}
                          title="Miễn phí"
                          desc="Học sinh tham gia tự do, xem tất cả tài liệu."
                        />
                        <PricingOption
                          value="paid"
                          active={field.value === 'paid'}
                          title="Trả phí"
                          desc="Học sinh phải thanh toán MoMo trước khi vào."
                        />
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {pricingType === 'paid' && (
                <FormField
                  control={form.control}
                  name="price_vnd"
                  render={({ field }) => (
                    <FormItem className="animate-in fade-in slide-in-from-top-2">
                      <FormLabel>
                        <Wallet className="size-4 text-primary" />
                        Giá lớp học (VND) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1000}
                          step={1000}
                          placeholder="Ví dụ: 299000"
                          value={field.value ?? ''}
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
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-semibold">
                <Sparkles className="size-5 text-primary" />
                Phân loại & Hiển thị
              </CardTitle>
              <CardDescription>Cập nhật danh mục và chế độ hiển thị</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <Tag className="size-4 text-primary" />
                      Danh mục <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visibility_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chế độ hiển thị</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                      >
                        <PricingOption
                          value="public"
                          active={visibilityType === 'public'}
                          icon={<Globe className="size-4" />}
                          title="Công khai"
                          desc="Hiện trong trang Khám phá, học sinh tham gia trực tiếp."
                        />
                        <PricingOption
                          value="private"
                          active={visibilityType === 'private'}
                          icon={<Lock className="size-4" />}
                          title="Riêng tư"
                          desc="Chỉ tham gia qua mã mời. Không hiện trong Khám phá."
                        />
                      </RadioGroup>
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
                <QrCode className="size-5 text-primary" />
                Mã QR tham gia
              </CardTitle>
              <CardDescription>Học sinh có thể quét mã này để tham gia phòng học nhanh chóng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6 rounded-xl border bg-muted/30 p-4">
                <div className="rounded-lg border bg-card p-3 shadow-sm">
                  {linkData ? (
                    <QRCodeSVG
                      value={`${window.location.origin.replace('3003', '3000')}/join/${linkData.code}`}
                      size={140}
                      level="H"
                      includeMargin={false}
                    />
                  ) : (
                    <div className="flex h-[140px] w-[140px] items-center justify-center rounded-lg border border-dashed bg-muted/50">
                      <Loader2 className="size-6 animate-spin text-muted-foreground/60" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4 text-center sm:text-left w-full">
                  <div>
                    <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Mã tham gia</div>
                    <div className="text-2xl font-semibold uppercase tracking-wide text-foreground">
                      {linkData?.code || '------'}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadQr}
                    disabled={!linkData}
                  >
                    <Download className="size-4" />
                    Tải ảnh QR
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => router.push('/space/classrooms')}
              disabled={loading}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="min-w-[160px]"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function PricingOption({
  value,
  active,
  title,
  desc,
  icon,
}: {
  value: string;
  active: boolean;
  title: string;
  desc: string;
  icon?: React.ReactNode;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${
        active ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
      }`}
    >
      <RadioGroupItem value={value} className="mt-1" />
      <div>
        <div className="font-medium text-foreground flex items-center gap-1">
          {icon}
          {title}
        </div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </label>
  );
}
