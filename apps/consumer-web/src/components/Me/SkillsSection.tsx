'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
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
  items: PortfolioEntry[];
  isOwner?: boolean;
  onChanged: (next: PortfolioEntry[]) => void;
};

export function SkillsSection({ items, isOwner = true, onChanged }: Props) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);

  const handleAdd = async (title: string) => {
    try {
      const entry = await portfolioApi.upsertEntry(null, {
        key: 'certificate',
        value: { title },
        is_public: true,
      });
      onChanged([...items, entry as PortfolioEntry]);
      toast.success(t('portfolio.labels.saved'));
    } catch (err) {
      console.error(err);
      toast.error(t('portfolio.labels.save_error'));
    }
  };

  const handleRemove = async (uid: string) => {
    if (!confirm(t('portfolio.labels.delete_confirm'))) return;
    try {
      await portfolioApi.deleteEntry(uid);
      onChanged(items.filter((i) => i.uid !== uid));
      toast.success(t('portfolio.labels.deleted'));
    } catch (err) {
      console.error(err);
      toast.error(t('portfolio.labels.delete_error'));
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t('portfolio.me.skills')}</h2>
        {isOwner && (
          <button
            onClick={() => setAdding(true)}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400"
            aria-label={t('portfolio.me.add')}
          >
            <Plus className="size-4" />
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 italic">{t('portfolio.me.no_skills')}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => {
            const v = (item.value ?? {}) as { title?: string };
            const title = v.title || '';
            if (!title) return null;
            return (
              <span
                key={item.uid}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                {title}
                {isOwner && (
                  <button
                    onClick={() => handleRemove(item.uid)}
                    className="w-4 h-4 rounded-full hover:bg-slate-300 flex items-center justify-center text-slate-500 dark:text-slate-400"
                    aria-label={t('portfolio.me.delete')}
                  >
                    <X className="size-3" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {adding && <AddSkillDialog onClose={() => setAdding(false)} onAdd={handleAdd} />}
    </section>
  );
}

function AddSkillDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (title: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onAdd(title.trim());
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('portfolio.me.add')} {t('portfolio.me.skills')}</DialogTitle>
        </DialogHeader>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:ring-2 focus:ring-[#0a66c2]/20 focus:border-[#0a66c2] outline-none"
          placeholder={t('portfolio.placeholders.certificate_title')}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {t('portfolio.me.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
            className="bg-[#0a66c2] hover:bg-[#004182] text-white"
          >
            {t('portfolio.me.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
