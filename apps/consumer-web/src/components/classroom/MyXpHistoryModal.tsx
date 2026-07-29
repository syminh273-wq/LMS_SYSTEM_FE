import * as React from 'react';
import { useEffect, useState } from 'react';
import { History as HistoryIcon, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { useTranslation } from '@shared/components/LocaleProvider';
import { rankingApi } from '@/lib/api/ranking';
import type { XpTransaction } from '@/lib/api';
import { XpHistoryList } from '@/components/ranking/XpHistoryList';

export interface MyXpHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroomUid?: string;
  classroomName?: string;
}

export function MyXpHistoryModal({
  open,
  onOpenChange,
  classroomUid,
  classroomName,
}: MyXpHistoryModalProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<XpTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await rankingApi.getMyTransactions({
          limit: 200,
          classroom_id: classroomUid,
        });
        if (!cancelled) setItems(data);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, classroomUid]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] overflow-hidden sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5 text-primary" />
            {t('ranking.history_title', 'Lịch sử XP của tôi')}
          </DialogTitle>
          <DialogDescription>
            {classroomName
              ? `${t('ranking.history_in_classroom', 'Lịch sử cộng điểm trong lớp: ')}${classroomName}`
              : t(
                  'ranking.history_in_classroom',
                  'Lịch sử cộng điểm trong lớp: ',
                )}
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-4 max-h-[60vh] overflow-y-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          ) : (
            <XpHistoryList transactions={items} t={t} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
