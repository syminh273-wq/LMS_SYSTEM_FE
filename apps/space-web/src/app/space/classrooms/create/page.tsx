'use client';

import { useEffect, useState } from 'react';
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
  Eye
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';

export default function CreateClassroomPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [courses, setCourses] = useState<Array<{ uid: string; name: string }>>([]);

  const { register, handleSubmit, watch, formState: { errors }, setError: setFormError } = useForm<CreateClassroomRequest>({
    defaultValues: {
      name: '',
      description: '',
      max_students: 30,
      pricing_type: 'free',
      price_vnd: 0,
      course_uid: null,
    }
  });

  const pricingType = watch('pricing_type');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await spaceApi.courses.list(1);
        if (!cancelled) {
          setCourses(res.results.map((c: any) => ({ uid: c.uid, name: c.name })));
        }
      } catch {
        if (!cancelled) setCourses([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
          variant="ghost"
          size="icon"
          onClick={() => router.push('/space/classrooms')}
          className="rounded-xl border border-border bg-card shadow-sm hover:bg-muted/50 transition-all"
        >
          <ArrowLeft size={18} className="text-muted-foreground" />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Tạo phòng học mới</h1>
          <p className="text-muted-foreground text-sm font-medium">Khởi tạo không gian học tập chuyên nghiệp cho học sinh của bạn</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
          <div className="h-2 bg-primary-brand" />
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Info size={20} className="text-primary-brand" />
              Thông tin cấu hình
            </CardTitle>
            <CardDescription className="font-medium text-muted-foreground">Vui lòng kiểm tra kỹ các thông tin trước khi khởi tạo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {globalError && (
              <div className="bg-rose-50 border border-rose-100 p-4 text-rose-600 text-sm rounded-xl font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                {globalError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
                Tên phòng học <span className="text-rose-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary-brand transition-colors">
                  <BookOpen size={18} />
                </div>
                <input
                  {...register('name', { required: 'Tên phòng học là bắt buộc' })}
                  className={`w-full pl-10 pr-4 py-3 bg-muted/50 border rounded-xl outline-none focus:ring-4 focus:ring-primary-brand/10 focus:bg-card focus:border-primary-brand transition-all font-medium text-foreground ${errors.name ? 'border-rose-500 bg-rose-50/30' : 'border-border'}`}
                  placeholder="Ví dụ: Toán học nâng cao lớp 12A1"
                />
              </div>
              {errors.name && <p className="text-rose-500 text-[11px] font-bold px-1 uppercase tracking-tighter">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground px-1">Mô tả khóa học <span className="text-rose-500">*</span></label>
              <textarea
                {...register('description', { required: 'Mô tả là bắt buộc' })}
                rows={4}
                className={`w-full px-4 py-3 bg-muted/50 border rounded-xl outline-none focus:ring-4 focus:ring-primary-brand/10 focus:bg-card focus:border-primary-brand transition-all font-medium text-foreground resize-none ${errors.description ? 'border-rose-500 bg-rose-50/30' : 'border-border'}`}
                placeholder="Mô tả tóm tắt về mục tiêu, kiến thức sẽ đạt được trong khóa học này..."
              />
              {errors.description && <p className="text-rose-500 text-[11px] font-bold px-1 uppercase tracking-tighter">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
                Giới hạn học sinh <span className="text-rose-500">*</span>
              </label>
              <div className="relative group max-w-[240px]">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary-brand transition-colors">
                  <Users size={18} />
                </div>
                <input
                  type="number"
                  {...register('max_students', {
                    required: 'Vui lòng nhập số lượng',
                    min: { value: 1, message: 'Tối thiểu 1 học sinh' }
                  })}
                  className={`w-full pl-10 pr-4 py-3 bg-muted/50 border rounded-xl outline-none focus:ring-4 focus:ring-primary-brand/10 focus:bg-card focus:border-primary-brand transition-all font-bold text-foreground ${errors.max_students ? 'border-rose-500 bg-rose-50/30' : 'border-border'}`}
                />
              </div>
              {errors.max_students && <p className="text-rose-500 text-[11px] font-bold px-1 uppercase tracking-tighter">{errors.max_students.message}</p>}
              <p className="text-[11px] text-muted-foreground font-bold px-1 uppercase tracking-tighter">Hệ thống sẽ tự động khóa đăng ký khi đạt giới hạn</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
          <div className="h-2 bg-primary-brand" />
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Tag size={20} className="text-primary-brand" />
              Giá & Bài giảng
            </CardTitle>
            <CardDescription className="font-medium text-muted-foreground">Chọn hình thức thu phí và khóa học nguồn (nếu có)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <label className="text-sm font-bold text-foreground px-1">Hình thức</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${pricingType === 'free' ? 'border-primary-brand bg-primary-brand/5' : 'border-border bg-muted/30 hover:bg-muted/50'}`}>
                  <input type="radio" value="free" {...register('pricing_type')} className="mt-1" />
                  <div>
                    <div className="font-bold text-foreground">Miễn phí</div>
                    <div className="text-xs text-muted-foreground">Học sinh tham gia tự do.</div>
                  </div>
                </label>
                <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${pricingType === 'paid' ? 'border-primary-brand bg-primary-brand/5' : 'border-border bg-muted/30 hover:bg-muted/50'}`}>
                  <input type="radio" value="paid" {...register('pricing_type')} className="mt-1" />
                  <div>
                    <div className="font-bold text-foreground">Trả phí</div>
                    <div className="text-xs text-muted-foreground">Học sinh thanh toán qua MoMo trước khi vào.</div>
                  </div>
                </label>
              </div>
            </div>

            {pricingType === 'paid' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
                  <Wallet size={16} className="text-primary-brand" />
                  Giá lớp học (VND) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  {...register('price_vnd', {
                    required: 'Giá là bắt buộc khi trả phí',
                    min: { value: 1000, message: 'Tối thiểu 1.000 VND' },
                  })}
                  className={`w-full px-4 py-3 bg-muted/50 border rounded-xl outline-none focus:ring-4 focus:ring-primary-brand/10 focus:bg-card focus:border-primary-brand transition-all font-bold text-foreground ${errors.price_vnd ? 'border-rose-500 bg-rose-50/30' : 'border-border'}`}
                  placeholder="Ví dụ: 299000"
                />
                {errors.price_vnd && <p className="text-rose-500 text-[11px] font-bold px-1 uppercase tracking-tighter">{errors.price_vnd.message}</p>}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
                <Eye size={16} className="text-primary-brand" />
                Liên kết khóa học (tùy chọn)
              </label>
              <select
                {...register('course_uid')}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl outline-none focus:ring-4 focus:ring-primary-brand/10 focus:bg-card focus:border-primary-brand transition-all font-bold text-foreground"
                defaultValue=""
              >
                <option value="">— Không liên kết —</option>
                {courses.map((c) => (
                  <option key={c.uid} value={c.uid}>{c.name}</option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground font-bold px-1 uppercase tracking-tighter">
                Liên kết tới 1 khóa học để học sinh xem được các bài giảng từ khóa đó.
              </p>
            </div>

            <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-medium">
              <Eye size={14} className="mt-0.5 shrink-0" />
              <span>Một <strong>Preview folder</strong> sẽ được tự động tạo và hiển thị mặc định cho tất cả mọi người, kể cả học sinh chưa thanh toán.</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/space/classrooms')}
            disabled={loading}
            className="text-muted-foreground font-bold text-xs tracking-widest hover:bg-muted rounded-xl px-6"
          >
            HỦY BỎ
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary-brand hover:bg-primary-brand-dark text-white font-bold text-xs tracking-widest min-w-[180px] h-12 rounded-xl shadow-lg shadow-primary-brand/20 transition-all active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                ĐANG XỬ LÝ...
              </>
            ) : 'KHỞI TẠO PHÒNG HỌC'}
          </Button>
        </div>
      </form>
    </div>
  );
}

