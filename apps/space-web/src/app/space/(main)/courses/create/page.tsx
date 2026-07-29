'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@shared/components/LocaleProvider';
import { ArrowLeft, Loader2, BookOpen, ImageIcon, DollarSign, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { ValidationException, courseApi, type CreateCourseRequest, type PricingType } from '@/lib/api';
import { toast } from 'sonner';

export default function CreateCoursePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors }, setError: setFormError } = useForm<CreateCourseRequest & { price_vnd_str: string }>({
    defaultValues: {
      name: '',
      description: '',
      cover_url: '',
      pricing_type: 'free',
      price_vnd: 0,
      price_vnd_str: '',
    },
  });

  const pricingType = watch('pricing_type');

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const form = new FormData();
      form.append('file', file);
      form.append('owner_type', 'course_temp');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/resource/upload/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
        },
        body: form,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setCoverUrl(data.url);
      setValue('cover_url', data.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: CreateCourseRequest & { price_vnd_str: string }) => {
    setLoading(true);
    setGlobalError('');
    try {
      const payload: CreateCourseRequest = {
        name: data.name,
        description: data.description || '',
        cover_url: coverUrl || '',
        pricing_type: data.pricing_type as PricingType,
        price_vnd: data.pricing_type === 'paid' ? Number(data.price_vnd_str) || 0 : 0,
      };
      const course = await courseApi.create(payload);
      toast.success(t('course.create.success', 'Course created.'));
      router.push(`/space/courses/${course.uid}`);
    } catch (err) {
      if (err instanceof ValidationException) {
        Object.entries(err.errors).forEach(([field, message]) => {
          setFormError(field as any, { type: 'server', message });
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
          className="rounded-xl border border-border bg-card shadow-sm hover:bg-muted/50 transition-all"
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-border shadow-sm rounded-2xl overflow-hidden">
          <div className="h-2 bg-primary-brand" />
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <BookOpen size={20} className="text-primary-brand" />
              {t('course.detail.tabs.info', 'Info')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {globalError && (
              <div className="bg-destructive/10 border border-destructive/20 p-4 text-destructive text-sm rounded-xl font-medium">
                {globalError}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
                {t('course.create.name_label', 'Course name')} <span className="text-destructive">*</span>
              </Label>
              <Input
                {...register('name', { required: t('course.create.name_required', 'Required') })}
                className={`w-full px-4 py-3 bg-muted/50 border rounded-xl outline-none focus:ring-4 focus:ring-primary-brand/10 focus:bg-card focus:border-primary-brand transition-all font-medium text-foreground ${errors.name ? 'border-destructive' : 'border-border'}`}
                placeholder={t('course.create.name_placeholder', 'Example: Python Basics')}
              />
              {errors.name && <p className="text-destructive text-xs font-bold px-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-foreground px-1">
                {t('course.create.description_label', 'Description')}
              </Label>
              <Textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl outline-none focus:ring-4 focus:ring-primary-brand/10 focus:bg-card focus:border-primary-brand transition-all font-medium text-foreground resize-none"
                placeholder={t('course.create.description_placeholder', 'What will students learn?')}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
                <ImageIcon size={14} />
                {t('course.create.cover_label', 'Cover image')}
              </Label>
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
                        setValue('cover_url', '');
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Label className="cursor-pointer block">
                    <Input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                    <div className="py-4 space-y-1">
                      <ImageIcon size={32} className="mx-auto text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground">
                        {uploading ? 'Uploading...' : t('course.create.cover_hint', 'Recommended 16:9, max 2MB')}
                      </p>
                    </div>
                  </Label>
                )}
              </div>
            </div>
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
            <div className="grid grid-cols-2 gap-3">
              {(['free', 'paid'] as PricingType[]).map((type) => (
                <Button
                  key={type}
                  type="button"
                  onClick={() => setValue('pricing_type', type)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    pricingType === type
                      ? 'border-primary-brand bg-primary-brand-light'
                      : 'border-border hover:border-primary-brand-muted'
                  }`}
                >
                  <div className="font-bold capitalize">
                    {type === 'free' ? t('course.create.pricing_free', 'Free') : t('course.create.pricing_paid', 'Paid')}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {type === 'free' ? 'Students join instantly' : 'MoMo payment required'}
                  </div>
                </Button>
              ))}
            </div>

            {pricingType === 'paid' && (
              <div className="space-y-2">
                <Label className="text-sm font-bold text-foreground px-1">
                  {t('course.create.price_label', 'Price (VND)')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  min={1000}
                  {...register('price_vnd_str', {
                    required: t('course.create.price_required', 'Required'),
                    min: { value: 1000, message: t('course.create.price_min', 'Min 1,000đ') },
                  })}
                  className={`w-full px-4 py-3 bg-muted/50 border rounded-xl outline-none focus:ring-4 focus:ring-primary-brand/10 focus:bg-card focus:border-primary-brand transition-all font-bold text-foreground ${errors.price_vnd_str ? 'border-destructive' : 'border-border'}`}
                  placeholder={t('course.create.price_placeholder', '299000')}
                />
                {errors.price_vnd_str && <p className="text-destructive text-xs font-bold px-1">{errors.price_vnd_str.message}</p>}
              </div>
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
            className="bg-primary-brand hover:bg-primary-brand-dark text-white font-bold min-w-[180px] h-12 rounded-xl shadow-lg shadow-primary-brand/20"
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
    </div>
  );
}
