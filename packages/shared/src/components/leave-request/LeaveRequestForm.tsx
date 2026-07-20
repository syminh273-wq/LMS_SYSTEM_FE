'use client';

import { useEffect, useState } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { cn } from '@shared/lib/utils';
import {
  CreateLeaveRequestInput,
  LeaveRequestEventOption,
} from '@shared/lib/api/leaveRequest';

interface LeaveRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: LeaveRequestEventOption[];
  onSubmit: (input: CreateLeaveRequestInput) => Promise<void>;
  saving?: boolean;
}

function toLocalInput(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}

export function LeaveRequestForm({
  open,
  onOpenChange,
  events,
  onSubmit,
  saving = false,
}: LeaveRequestFormProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'event' | 'range'>('event');
  const [eventId, setEventId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setMode(events.length > 0 ? 'event' : 'range');
    setEventId('');
    setStartDate('');
    setEndDate('');
    setReason('');
    setEvidence(null);
    setError('');
  }, [open, events.length]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!reason.trim()) {
      setError(t('leave_request.errors.reason_required', 'Vui lòng nhập lý do.'));
      return;
    }

    if (mode === 'event') {
      if (!eventId) {
        setError(t('leave_request.errors.event_required', 'Vui lòng chọn sự kiện.'));
        return;
      }
      const ev = events.find((e) => e.uid === eventId);
      if (!ev) {
        setError(t('leave_request.errors.event_not_found', 'Sự kiện không tồn tại.'));
        return;
      }
      try {
        await onSubmit({
          event_id: ev.uid,
          reason: reason.trim(),
          evidence,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : t('leave_request.errors.generic', 'Đã có lỗi xảy ra.'));
      }
      return;
    }

    if (!startDate || !endDate) {
      setError(t('leave_request.errors.range_required', 'Vui lòng chọn thời gian.'));
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError(t('leave_request.errors.end_before_start', 'Thời gian kết thúc phải sau thời gian bắt đầu.'));
      return;
    }

    try {
      await onSubmit({
        event_id: null,
        start_date: fromLocalInput(startDate),
        end_date: fromLocalInput(endDate),
        reason: reason.trim(),
        evidence,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('leave_request.errors.generic', 'Đã có lỗi xảy ra.'));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-fade-in"
      onClick={() => !saving && onOpenChange(false)}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            {t('leave_request.form.title', 'Tạo đơn nghỉ phép')}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] text-rose-700">
              {error}
            </div>
          )}

          <div>
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 w-fit">
              <button
                type="button"
                disabled={events.length === 0}
                onClick={() => setMode('event')}
                className={cn(
                  'px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors disabled:opacity-40',
                  mode === 'event' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {t('leave_request.form.mode_event', 'Theo sự kiện')}
              </button>
              <button
                type="button"
                onClick={() => setMode('range')}
                className={cn(
                  'px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors',
                  mode === 'range' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {t('leave_request.form.mode_range', 'Theo khoảng ngày')}
              </button>
            </div>
          </div>

          {mode === 'event' ? (
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                {t('leave_request.form.field_event', 'Sự kiện')}
              </label>
              {events.length === 0 ? (
                <p className="text-[12.5px] text-slate-500">
                  {t('leave_request.form.no_events', 'Bạn chưa có sự kiện nào để tạo đơn.')}
                </p>
              ) : (
                <select
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-[13.5px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">
                    {t('leave_request.form.select_event', '-- Chọn sự kiện --')}
                  </option>
                  {events.map((ev) => (
                    <option key={ev.uid} value={ev.uid}>
                      {ev.classroom_name ? `${ev.classroom_name} · ${ev.title}` : ev.title} ({toLocalInput(ev.start_time)})
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                  {t('leave_request.form.field_start', 'Bắt đầu')}
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-[13.5px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                  {t('leave_request.form.field_end', 'Kết thúc')}
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-[13.5px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              {t('leave_request.form.field_reason', 'Lý do')}
              <span className="text-rose-500"> *</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={t('leave_request.form.reason_placeholder', 'Vui lòng mô tả lý do nghỉ...')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              {t('leave_request.form.field_evidence', 'Minh chứng (tuỳ chọn)')}
            </label>
            <label className="flex items-center gap-2 h-10 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-[12.5px] text-slate-600 cursor-pointer hover:border-indigo-400">
              <Upload size={14} />
              <span className="truncate">
                {evidence ? evidence.name : t('leave_request.form.upload_hint', 'Chọn ảnh hoặc tài liệu...')}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => setEvidence(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="h-10 px-4 rounded-lg text-slate-700 hover:bg-slate-100 text-[13px] font-semibold"
            >
              {t('leave_request.form.cancel', 'Huỷ')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-4 rounded-lg bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {t('leave_request.form.submit', 'Gửi đơn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
