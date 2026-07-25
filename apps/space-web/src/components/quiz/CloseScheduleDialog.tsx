'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { X, Calendar, Lock, Unlock, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { quizApi } from '@/lib/api/quiz';
import type { QuizAssignment } from '@/lib/api/types';

interface Props {
  quizUid: string;
  assignment: QuizAssignment;
  onClose: () => void;
  onUpdated: (a: QuizAssignment) => void;
}

function toLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function CloseScheduleDialog({ quizUid, assignment, onClose, onUpdated }: Props) {
  const isClosed = !!assignment.is_closed;
  const [closesAtLocal, setClosesAtLocal] = useState<string>(toLocalInput(assignment.closes_at));
  const [opensAtLocal, setOpensAtLocal] = useState<string>(toLocalInput(assignment.opens_at));
  const [busy, setBusy] = useState(false);

  const handleClose = async () => {
    setBusy(true);
    try {
      const updated = await quizApi.closeAssignment(quizUid, assignment.classroom_id, toIso(closesAtLocal));
      onUpdated(updated);
      toast.success('Đã đóng bài quiz cho lớp này');
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Đóng quiz thất bại');
    } finally {
      setBusy(false);
    }
  };

  const handleReopen = async () => {
    setBusy(true);
    try {
      const updated = await quizApi.reopenAssignment(quizUid, assignment.classroom_id, {
        opens_at: toIso(opensAtLocal),
        closes_at: toIso(closesAtLocal),
      });
      onUpdated(updated);
      toast.success('Đã mở lại bài quiz');
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Mở lại thất bại');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isClosed
              ? <Unlock size={20} className="text-emerald-500" />
              : <Lock size={20} className="text-rose-500" />}
            <h2 className="font-black text-foreground">
              {isClosed ? 'Mở lại bài quiz' : 'Đóng bài quiz'}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl text-muted-foreground">
            <X size={20} />
          </Button>
        </div>

        <div className="p-6 space-y-5">
          {isClosed && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>Bài quiz hiện đang đóng. Học sinh không thể nộp bài và không xem được bảng vàng.</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5">
              <Calendar size={12} /> Thời gian mở (không bắt buộc)
            </label>
            <input
              type="datetime-local"
              value={opensAtLocal}
              onChange={e => setOpensAtLocal(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-brand-light"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-1.5">
              <Calendar size={12} /> Thời gian đóng (không bắt buộc)
            </label>
            <input
              type="datetime-local"
              value={closesAtLocal}
              onChange={e => setClosesAtLocal(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary-brand-light"
            />
            <p className="text-[10px] text-muted-foreground font-medium">
              Để trống nếu muốn mở/đóng vĩnh viễn. Khi đã đến thời gian đóng, hệ thống tự chặn nộp bài.
            </p>
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl font-bold text-xs h-11">
            HỦY
          </Button>
          {isClosed ? (
            <Button
              onClick={() => void handleReopen()}
              disabled={busy}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs h-11 gap-2"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Unlock size={14} />}
              MỞ LẠI
            </Button>
          ) : (
            <Button
              onClick={() => void handleClose()}
              disabled={busy}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs h-11 gap-2"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
              ĐÓNG QUIZ
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
