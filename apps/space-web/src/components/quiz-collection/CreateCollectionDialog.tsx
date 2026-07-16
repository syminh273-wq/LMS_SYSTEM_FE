'use client';

import * as React from 'react';
import { useState } from 'react';
import { X, Plus } from 'lucide-react';
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
import { quizCollectionApi } from '@/lib/api/quiz-collection';
import type { Certificate, QuizCollection } from '@/lib/api/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificates: Certificate[];
  onCreated: (c: QuizCollection) => void;
}

export function CreateCollectionDialog({ open, onOpenChange, certificates, onCreated }: Props) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [certificateId, setCertificateId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle('');
    setDescription('');
    setCertificateId('');
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error(t('validation.required', undefined, { field: t('quizCollection.create_modal.name_label') }));
      return;
    }
    try {
      setSubmitting(true);
      const c = await quizCollectionApi.create({
        title: title.trim(),
        description: description.trim(),
        certificate_id: certificateId || null,
      });
      reset();
      onCreated(c);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('quizCollection.save_error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('quizCollection.create_modal.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              {t('quizCollection.create_modal.name_label')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('quizCollection.create_modal.name_placeholder')}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              {t('quizCollection.create_modal.description_label')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('quizCollection.create_modal.description_placeholder')}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              {t('quizCollection.create_modal.certificate_label')}
            </label>
            <select
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            >
              <option value="">{t('quizCollection.create_modal.certificate_none')}</option>
              {certificates.map(c => (
                <option key={c.uid} value={c.uid}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>
            {t('quizCollection.create_modal.cancel')}
          </Button>
          <Button onClick={handleCreate} disabled={submitting} className="bg-primary-brand hover:bg-primary-brand-dark text-white gap-2">
            <Plus size={14} />
            {t('quizCollection.create_modal.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
