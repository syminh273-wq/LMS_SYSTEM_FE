'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { X, Loader2, Check, X as XIcon } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { cn } from '@shared/lib/utils';
import {
  LeaveRequest,
  ProcessLeaveRequestInput,
} from '@shared/lib/api/leaveRequest';
import { LeaveRequestStatusBadge } from './LeaveRequestStatusBadge';
import { Textarea } from '@shared/components/ui/textarea';
import { Label } from '@shared/components/ui/label';

interface ProcessLeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: LeaveRequest | null;
  onSubmit: (input: ProcessLeaveRequestInput) => Promise<void>;
  processing?: boolean;
}

export function ProcessLeaveRequestDialog({
  open,
  onOpenChange,
  request,
  onSubmit,
  processing = false,
}: ProcessLeaveRequestDialogProps) {
  const { t, locale } = useTranslation();
  const [choice, setChoice] = useState<'approved' | 'rejected'>('approved');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  if (!open || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (choice === 'rejected' && !rejectionReason.trim()) {
      setError(t('leave_request.process.reason_required', 'Vui lòng nhập lý do từ chối.'));
      return;
    }
    try {
      await onSubmit({
        status: choice,
        ...(choice === 'rejected' ? { rejection_reason: rejectionReason.trim() } : {}),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('leave_request.errors.generic', 'Đã có lỗi xảy ra.'));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-fade-in"
      onClick={() => !processing && onOpenChange(false)}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            {t('leave_request.process.title', 'Xử lý đơn nghỉ phép')}
          </h2>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={processing}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] text-rose-700">
              {error}
            </div>
          )}

          <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-[12.5px] text-slate-700 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{request.student_name ?? '—'}</span>
              <LeaveRequestStatusBadge status={request.status} />
            </div>
            <div>
              <span className="font-semibold text-slate-600">
                {request.event_id
                  ? t('leave_request.list.event', 'Sự kiện')
                  : t('leave_request.list.range', 'Khoảng thời gian')}
                :
              </span>{' '}
              {request.event_id
                ? request.event_title ?? '—'
                : `${request.start_date ? new Date(request.start_date).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US') : '—'} – ${request.end_date ? new Date(request.end_date).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US') : '—'}`}
            </div>
            <p className="text-slate-700">{request.reason}</p>
            {request.evidence_url && (
              <a
                href={request.evidence_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                {t('leave_request.list.view_evidence', 'Xem minh chứng')}
              </a>
            )}
          </div>

          {request.status === 'pending' ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={() => setChoice('approved')}
                  className={cn(
                    'h-10 rounded-lg border-2 text-[13px] font-semibold inline-flex items-center justify-center gap-1.5',
                    choice === 'approved'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  )}
                >
                  <Check size={14} />
                  {t('leave_request.process.approve', 'Duyệt')}
                </Button>
                <Button
                  type="button"
                  onClick={() => setChoice('rejected')}
                  className={cn(
                    'h-10 rounded-lg border-2 text-[13px] font-semibold inline-flex items-center justify-center gap-1.5',
                    choice === 'rejected'
                      ? 'border-rose-500 bg-rose-50 text-rose-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  )}
                >
                  <XIcon size={14} />
                  {t('leave_request.process.reject', 'Từ chối')}
                </Button>
              </div>

              {choice === 'rejected' && (
                <div>
                  <Label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                    {t('leave_request.process.rejection_label', 'Lý do từ chối')}
                    <span className="text-rose-500"> *</span>
                  </Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  disabled={processing}
                  className="h-10 px-4 rounded-lg text-slate-700 hover:bg-slate-100 text-[13px] font-semibold"
                >
                  {t('leave_request.process.cancel', 'Huỷ')}
                </Button>
                <Button
                  type="submit"
                  disabled={processing}
                  className={cn(
                    'h-10 px-4 rounded-lg text-white text-[13px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-50',
                    choice === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  )}
                >
                  {processing && <Loader2 size={14} className="animate-spin" />}
                  {choice === 'approved'
                    ? t('leave_request.process.submit_approve', 'Duyệt đơn')
                    : t('leave_request.process.submit_reject', 'Từ chối đơn')}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-end">
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-10 px-4 rounded-lg text-slate-700 hover:bg-slate-100 text-[13px] font-semibold"
              >
                {t('leave_request.process.close', 'Đóng')}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
