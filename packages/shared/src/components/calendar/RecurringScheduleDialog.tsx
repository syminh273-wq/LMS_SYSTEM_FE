'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@shared/components/LocaleProvider';
import {
  CalendarEventType,
  CreateCalendarEventRequest,
} from '@shared/lib/api/calendar';
import { countRecurrenceSlots, DayShiftMap, expandRecurrence, toISODate } from '@shared/lib/calendar/recurrence';
import { X, Loader2 } from 'lucide-react';
import { ShiftMatrixPicker } from './ShiftMatrixPicker';

export interface ClassroomOption {
  uid: string;
  name: string;
}

export interface RecurringSlotPayload {
  start_time: string;
  end_time: string;
}

export interface RecurringSchedulePayload {
  title: string;
  type: CalendarEventType;
  description?: string;
  classroom_id?: string | null;
  start_date: string;
  end_date: string;
  slots: RecurringSlotPayload[];
}

export interface RecurringScheduleSubmitResult {
  created: number;
  failed: number;
  errors: string[];
}

interface RecurringScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classroomOptions?: ClassroomOption[];
  defaultClassroomId?: string;
  onSubmit: (payload: RecurringSchedulePayload) => Promise<void>;
  saving?: boolean;
}

const TYPES: CalendarEventType[] = ['class', 'exam', 'deadline', 'study_session'];

function todayISODate(): string {
  return toISODate(new Date());
}

function plusDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function RecurringScheduleDialog({
  open,
  onOpenChange,
  classroomOptions = [],
  defaultClassroomId,
  onSubmit,
  saving = false,
}: RecurringScheduleDialogProps) {
  const { t } = useTranslation();
  const [type, setType] = useState<CalendarEventType>('class');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<string>(todayISODate());
  const [endDate, setEndDate] = useState<string>(plusDaysISO(28));
  const [dayShifts, setDayShifts] = useState<DayShiftMap>({});
  const [classroomId, setClassroomId] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setType('class');
    setTitle('');
    setDescription('');
    setStartDate(todayISODate());
    setEndDate(plusDaysISO(28));
    setDayShifts({});
    setClassroomId(defaultClassroomId ?? '');
    setError('');
  }, [open, defaultClassroomId]);

  const effectiveClassroomId = classroomId;

  const slotCount = useMemo(
    () => countRecurrenceSlots({ startDate, endDate, dayShifts }),
    [startDate, endDate, dayShifts]
  );

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError(t('calendar.dialog.error_title_required', 'Please enter a title.'));
      return;
    }
    if (!startDate || !endDate) {
      setError(t('calendar.recurring.error_dates_required', 'Please pick start and end dates.'));
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError(t('calendar.recurring.error_end_before_start', 'End date must be on or after start date.'));
      return;
    }
    if (slotCount === 0) {
      setError(t('calendar.recurring.error_no_slots', 'Please select at least one day/shift.'));
      return;
    }

    const slots = expandRecurrence({ startDate, endDate, dayShifts });
    const slotPayload = slots.map((s) => ({
      start_time: s.startISO,
      end_time: s.endISO,
    }));
    try {
      await onSubmit({
        title: title.trim(),
        type,
        description: description.trim(),
        classroom_id: effectiveClassroomId || null,
        start_date: startDate,
        end_date: endDate,
        slots: slotPayload,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('calendar.recurring.error_generic', 'Could not create any events.'));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-fade-in"
      onClick={() => !saving && onOpenChange(false)}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] rounded-xl bg-white shadow-2xl overflow-hidden animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-base font-bold text-slate-900">
            {t('calendar.recurring.title', 'Weekly schedule')}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12.5px] text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              {t('calendar.dialog.field_title', 'Title')} <span className="text-rose-500">*</span>
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('calendar.recurring.title_placeholder', 'e.g. Toán cao cấp - Lớp A')}
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-[13.5px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                {t('calendar.dialog.field_type', 'Type')}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CalendarEventType)}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-[13.5px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                {TYPES.map((tp) => (
                  <option key={tp} value={tp}>
                    {t(`calendar.types.${tp}`, tp)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                {t('calendar.dialog.field_classroom', 'Classroom')}
              </label>
              <select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-[13.5px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">{t('calendar.dialog.no_classroom', 'No classroom')}</option>
                {classroomOptions.map((c) => (
                  <option key={c.uid} value={c.uid}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                {t('calendar.recurring.field_start_date', 'Start date')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-[13.5px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                {t('calendar.recurring.field_end_date', 'End date')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-[13.5px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              {t('calendar.recurring.field_matrix', 'Days × Shifts')}
            </label>
            <ShiftMatrixPicker value={dayShifts} onChange={setDayShifts} />
            <p className="text-[11.5px] text-slate-500 mt-2">
              {t('calendar.recurring.slot_count', 'Will create {{count}} event(s)', { count: slotCount })}
            </p>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              {t('calendar.dialog.field_description', 'Description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none"
            />
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex-shrink-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="h-10 px-4 rounded-lg text-slate-700 hover:bg-slate-100 text-[13px] font-semibold"
          >
            {t('calendar.dialog.cancel', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="h-10 px-4 rounded-lg bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {t('calendar.recurring.create_button', 'Create schedule')}
          </button>
        </div>
      </div>
    </div>
  );
}
