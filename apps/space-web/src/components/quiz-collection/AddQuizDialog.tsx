'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Check, X } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { useTranslation } from '@shared/components/LocaleProvider';
import type { Quiz } from '@/lib/api/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizzes: Quiz[];
  existingQuizIds: string[];
  onConfirm: (quizIds: string[]) => Promise<void> | void;
}

export function AddQuizDialog({ open, onOpenChange, quizzes, existingQuizIds, onConfirm }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setSelected(new Set());
    }
  }, [open]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase().trim();
    return quizzes.filter(q =>
      !existingQuizIds.includes(q.uid) &&
      (s === '' || q.title.toLowerCase().includes(s))
    );
  }, [quizzes, existingQuizIds, search]);

  const toggle = (uid: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      await onConfirm(Array.from(selected));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('quizCollection.add_quiz_modal.title')}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('quizCollection.add_quiz_modal.search_placeholder')}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm"
          />
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 -mx-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{t('quizCollection.add_quiz_modal.empty_library')}</p>
          ) : (
            <div className="space-y-1 px-1">
              {filtered.map(q => {
                const isSelected = selected.has(q.uid);
                return (
                  <Button
                    key={q.uid}
                    onClick={() => toggle(q.uid)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      isSelected ? 'bg-primary-brand/10 border border-primary-brand/30' : 'hover:bg-muted/50 border border-transparent'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-primary-brand border-primary-brand' : 'border-border'
                    }`}>
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{q.title}</p>
                      <p className="text-[11px] text-muted-foreground">{q.questions_count} q</p>
                    </div>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
        <DialogFooter>
          <span className="text-xs font-bold text-muted-foreground mr-auto">
            {t('quizCollection.add_quiz_modal.selected_count', undefined, { count: selected.size })}
          </span>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('quizCollection.add_quiz_modal.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={selected.size === 0 || submitting} className="bg-primary-brand hover:bg-primary-brand-dark text-white">
            {t('quizCollection.add_quiz_modal.add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
