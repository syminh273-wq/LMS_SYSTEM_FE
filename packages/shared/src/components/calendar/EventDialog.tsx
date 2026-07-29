'use client';

import * as React from 'react';
import { Button } from '../ui/button';
import { useEffect, useState } from 'react';
import { useTranslation } from '@shared/components/LocaleProvider';
import {
  CalendarEvent,
  CalendarEventType,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
} from '@shared/lib/api/calendar';
import {
  applyShiftToDate,
  getShiftForDate,
  getShiftById,
} from '@shared/lib/calendar/shifts';
import { X, Loader2 } from 'lucide-react';
import { Input } from '@shared/components/ui/input';
import { Textarea } from '@shared/components/ui/textarea';
import { Label } from '@shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { ShiftPicker } from './ShiftPicker';

interface ClassroomOption {
  uid: string;
  name: string;
}

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: CalendarEvent | null;
  classroomOptions?: ClassroomOption[];
  lockedClassroom?: { uid: string; name?: string };
  onSubmit: (payload: CreateCalendarEventRequest | UpdateCalendarEventRequest) => Promise<void>;
  onDelete?: () => Promise<void>;
  saving?: boolean;
  deleting?: boolean;
  allowClassroomSelect?: boolean;
  titleKey?: string;
}

const TYPES: CalendarEventType[] = ['class', 'exam', 'deadline', 'study_session'];

function toLocalInput(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string {
  return new Date(value).toISOString();
}

export function EventDialog({
  open,
  onOpenChange,
  initial,
  classroomOptions = [],
  lockedClassroom,
  onSubmit,
  onDelete,
  saving = false,
  deleting = false,
  allowClassroomSelect = true,
  titleKey = 'title_create',
}: EventDialogProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(initial);
  const [type, setType] = useState<CalendarEventType>('class');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [classroomId, setClassroomId] = useState<string>('');
  const [error, setError] = useState('');
  const [shiftId, setShiftId] = useState<1 | 2 | 3 | 4 | ''>('');
  const [userPickedShift, setUserPickedShift] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType((initial?.type as CalendarEventType) ?? 'class');
    setTitle(initial?.title ?? '');
    setDescription(initial?.description ?? '');
    const initialStart = toLocalInput(initial?.start_time);
    const initialEnd = toLocalInput(initial?.end_time);
    setStartTime(initialStart);
    setEndTime(initialEnd);
    setClassroomId(initial?.classroom_id ?? '');
    setError('');
    if (initial?.start_time) {
      const matched = getShiftForDate(new Date(initial.start_time));
      setShiftId(matched?.id ?? '');
    } else {
      setShiftId('');
    }
    setUserPickedShift(false);
  }, [open, initial]);

  const handleShiftChange = (id: 1 | 2 | 3 | 4 | '') => {
    setShiftId(id);
    setUserPickedShift(true);
    if (id === '') return;
    const shift = getShiftById(id);
    if (!shift) return;
    const baseDate = startTime ? new Date(startTime) : new Date();
    setStartTime(toLocalInput(applyShiftToDate(baseDate, shift, 'start').toISOString()));
    setEndTime(toLocalInput(applyShiftToDate(baseDate, shift, 'end').toISOString()));
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    if (!userPickedShift && value) {
      const matched = getShiftForDate(new Date(value));
      setShiftId(matched?.id ?? '');
    }
  };

  const effectiveClassroomId = lockedClassroom?.uid ?? classroomId;
  const showClassroomSelect = !lockedClassroom && allowClassroomSelect;

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError(t('calendar.dialog.error_title_required', 'Please enter a title.'));
      return;
    }
    if (!startTime || !endTime) {
      setError(t('calendar.dialog.error_time_required', 'Please pick a time.'));
      return;
    }
    if (new Date(endTime) <= new Date(startTime)) {
      setError(t('calendar.dialog.error_end_before_start', 'End time must be after start time.'));
      return;
    }

    const payload: CreateCalendarEventRequest = {
      type,
      title: title.trim(),
      description: description.trim(),
      start_time: fromLocalInput(startTime),
      end_time: fromLocalInput(endTime),
      classroom_id: effectiveClassroomId || null,
    };
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('calendar.dialog.error_generic', 'Something went wrong.'));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-fade-in"
      onClick={() => !saving && !deleting && onOpenChange(false)}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            {t(`calendar.dialog.${titleKey}`, isEdit ? 'Edit event' : 'Create event')}
          </h2>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving || deleting}
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

          <div>
            <Label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              {t('calendar.dialog.field_title', 'Title')} <span className="text-rose-500">*</span>
            </Label>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Buổi học chương 3..."
              className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-[13.5px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                {t('calendar.dialog.field_type', 'Type')}
              </Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as CalendarEventType)}
              >
                <SelectTrigger className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-[13.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((tp) => (
                    <SelectItem key={tp} value={tp}>
                      {t(`calendar.types.${tp}`, tp)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {lockedClassroom ? (
              <div>
                <Label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                  {t('calendar.dialog.field_classroom', 'Classroom')}
                </Label>
                <div className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 inline-flex items-center text-[13px] text-slate-700 font-medium">
                  <span className="truncate">
                    {lockedClassroom.name ?? lockedClassroom.uid}
                  </span>
                </div>
              </div>
            ) : showClassroomSelect ? (
              <div>
                <Label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                  {t('calendar.dialog.field_classroom', 'Classroom')}
                </Label>
                <Select
                  value={classroomId || 'placeholder-no-classroom'}
                  onValueChange={(v) => setClassroomId(v === 'placeholder-no-classroom' ? '' : v)}
                >
                  <SelectTrigger className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-[13.5px]">
                    <SelectValue placeholder={t('calendar.dialog.no_classroom', 'No classroom')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder-no-classroom">{t('calendar.dialog.no_classroom', 'No classroom')}</SelectItem>
                    {classroomOptions.map((c) => (
                      <SelectItem key={c.uid} value={c.uid}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <div>
            <Label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              {t('calendar.dialog.field_shift', 'Ca học')}
            </Label>
            <ShiftPicker value={shiftId} onChange={handleShiftChange} optional />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                {t('calendar.dialog.field_start', 'Start')} <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-[13.5px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div>
              <Label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
                {t('calendar.dialog.field_end', 'End')} <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-[13.5px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <Label className="block text-[12px] font-semibold text-slate-700 mb-1.5">
              {t('calendar.dialog.field_description', 'Description')}
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <div>
              {onDelete && isEdit && (
                <Button
                  type="button"
                  onClick={onDelete}
                  disabled={saving || deleting}
                  className="h-10 px-3 rounded-lg text-rose-600 hover:bg-rose-50 text-[13px] font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {deleting && <Loader2 size={14} className="animate-spin" />}
                  {t('calendar.labels.delete_event', 'Delete')}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={saving || deleting}
                className="h-10 px-4 rounded-lg text-slate-700 hover:bg-slate-100 text-[13px] font-semibold"
              >
                {t('calendar.dialog.cancel', 'Cancel')}
              </Button>
              <Button
                type="submit"
                disabled={saving || deleting}
                className="h-10 px-4 rounded-lg bg-indigo-600 text-white text-[13px] font-semibold hover:bg-indigo-700 inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {t('calendar.dialog.save', 'Save')}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
