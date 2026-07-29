'use client';

import { useState, useEffect, use } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { spaceApi, UpdateClassroomRequest, ValidationException, Classroom } from '@/lib/api';
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
  CardDescription
} from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { Controller } from 'react-hook-form';
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

interface EditClassroomPageProps {
  params: Promise<{ uid: string }>;
}

export default function EditClassroomPage({ params }: EditClassroomPageProps) {
  const { uid } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [globalError, setGlobalError] = useState('');
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [linkData, setLinkData] = useState<any>(null);

  const { register, handleSubmit, watch, control, formState: { errors }, setError: setFormError, reset } = useForm<UpdateClassroomRequest>({
    defaultValues: {
      name: '',
      description: '',
      max_students: 30,
      pricing_type: 'free',
      price_vnd: 0,
      category: 'other',
      visibility_type: 'public',
    }
  });

  const pricingType = watch('pricing_type');
  const visibilityType = watch('visibility_type');

  useEffect(() => {
    const fetchClassroom = async () => {
      try {
        setFetching(true);
        const data = await spaceApi.classrooms.retrieve(uid);
        setClassroom(data);
        if (data.resolve_link) {
          setLinkData(data.resolve_link);
        } else {
          try {
            const link = await spaceApi.classrooms.getSharingLink(uid);
            setLinkData(link);
          } catch (e) {
            console.error("Failed to fetch sharing link", e);
          }
        }
        reset({
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
  }, [uid, reset]);

  const handleDownloadQr = () => {
    if (!linkData || !classroom) return;

    try {
      toast.info('Đang tạo ảnh QR...');
      const joinUrl = `${window.location.origin.replace('3003', '3000')}/join/${linkData.code}`;

      let svgString = renderToStaticMarkup(
        <QRCodeSVG
          value={joinUrl}
          size={400}
          level="H"
          includeMargin={true}
        />
      );

      if (!svgString.includes('xmlns=')) {
        svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = document.createElement("img");
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = 500;
        canvas.height = 500;
        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 50, 50, 400, 400);

          const pngUrl = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
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

  const onSubmit = async (data: UpdateClassroomRequest) => {
    setLoading(true);
    setGlobalError('');
    try {
      const payload: any = { ...data };
      if (data.pricing_type === 'free') {
        payload.price_vnd = 0;
      }
      await spaceApi.classrooms.update(uid, payload);
      toast.success('Cập nhật phòng học thành công');
      router.push('/space/classrooms');
    } catch (err: any) {
      if (err instanceof ValidationException) {
        Object.entries(err.errors).forEach(([field, message]) => {
          setFormError(field as any, { type: 'server', message });
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
    <div className="max-w-2xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            <div className="space-y-2">
              <Label htmlFor="name">
                Tên phòng học <span className="text-destructive">*</span>
              </Label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <BookOpen className="size-4" />
                </div>
                <Input
                  id="name"
                  {...register('name', { required: 'Tên phòng học là bắt buộc' })}
                  className="pl-10"
                  placeholder="Ví dụ: Toán học nâng cao lớp 12A1"
                  aria-invalid={!!errors.name}
                />
              </div>
              {errors.name && <p className="text-xs font-medium text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Mô tả khóa học <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                {...register('description', { required: 'Mô tả là bắt buộc' })}
                rows={4}
                className="resize-none"
                placeholder="Mô tả tóm tắt về mục tiêu, kiến thức sẽ đạt được trong khóa học này..."
                aria-invalid={!!errors.description}
              />
              {errors.description && <p className="text-xs font-medium text-destructive">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_students">
                Giới hạn học sinh <span className="text-destructive">*</span>
              </Label>
              <div className="relative group max-w-[240px]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Users className="size-4" />
                </div>
                <Input
                  id="max_students"
                  type="number"
                  {...register('max_students', {
                    required: 'Vui lòng nhập số lượng',
                    min: { value: 1, message: 'Tối thiểu 1 học sinh' }
                  })}
                  className="pl-10"
                  aria-invalid={!!errors.max_students}
                />
              </div>
              {errors.max_students && <p className="text-xs font-medium text-destructive">{errors.max_students.message}</p>}
            </div>
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
            <div className="space-y-3">
              <Label>Hình thức</Label>
              <div className="grid grid-cols-2 gap-3">
                <Label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${pricingType === 'free' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                  <Input type="radio" value="free" {...register('pricing_type')} className="mt-1 accent-primary" />
                  <div>
                    <div className="font-medium text-foreground">Miễn phí</div>
                    <div className="text-xs text-muted-foreground">Học sinh tham gia tự do, xem tất cả tài liệu.</div>
                  </div>
                </Label>
                <Label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${pricingType === 'paid' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                  <Input type="radio" value="paid" {...register('pricing_type')} className="mt-1 accent-primary" />
                  <div>
                    <div className="font-medium text-foreground">Trả phí</div>
                    <div className="text-xs text-muted-foreground">Học sinh phải thanh toán MoMo trước khi vào.</div>
                  </div>
                </Label>
              </div>
            </div>

            {pricingType === 'paid' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="price_vnd">
                  <Wallet className="size-4 text-primary" />
                  Giá lớp học (VND) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price_vnd"
                  type="number"
                  min={1000}
                  step={1000}
                  {...register('price_vnd', {
                    required: 'Giá là bắt buộc khi trả phí',
                    min: { value: 1000, message: 'Tối thiểu 1.000 VND' },
                  })}
                  placeholder="Ví dụ: 299000"
                  aria-invalid={!!errors.price_vnd}
                />
                {errors.price_vnd && <p className="text-xs font-medium text-destructive">{errors.price_vnd.message}</p>}
              </div>
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
            <div className="space-y-2">
              <Label htmlFor="category">
                <Tag className="size-4 text-primary" />
                Danh mục <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={control}
                name="category"
                rules={{ required: 'Vui lòng chọn danh mục' }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="category"
                      className="h-10 w-full aria-invalid:border-destructive"
                      aria-invalid={!!errors.category}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && <p className="text-xs font-medium text-destructive">{errors.category.message}</p>}
            </div>

            <div className="space-y-3">
              <Label>Chế độ hiển thị</Label>
              <div className="grid grid-cols-2 gap-3">
                <Label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${visibilityType === 'public' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                  <Input type="radio" value="public" {...register('visibility_type')} className="mt-1 accent-primary" />
                  <div>
                    <div className="font-medium text-foreground flex items-center gap-1"><Globe className="size-4" /> Công khai</div>
                    <div className="text-xs text-muted-foreground">Hiện trong trang Khám phá, học sinh tham gia trực tiếp.</div>
                  </div>
                </Label>
                <Label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${visibilityType === 'private' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}>
                  <Input type="radio" value="private" {...register('visibility_type')} className="mt-1 accent-primary" />
                  <div>
                    <div className="font-medium text-foreground flex items-center gap-1"><Lock className="size-4" /> Riêng tư</div>
                    <div className="text-xs text-muted-foreground">Chỉ tham gia qua mã mời. Không hiện trong Khám phá.</div>
                  </div>
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-semibold">
              <QrCode className="size-5 text-primary" />
              Mã QR tham gia
            </CardTitle>
            <CardDescription>Học sinh có thể quét mã này để tham gia phòng học nhanh chóng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-6 rounded-xl border border-border bg-muted/50 p-4">
              <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
                {linkData ? (
                  <QRCodeSVG
                    value={`${window.location.origin.replace('3003', '3000')}/join/${linkData.code}`}
                    size={140}
                    level="H"
                    includeMargin={false}
                  />
                ) : (
                  <div className="flex h-[140px] w-[140px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/50">
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
    </div>
  );
}
