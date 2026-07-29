'use client';

import { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { Label } from '@shared/components/ui/label';
import { useTranslation } from '@shared/components/LocaleProvider';
import { portfolioApi, type PortfolioEntry } from '@/lib/api/portfolio';
import {
  EDUCATION_FIELD_MUST_HAVE,
  MONTHS,
  getEducationValue,
  getYearOptions,
  validateEducationValue,
  type EducationValue,
} from '@shared/lib/portfolio/education';
import { toast } from 'sonner';

type Props = {
  initial?: PortfolioEntry;
  onClose: () => void;
  onSaved: (entry: PortfolioEntry) => void;
};

const SKILL_MAX = 5;

const YEAR_OPTIONS = getYearOptions();

export function EducationEditDialog({ initial, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<EducationValue>(() =>
    getEducationValue(initial?.value as Record<string, unknown> | undefined),
  );
  const [skillDraft, setSkillDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof EducationValue>(key: K, value: EducationValue[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addSkill = () => {
    const v = skillDraft.trim();
    if (!v) return;
    if (form.skills.length >= SKILL_MAX) return;
    if (form.skills.includes(v)) {
      setSkillDraft('');
      return;
    }
    setForm((prev) => ({ ...prev, skills: [...prev.skills, v] }));
    setSkillDraft('');
  };

  const removeSkill = (skill: string) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
  };

  const handleSave = async () => {
    const result = validateEducationValue(form, EDUCATION_FIELD_MUST_HAVE);
    if (!result.ok) {
      const messageKey = result.missing === 'school' ? 'portfolio.labels.school_required' : null;
      toast.error(messageKey ? t(messageKey) : t('portfolio.labels.save_error'));
      return;
    }
    setSaving(true);
    try {
      const entry = await portfolioApi.upsertEntry(initial?.uid ?? null, {
        key: 'education',
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
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
          <DialogTitle>
            {initial ? t('portfolio.labels.edit_education') : t('portfolio.labels.add_education')}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-5 space-y-4">
          <Field label={t('portfolio.labels.school')} required>
            <Input
              value={form.school}
              onChange={(e) => update('school', e.target.value)}
              className={inputCls}
              placeholder={t('portfolio.placeholders.school')}
              maxLength={80}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('portfolio.labels.degree')}>
              <Input
                value={form.degree}
                onChange={(e) => update('degree', e.target.value)}
                className={inputCls}
                placeholder={t('portfolio.placeholders.degree')}
              />
            </Field>
            <Field label={t('portfolio.labels.field_of_study')}>
              <Input
                value={form.field_of_study}
                onChange={(e) => update('field_of_study', e.target.value)}
                className={inputCls}
                placeholder={t('portfolio.placeholders.field_of_study')}
              />
            </Field>
          </div>

          <div>
            <p className="text-xs font-bold text-foreground mb-1">{t('portfolio.labels.start_year_month')}</p>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={form.start_month || 'placeholder-start-month'}
                onValueChange={(v) => update('start_month', v === 'placeholder-start-month' ? '' : v)}
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder={t('portfolio.labels.start_month')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder-start-month">{t('portfolio.labels.start_month')}</SelectItem>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={form.start_year || 'placeholder-start-year'}
                onValueChange={(v) => update('start_year', v === 'placeholder-start-year' ? '' : v)}
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="YYYY" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder-start-year">YYYY</SelectItem>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y.value} value={y.value}>
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-foreground">
                {t('portfolio.labels.end_year_month')} <span className="font-normal text-muted-foreground">({t('portfolio.labels.end_expected')})</span>
              </p>
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Input
                  type="checkbox"
                  checked={form.is_current}
                  onChange={(e) => update('is_current', e.target.checked)}
                  className="size-3.5 accent-primary"
                />
                {t('portfolio.labels.end_year_present')}
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={form.end_month || 'placeholder-end-month'}
                onValueChange={(v) => update('end_month', v === 'placeholder-end-month' ? '' : v)}
                disabled={form.is_current}
              >
                <SelectTrigger className={inputCls} disabled={form.is_current}>
                  <SelectValue placeholder={t('portfolio.labels.end_month')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder-end-month">{t('portfolio.labels.end_month')}</SelectItem>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={form.end_year || 'placeholder-end-year'}
                onValueChange={(v) => update('end_year', v === 'placeholder-end-year' ? '' : v)}
                disabled={form.is_current}
              >
                <SelectTrigger className={inputCls} disabled={form.is_current}>
                  <SelectValue placeholder="YYYY" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder-end-year">YYYY</SelectItem>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y.value} value={y.value}>
                      {y.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Field label={t('portfolio.labels.grade')}>
            <Input
              value={form.grade}
              onChange={(e) => update('grade', e.target.value.slice(0, 80))}
              className={inputCls}
              placeholder={t('portfolio.placeholders.grade')}
              maxLength={80}
            />
          </Field>

          <Field label={t('portfolio.labels.activities_and_societies')}>
            <Textarea
              rows={2}
              value={form.activities_and_societies}
              onChange={(e) => update('activities_and_societies', e.target.value.slice(0, 5000))}
              className={inputCls}
              placeholder={t('portfolio.placeholders.activities_and_societies')}
              maxLength={5000}
            />
            <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
              {form.activities_and_societies.length}/5000
            </p>
          </Field>

          <Field label={t('portfolio.labels.education_description')}>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value.slice(0, 1000))}
              className={inputCls}
              maxLength={1000}
            />
            <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
              {form.description.length}/1000
            </p>
          </Field>

          <div>
            <p className="text-xs font-bold text-foreground mb-1">{t('portfolio.me.skills')}</p>
            <p className="text-[11px] text-muted-foreground mb-2">{t('portfolio.labels.skills_helper')}</p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-xs text-foreground"
                >
                  {skill}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSkill(skill)}
                    className="size-4 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${skill}`}
                  >
                    <X className="size-3" />
                  </Button>
                </span>
              ))}
            </div>
            {form.skills.length < SKILL_MAX && (
              <div className="flex gap-2">
                <Input
                  value={skillDraft}
                  onChange={(e) => setSkillDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  className={inputCls}
                  placeholder={t('portfolio.labels.skill_placeholder')}
                />
                <Button type="button" variant="outline" onClick={addSkill} disabled={!skillDraft.trim()}>
                  <Plus className="size-3.5" />
                  {t('portfolio.labels.add_skill')}
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="sticky bottom-0 bg-background border-t border-border px-6 py-3 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('portfolio.me.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {t('portfolio.me.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const inputCls = 'w-full';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Label className="block">
      <span className="block text-xs font-bold text-foreground mb-1">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      {children}
    </Label>
  );
}
