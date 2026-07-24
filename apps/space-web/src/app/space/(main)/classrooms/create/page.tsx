'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { spaceApi, CreateClassroomRequest, ValidationException } from '@/lib/api';
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  Users,
  Info,
  Tag,
  Wallet,
  Eye,
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

const CATEGORIES: Array<{ value: NonNullable<CreateClassroomRequest['category']>; label: string }> = [
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

export default function CreateClassroomPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const { register, handleSubmit, watch, formState: { errors }, setError: setFormError } = useForm<CreateClassroomRequest>({
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

  const onSubmit = async (data: CreateClassroomRequest) => {
    setLoading(true);
    setGlobalError('');
    try {
      const payload: any = { ...data };
      if (data.pricing_type === 'free') {
        payload.price_vnd = 0;
      }
      await spaceApi.classrooms.create(payload);
      router.push('/space/classrooms');
    } catch (err: any) {
      if (err instanceof ValidationException) {
        Object.entries(err.errors).forEach(([field, message]) => {
          setFormError(field as any, { type: 'server', message });
        });
      } else {
        setGlobalError(err.message || 'Đã có lỗi xảy ra khi tạo phòng học');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/space/classrooms')}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Tạo phòng học mới</h1>
          <p className="text-muted-foreground text-sm">Khởi tạo không gian học tập chuyên nghiệp cho học sinh của bạn</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-semibold">
              <Info className="size-4 text-primary" />
              Thông tin cấu hình
            </CardTitle>
            <CardDescription>Vui lòng kiểm tra kỹ các thông tin trước khi khởi tạo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {globalError && (
              <div className="bg-destructive/10 border border-destructive/20 p-3 text-destructive text-sm rounded-lg font-medium flex items-center gap-2">
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
                  aria-invalid={!!errors.name}
                  className="pl-9"
                  placeholder="Ví dụ: Toán học nâng cao lớp 12A1"
                />
              </div>
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Mô tả khóa học <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                {...register('description', { required: 'Mô tả là bắt buộc' })}
                rows={4}
                aria-invalid={!!errors.description}
                className="resize-none"
                placeholder="Mô tả tóm tắt về mục tiêu, kiến thức sẽ đạt được trong khóa học này..."
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
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
                  aria-invalid={!!errors.max_students}
                  className="pl-9"
                />
              </div>
              {errors.max_students && <p className="text-xs text-destructive">{errors.max_students.message}</p>}
              <p className="text-xs text-muted-foreground">Hệ thống sẽ tự động khóa đăng ký khi đạt giới hạn</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-semibold">
              <Tag className="size-4 text-primary" />
              Hình thức lớp học
            </CardTitle>
            <CardDescription>Chọn miễn phí hoặc trả phí qua MoMo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <Label>Hình thức</Label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${pricingType === 'free' ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50'}`}>
                  <input type="radio" value="free" {...register('pricing_type')} className="mt-1" />
                  <div>
                    <div className="font-medium text-foreground">Miễn phí</div>
                    <div className="text-xs text-muted-foreground">Học sinh tham gia tự do, xem tất cả tài liệu.</div>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${pricingType === 'paid' ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50'}`}>
                  <input type="radio" value="paid" {...register('pricing_type')} className="mt-1" />
                  <div>
                    <div className="font-medium text-foreground">Trả phí</div>
                    <div className="text-xs text-muted-foreground">Học sinh phải thanh toán MoMo trước khi vào.</div>
                  </div>
                </label>
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
                  aria-invalid={!!errors.price_vnd}
                  placeholder="Ví dụ: 299000"
                />
                {errors.price_vnd && <p className="text-xs text-destructive">{errors.price_vnd.message}</p>}
              </div>
            )}

            <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700 text-xs">
              <Eye className="size-3.5 mt-0.5 shrink-0" />
              <span>Một <strong>Preview folder</strong> sẽ được tự động tạo — nơi bạn up tài liệu miễn phí mà mọi học sinh đều xem được, kể cả khi chưa thanh toán.</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-semibold">
              <Sparkles className="size-4 text-primary" />
              Phân loại & Hiển thị
            </CardTitle>
            <CardDescription>Danh mục giúp học sinh dễ tìm thấy lớp của bạn trong trang Khám phá</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="category">
                <Tag className="size-4 text-primary" />
                Danh mục <span className="text-destructive">*</span>
              </Label>
              <select
                id="category"
                {...register('category', { required: 'Vui lòng chọn danh mục' })}
                className={`h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 ${errors.category ? 'border-destructive' : 'border-border'}`}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            </div>

            <div className="space-y-3">
              <Label>Chế độ hiển thị</Label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${visibilityType === 'public' ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50'}`}>
                  <input type="radio" value="public" {...register('visibility_type')} className="mt-1" />
                  <div>
                    <div className="font-medium text-foreground flex items-center gap-1"><Globe className="size-3.5" /> Công khai</div>
                    <div className="text-xs text-muted-foreground">Hiện trong trang Khám phá, học sinh tham gia trực tiếp.</div>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${visibilityType === 'private' ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50'}`}>
                  <input type="radio" value="private" {...register('visibility_type')} className="mt-1" />
                  <div>
                    <div className="font-medium text-foreground flex items-center gap-1"><Lock className="size-3.5" /> Riêng tư</div>
                    <div className="text-xs text-muted-foreground">Chỉ tham gia qua mã mời. Không hiện trong Khám phá.</div>
                  </div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/space/classrooms')}
            disabled={loading}
          >
            HỦY BỎ
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="min-w-[180px]"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                ĐANG XỬ LÝ...
              </>
            ) : 'KHỞI TẠO PHÒNG HỌC'}
          </Button>
        </div>
      </form>
    </div>
  );
}
