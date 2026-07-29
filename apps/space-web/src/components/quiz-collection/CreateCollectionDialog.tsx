'use client';

import * as React from 'react';
import { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@shared/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
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
  const [isCertificateCollection, setIsCertificateCollection] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle('');
    setDescription('');
    setCertificateId('');
    setIsCertificateCollection(false);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error(t('validation.required', undefined, { field: t('quizCollection.create_modal.name_label') }));
      return;
    }
    if (isCertificateCollection && !certificateId) {
      toast.error(t('quizCollection.create_modal.certificate_required'));
      return;
    }
    try {
      setSubmitting(true);
      const c = await quizCollectionApi.create({
        title: title.trim(),
        description: description.trim(),
        certificate_id: isCertificateCollection ? certificateId : null,
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
            <Label className="text-xs font-bold text-foreground block mb-1.5">
              {t('quizCollection.create_modal.name_label')}
            </Label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('quizCollection.create_modal.name_placeholder')}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              autoFocus
            />
          </div>
          <div>
            <Label className="text-xs font-bold text-foreground block mb-1.5">
              {t('quizCollection.create_modal.description_label')}
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('quizCollection.create_modal.description_placeholder')}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </div>
          <Label className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-muted/30 cursor-pointer">
            <Input
              type="checkbox"
              checked={isCertificateCollection}
              onChange={(e) => setIsCertificateCollection(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-amber-500"
            />
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">
                {t('quizCollection.create_modal.cert_collection_label')}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t('quizCollection.create_modal.cert_collection_hint')}
              </p>
            </div>
          </Label>
          {isCertificateCollection && (
            <div>
              <Label className="text-xs font-bold text-foreground block mb-1.5">
                {t('quizCollection.create_modal.certificate_label')}
                <span className="text-rose-500 ml-0.5">*</span>
              </Label>
              {certificates.length === 0 ? (
                <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-800">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold leading-snug">
                    {t('quizCollection.create_modal.no_certificates_available')}
                  </p>
                </div>
              ) : (
                <Select
                  value={certificateId || 'placeholder-cert'}
                  onValueChange={(v) => setCertificateId(v === 'placeholder-cert' ? '' : v)}
                >
                  <SelectTrigger className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm h-auto">
                    <SelectValue placeholder={t('quizCollection.create_modal.certificate_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder-cert">{t('quizCollection.create_modal.certificate_placeholder')}</SelectItem>
                    {certificates.map(c => (
                      <SelectItem key={c.uid} value={c.uid}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
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
