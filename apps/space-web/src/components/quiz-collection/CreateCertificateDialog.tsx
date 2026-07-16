'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { useTranslation } from '@shared/components/LocaleProvider';
import { toast } from 'sonner';
import { certificateApi } from '@/lib/api/quiz-collection';
import type { Certificate } from '@/lib/api/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (c: Certificate) => void;
}

export function CreateCertificateDialog({ open, onOpenChange, onCreated }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [templateUrl, setTemplateUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName('');
    setDescription('');
    setTemplateUrl('');
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error(t('validation.required', undefined, { field: t('certificate.create_modal.name_label') }));
      return;
    }
    try {
      setSubmitting(true);
      const c = await certificateApi.create({
        name: name.trim(),
        description: description.trim(),
        template_url: templateUrl.trim() || undefined,
      });
      reset();
      onCreated(c);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('certificate.save_error', 'Cannot save'))
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('certificate.create_modal.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              {t('certificate.create_modal.name_label')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('certificate.create_modal.name_placeholder')}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              {t('certificate.create_modal.description_label')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('certificate.create_modal.description_placeholder')}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              {t('certificate.create_modal.template_url_label')}
            </label>
            <input
              type="url"
              value={templateUrl}
              onChange={(e) => setTemplateUrl(e.target.value)}
              placeholder={t('certificate.create_modal.template_url_placeholder')}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
            {t('certificate.create_modal.cancel')}
          </Button>
          <Button onClick={handleCreate} disabled={submitting} className="bg-primary-brand hover:bg-primary-brand-dark text-white gap-2">
            <Plus size={14} />
            {t('certificate.create_modal.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
