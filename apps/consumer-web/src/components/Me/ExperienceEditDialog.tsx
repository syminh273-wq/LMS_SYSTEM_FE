'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { useTranslation } from '@shared/components/LocaleProvider';
import { portfolioApi, type PortfolioEntry } from '@/lib/api/portfolio';
import { MONTHS, getYearOptions } from '@shared/lib/portfolio/education';
import { toast } from 'sonner';

type Props = {
  initial?: PortfolioEntry;
  onClose: () => void;
  onSaved: (entry: PortfolioEntry) => void;
};

type FormState = {
  position: string;
  company: string;
  start_month: string;
  start_year: string;
  end_month: string;
  end_year: string;
  is_current: boolean;
  location: string;
  description: string;
};

const YEAR_OPTIONS = getYearOptions();

const inputCls =
  'w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:ring-2 focus:ring-[#0a66c2]/20 focus:border-[#0a66c2] outline-none disabled:bg-slate-50 dark:bg-slate-900/50 disabled:text-slate-400';

export function ExperienceEditDialog({ initial, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const v = (initial?.value ?? {}) as Partial<FormState>;
  const [form, setForm] = useState<FormState>({
    position: v.position ?? '',
    company: v.company ?? '',
    start_month: v.start_month ?? '',
    start_year: v.start_year ?? '',
    end_month: v.end_month ?? '',
    end_year: v.end_year ?? '',
    is_current: v.is_current === true,
    location: v.location ?? '',
    description: v.description ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.position.trim() && !form.company.trim()) {
      toast.error(t('portfolio.labels.company'));
      return;
    }
    setSaving(true);
    try {
      const entry = await portfolioApi.upsertEntry(initial?.uid ?? null, {
        key: 'experience',
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
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <DialogTitle>
            {initial ? t('portfolio.me.edit') : t('portfolio.me.add')}{' '}
            {t('portfolio.me.experience')}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-5 space-y-3">
          <Field label={t('portfolio.labels.position')}>
            <input
              value={form.position}
              onChange={(e) => setForm({ ...form, position: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:ring-2 focus:ring-[#0a66c2]/20 focus:border-[#0a66c2] outline-none"
              placeholder={t('portfolio.placeholders.position')}
            />
          </Field>
          <Field label={t('portfolio.labels.company')}>
            <input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className={inputCls}
              placeholder={t('portfolio.placeholders.company')}
            />
          </Field>

          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('portfolio.labels.start_year_month')}</p>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.start_month}
                onChange={(e) => setForm({ ...form, start_month: e.target.value })}
                className={inputCls}
              >
                <option value="">{t('portfolio.labels.start_month')}</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select
                value={form.start_year}
                onChange={(e) => setForm({ ...form, start_year: e.target.value })}
                className={inputCls}
              >
                <option value="">YYYY</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y.value} value={y.value}>{y.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t('portfolio.labels.end_year_month')}{' '}
                <span className="font-normal text-slate-500 dark:text-slate-400">({t('portfolio.labels.end_expected')})</span>
              </p>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={form.is_current}
                  onChange={(e) => setForm({ ...form, is_current: e.target.checked })}
                  className="size-3.5 accent-[#0a66c2]"
                />
                {t('portfolio.labels.end_year_present')}
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.end_month}
                onChange={(e) => setForm({ ...form, end_month: e.target.value })}
                className={inputCls}
                disabled={form.is_current}
              >
                <option value="">{t('portfolio.labels.end_month')}</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select
                value={form.end_year}
                onChange={(e) => setForm({ ...form, end_year: e.target.value })}
                className={inputCls}
                disabled={form.is_current}
              >
                <option value="">YYYY</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y.value} value={y.value}>{y.label}</option>
                ))}
              </select>
            </div>
          </div>
          <Field label={t('portfolio.me.fields.location')}>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label={t('portfolio.me.fields.description')}>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputCls}
            />
          </Field>
        </div>
        <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-3 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('portfolio.me.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
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
      <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{label}</span>
      {children}
    </label>
  );
}
