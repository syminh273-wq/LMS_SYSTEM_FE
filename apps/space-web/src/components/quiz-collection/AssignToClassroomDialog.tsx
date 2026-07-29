'use client';

import { useState, useMemo } from 'react';
import { Users } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { useTranslation } from '@shared/components/LocaleProvider';
import type { Classroom } from '@/lib/api/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classrooms: Classroom[];
  existingIds: string[];
  onConfirm: (classroomId: string) => Promise<void> | void;
}

export function AssignToClassroomDialog({ open, onOpenChange, classrooms, existingIds, onConfirm }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const available = useMemo(
    () => classrooms.filter(c => !existingIds.includes(c.uid)),
    [classrooms, existingIds]
  );

  const handleConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await onConfirm(selected);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('quizCollection.assign_modal.title')}</DialogTitle>
        </DialogHeader>
        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{t('quizCollection.assign_modal.no_classes')}</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {available.map(c => (
              <Button
                key={c.uid}
                onClick={() => setSelected(c.uid === selected ? null : c.uid)}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  c.uid === selected ? 'bg-primary-brand/10 border border-primary-brand/30' : 'hover:bg-muted/50 border border-transparent'
                }`}
              >
                <Users size={16} className="text-primary-brand shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">PID: {c.pid}</p>
                </div>
              </Button>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('quizCollection.assign_modal.cancel')}
          </Button>
          {available.length > 0 && (
            <Button onClick={handleConfirm} disabled={!selected || submitting} className="bg-primary-brand hover:bg-primary-brand-dark text-white">
              {t('quizCollection.assign_modal.assign')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
