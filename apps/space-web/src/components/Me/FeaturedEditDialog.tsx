'use client';

import { useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { useTranslation } from '@shared/components/LocaleProvider';
import { portfolioApi, type PortfolioEntry } from '@/lib/api/portfolio';
import { toast } from 'sonner';

type Props = {
  initial?: PortfolioEntry;
  onClose: () => void;
  onSaved: (entry: PortfolioEntry) => void;
};

type FormState = {
  title: string;
  description: string;
  tag: string;
  file_url: string;
};

export function FeaturedEditDialog({ initial, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const v = (initial?.value ?? {}) as FormState;
  const [form, setForm] = useState<FormState>({
    title: v.title ?? '',
    description: v.description ?? '',
    tag: v.tag ?? '',
    file_url: v.file_url ?? '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await portfolioApi.uploadFile(file);
      setForm((f) => ({ ...f, file_url: res.url }));
      toast.success(t('portfolio.labels.upload_success'));
    } catch (err) {
      console.error(err);
      toast.error(t('portfolio.labels.upload_error'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error(t('portfolio.labels.achievement_title'));
      return;
    }
    setSaving(true);
    try {
      const entry = await portfolioApi.upsertEntry(initial?.uid ?? null, {
        key: 'achievement',
        value: { ...form },
        is_public: true,
      });
      toast.success(t('portfolio.labels.saved'));
      onSaved(entry as PortfolioEntry);
    } catch (err) {
      console.error(err);
      toast.error(t('portfolio.labels.save_error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initial ? t('portfolio.me.edit') : t('portfolio.me.add')}{' '}
            {t('portfolio.me.featured')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label={t('portfolio.labels.achievement_title')}>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#0a66c2]/20 focus:border-[#0a66c2] outline-none"
              placeholder={t('portfolio.placeholders.achievement_title')}
            />
          </Field>
          <Field label={t('portfolio.me.fields.description')}>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#0a66c2]/20 focus:border-[#0a66c2] outline-none"
              placeholder={t('portfolio.placeholders.description')}
            />
          </Field>
          <Field label="Tag / Year (optional)">
            <input
              value={form.tag}
              onChange={(e) => setForm({ ...form, tag: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-[#0a66c2]/20 focus:border-[#0a66c2] outline-none"
              placeholder="e.g. Hàn Lâm · 2023"
            />
          </Field>
          <Field label={t('portfolio.me.fields.image')}>
            {form.file_url ? (
              <div className="flex items-center gap-2">
                <img
                  src={form.file_url}
                  alt="preview"
                  className="w-20 h-14 object-cover rounded border border-slate-200"
                />
                <label className="text-xs font-bold text-[#0a66c2] cursor-pointer hover:underline">
                  {t('portfolio.labels.replace_file')}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                  />
                </label>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 px-3 py-3 border-2 border-dashed border-slate-200 rounded-md cursor-pointer hover:border-[#0a66c2] text-xs font-bold text-slate-500">
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {t('portfolio.labels.upload_file')}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
              </label>
            )}
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('portfolio.me.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || uploading}
            className="bg-[#0a66c2] hover:bg-[#004182] text-white"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {t('portfolio.me.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-slate-700 mb-1">{label}</span>
      {children}
    </label>
  );
}
