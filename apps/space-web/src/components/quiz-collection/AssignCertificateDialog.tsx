import { useState, useEffect } from 'react';
import { Award, Loader2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { useTranslation } from '@shared/components/LocaleProvider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { certificateApi } from '@/lib/api/quiz-collection';
import type { Certificate } from '@/lib/api/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentId: string | null;
  onConfirm: (certId: string | null) => Promise<void> | void;
}

export function AssignCertificateDialog({ open, onOpenChange, currentId, onConfirm }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(currentId);
  const [submitting, setSubmitting] = useState(false);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(currentId);
    let cancelled = false;
    setLoadingCertificates(true);
    certificateApi.list()
      .then(certs => { if (!cancelled) setCertificates(certs); })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : t('quizCollection.load_error'));
      })
      .finally(() => { if (!cancelled) setLoadingCertificates(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(selected);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('quizCollection.certificate_modal.title')}</DialogTitle>
        </DialogHeader>
        {loadingCertificates ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : certificates.length === 0 ? (
          <div className="py-6 text-center space-y-3">
            <Award size={32} className="mx-auto text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">{t('quizCollection.certificate_modal.empty_library')}</p>
            <Button
              onClick={() => router.push('/space/quiz-collections/certificates')}
              className="bg-primary-brand hover:bg-primary-brand-dark text-white"
            >
              {t('quizCollection.certificate_modal.create_new')}
            </Button>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {certificates.map(c => (
              <Button
                key={c.uid}
                variant="ghost"
                onClick={() => setSelected(c.uid === selected ? null : c.uid)}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  c.uid === selected ? 'bg-primary-brand/10 border border-primary-brand/30' : 'hover:bg-muted/50 border border-transparent'
                }`}
              >
                <Award size={16} className="text-primary-brand shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{c.name}</p>
                  {c.description && <p className="text-[11px] text-muted-foreground truncate">{c.description}</p>}
                </div>
              </Button>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('quizCollection.certificate_modal.cancel')}
          </Button>
          {certificates.length > 0 && (
            <Button onClick={handleConfirm} disabled={submitting} className="bg-primary-brand hover:bg-primary-brand-dark text-white">
              {t('quizCollection.certificate_modal.save')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
