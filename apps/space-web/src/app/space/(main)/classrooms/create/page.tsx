'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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

const createSchema = z
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

type FormValues = z.infer<typeof createSchema>;

export default function CreateClassroomPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(createSchema),
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

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setGlobalError('');
    try {
      const payload: CreateClassroomRequest = {
        ...data,
        price_vnd: data.pricing_type === 'free' ? 0 : (data.price_vnd ?? 0),
      };
      await spaceApi.classrooms.createClassroom(payload);
      router.push('/space/classrooms');
    } catch (err: any) {
      if (err instanceof ValidationException) {
        Object.entries(err.errors).forEach(([field, message]) => {
          form.setError(field as any, { type: 'server', message });
        });
      } else {
        setGlobalError(err.message || 'Đã có lỗi xảy ra khi tạo phòng học');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          className="pl-9"
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
                            className="pl-9"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">Hệ thống sẽ tự động khóa đăng ký khi đạt giới hạn</p>
                    </FormItem>
                  )}
                />
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

              <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-xs">
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
                          icon={<Globe className="size-3.5" />}
                          title="Công khai"
                          desc="Hiện trong trang Khám phá, học sinh tham gia trực tiếp."
                        />
                        <PricingOption
                          value="private"
                          active={visibilityType === 'private'}
                          icon={<Lock className="size-3.5" />}
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
      className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
        active ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50'
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
