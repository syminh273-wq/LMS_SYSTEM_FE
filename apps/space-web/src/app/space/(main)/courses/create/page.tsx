'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@shared/components/LocaleProvider';
import { ArrowLeft, Loader2, BookOpen, ImageIcon, DollarSign, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
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
import { RadioGroup, RadioGroupItem } from '@shared/components/ui/radio-group';
import { ValidationException, courseApi, type CreateCourseRequest, type PricingType } from '@/lib/api';
import { toast } from 'sonner';

const courseSchema = z
  .object({
    name: z.string().min(1, 'Tên khóa học là bắt buộc'),
    description: z.string(),
    cover_url: z.string(),
    pricing_type: z.enum(['free', 'paid']),
    price_vnd: z.number().nonnegative().optional(),
  })
  .refine((d) => d.pricing_type === 'free' || (d.price_vnd !== undefined && d.price_vnd >= 1000), {
    message: 'Giá tối thiểu 1.000đ',
    path: ['price_vnd'],
  });

type FormValues = z.infer<typeof courseSchema>;

export default function CreateCoursePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: '',
      description: '',
      cover_url: '',
      pricing_type: 'free',
      price_vnd: 0,
    },
  });

  const pricingType = form.watch('pricing_type');

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('owner_type', 'course_temp');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/resource/upload/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setCoverUrl(data.url);
      form.setValue('cover_url', data.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setGlobalError('');
    try {
      const payload: CreateCourseRequest = {
        name: data.name,
        description: data.description || '',
        cover_url: coverUrl || '',
        pricing_type: data.pricing_type as PricingType,
        price_vnd: data.pricing_type === 'paid' ? data.price_vnd ?? 0 : 0,
      };
      const course = await courseApi.create(payload);
      toast.success(t('course.create.success', 'Course created.'));
      router.push(`/space/courses/${course.uid}`);
    } catch (err) {
      if (err instanceof ValidationException) {
        Object.entries(err.errors).forEach(([field, message]) => {
          form.setError(field as any, { type: 'server', message });
        });
      } else {
        setGlobalError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
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
          onClick={() => router.push('/space/courses')}
          className="rounded-xl border bg-card shadow-sm hover:bg-muted/50 transition-all"
        >
          <ArrowLeft size={18} className="text-muted-foreground" />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            {t('course.create.title', 'Create new course')}
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            {t('course.create.success', 'Add lessons after creating.')}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
            <div className="h-2 bg-primary" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <BookOpen size={20} className="text-primary" />
                {t('course.detail.tabs.info', 'Info')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {globalError && (
                <div className="bg-destructive/10 border border-destructive/20 p-4 text-destructive text-sm rounded-xl font-medium">
                  {globalError}
                </div>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('course.create.name_label', 'Course name')} <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('course.create.name_placeholder', 'Example: Python Basics')}
                        {...field}
                      />
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
                    <FormLabel>{t('course.create.description_label', 'Description')}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        className="resize-none"
                        placeholder={t('course.create.description_placeholder', 'What will students learn?')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>
                  <ImageIcon size={14} />
                  {t('course.create.cover_label', 'Cover image')}
                </FormLabel>
                <div className="border-2 border-dashed border-border rounded-xl p-4 text-center">
                  {coverUrl ? (
                    <div className="space-y-2">
                      <img src={coverUrl} alt="cover" className="w-full h-32 object-cover rounded-lg" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCoverUrl('');
                          form.setValue('cover_url', '');
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <Input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                      <div className="py-4 space-y-1">
                        <ImageIcon size={32} className="mx-auto text-muted-foreground/40" />
                        <p className="text-xs text-muted-foreground">
                          {uploading ? 'Uploading...' : t('course.create.cover_hint', 'Recommended 16:9, max 2MB')}
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </FormItem>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-500" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <DollarSign size={20} className="text-amber-500" />
                {t('course.create.pricing_label', 'Pricing')}
              </CardTitle>
              <CardDescription>
                Free courses let students join instantly. Paid courses require MoMo payment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="pricing_type"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                      >
                        <PricingOption
                          value="free"
                          active={field.value === 'free'}
                          title={t('course.create.pricing_free', 'Free')}
                          desc="Students join instantly"
                        />
                        <PricingOption
                          value="paid"
                          active={field.value === 'paid'}
                          title={t('course.create.pricing_paid', 'Paid')}
                          desc="MoMo payment required"
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
                    <FormItem>
                      <FormLabel>
                        {t('course.create.price_label', 'Price (VND)')} <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1000}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                          placeholder={t('course.create.price_placeholder', '299000')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/space/courses')}
              disabled={loading}
              className="text-muted-foreground font-bold hover:bg-muted rounded-xl px-6"
            >
              {t('course.create.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[180px] h-12 rounded-xl shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  {t('course.create.creating', 'Creating...')}
                </>
              ) : (
                <>
                  <GraduationCap size={16} className="mr-2" />
                  {t('course.create.submit', 'Create course')}
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
}: {
  value: string;
  active: boolean;
  title: string;
  desc: string;
}) {
  return (
    <label
      className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
        active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
      }`}
    >
      <RadioGroupItem value={value} className="mt-1" />
      <div>
        <div className="font-bold capitalize">{title}</div>
        <div className="text-xs text-muted-foreground mt-1">{desc}</div>
      </div>
    </label>
  );
}
