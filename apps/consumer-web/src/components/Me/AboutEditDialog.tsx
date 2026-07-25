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
import { portfolioApi } from '@/lib/api/portfolio';
import { toast } from 'sonner';
import { CEditor } from '@/components/CEditor';

type AboutEditDialogProps = {
  initial: string;
  introUid?: string;
  onClose: () => void;
  onSaved: (about: string) => void;
};

export function AboutEditDialog({ initial, introUid, onClose, onSaved }: AboutEditDialogProps) {
  const { t } = useTranslation();
  const [about, setAbout] = useState(initial);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await portfolioApi.upsertEntry(introUid ?? null, {
        key: 'intro',
        value: { about },
        is_public: true,
      });
      toast.success(t('portfolio.labels.saved'));
      onSaved(about);
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
          <DialogTitle className="text-xl font-bold">
            {t('portfolio.labels.edit_intro')}
          </DialogTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {t('workspace.profile.edit_about_desc')}
          </p>
        </DialogHeader>

        <div className="px-6 py-5">
          <CEditor
            value={about}
            onChange={setAbout}
            placeholder={t('portfolio.placeholders.about')}
            minHeight="240px"
          />
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

