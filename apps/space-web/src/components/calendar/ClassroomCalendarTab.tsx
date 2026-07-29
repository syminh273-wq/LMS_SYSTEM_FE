'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Plus, Loader2, CalendarDays, Repeat, CalendarPlus } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { calendarApi, classroomApi, type Classroom } from '@/lib/api';
import {
  CalendarEvent,
  CalendarEventType,
  CreateCalendarEventRequest,
} from '@shared/lib/api/calendar';
import { getShiftById } from '@shared/lib/calendar/shifts';
import {
  EventDialog,
  EventDetailsDialog,
  MonthGrid,
  RecurringScheduleDialog,
  ShiftWeekGrid,
  UpcomingList,
  ViewSwitcher,
  useCalendarState,
} from '@shared/components/calendar';
import { Button } from '@shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';

const EMPTY_EVENT: Partial<CalendarEvent> = {
  type: 'class',
  title: '',
  description: '',
};

const TYPE_FILTERS: Array<{ key: CalendarEventType | 'all'; labelKey: string }> = [
  { key: 'all', labelKey: 'calendar.labels.all_classrooms' },
  { key: 'class', labelKey: 'calendar.types.class' },
  { key: 'exam', labelKey: 'calendar.types.exam' },
  { key: 'deadline', labelKey: 'calendar.types.deadline' },
  { key: 'study_session', labelKey: 'calendar.types.study_session' },
];

interface Props {
  classroomUid: string;
  classroomName?: string;
}

export function ClassroomCalendarTab({ classroomUid, classroomName }: Props) {
  const { t, locale } = useTranslation();
  const [typeFilter, setTypeFilter] = useState<CalendarEventType | 'all'>('all');
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [viewing, setViewing] = useState<CalendarEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [recurringResult, setRecurringResult] = useState<{ created: number; failed: number } | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);

  useEffect(() => {
    let cancelled = false;
    classroomApi
      .list()
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : data.results;
        setClassrooms(list);
      })
      .catch(() => {
        if (cancelled) return;
        setClassrooms([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchEvents = useCallback(
    async (params: { startDate?: string; endDate?: string }) => {
      const events = await calendarApi.list({
        startDate: params.startDate,
        endDate: params.endDate,
        classroomId: classroomUid,
        type: typeFilter === 'all' ? undefined : typeFilter,
      });
      return events;
    },
    [classroomUid, typeFilter]
  );

  const {
    view,
    setView,
    currentDate,
    selectedDate,
    setSelectedDate,
    events,
    loading,
    error,
    goPrev,
    goNext,
    goToday,
    refetch,
  } = useCalendarState({ fetchEvents, classroomId: classroomUid });

  const handleCreate = useCallback(() => {
    setEditing(null);
    setDialogOpen(true);
  }, []);

  const handleShiftCellClick = useCallback((date: Date, shiftId: 1 | 2 | 3 | 4) => {
    const shift = getShiftById(shiftId);
    if (!shift) return;
    const start = new Date(date);
    start.setHours(shift.startHour, shift.startMinute, 0, 0);
    const end = new Date(date);
    end.setHours(shift.endHour, shift.endMinute, 0, 0);
    setEditing({
      ...EMPTY_EVENT,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    } as CalendarEvent);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((event: CalendarEvent) => {
    setEditing(event);
    setDialogOpen(true);
  }, []);

  const handleView = useCallback((event: CalendarEvent) => {
    setViewing(event);
  }, []);

  const handleSubmit = useCallback(
    async (payload: CreateCalendarEventRequest | Partial<CreateCalendarEventRequest>) => {
      setSaving(true);
      try {
        if (editing) {
          await calendarApi.update(editing.uid, payload as Partial<CreateCalendarEventRequest>);
          toast.success(t('calendar.actions.update_success', 'Event updated'));
        } else {
          await calendarApi.create({
            ...(payload as CreateCalendarEventRequest),
            classroom_id: classroomUid,
          });
          toast.success(t('calendar.actions.create_success', 'Event created'));
        }
        setDialogOpen(false);
        setEditing(null);
        await refetch();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t('calendar.actions.create_error', 'Save failed'));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [editing, classroomUid, refetch, t]
  );

  const handleDelete = useCallback(async () => {
    if (!editing) return;
    if (!window.confirm(t('calendar.labels.delete_confirm', 'Delete this event?'))) return;
    setDeleting(true);
    try {
      await calendarApi.delete(editing.uid);
      toast.success(t('calendar.actions.delete_success', 'Event deleted'));
      setDialogOpen(false);
      setEditing(null);
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('calendar.actions.delete_error', 'Delete failed'));
    } finally {
      setDeleting(false);
    }
  }, [editing, refetch, t]);

  const handleRecurringSubmit = useCallback(
    async (payload: Parameters<typeof calendarApi.createRecurring>[0]) => {
      const result = await calendarApi.createRecurring(payload);
      setRecurringResult({ created: result.created, failed: result.failed });
    },
    []
  );

  const handleRecurringClose = useCallback(async () => {
    setRecurringOpen(false);
    if (recurringResult && recurringResult.created > 0) {
      toast.success(
        t(
          'calendar.recurring.success',
          `Created ${recurringResult.created} event(s) and emailed students`
        )
      );
      setRecurringResult(null);
      await refetch();
    } else {
      setRecurringResult(null);
    }
  }, [recurringResult, refetch, t]);

  const headerLabel = useMemo(() => {
    const d = currentDate;
    if (view === 'month') {
      return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
        month: 'long',
        year: 'numeric',
      }).format(d);
    }
    if (view === 'week') {
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const fmt = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      return `${fmt.format(start)} – ${fmt.format(end)}`;
    }
    return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(d);
  }, [currentDate, view, locale]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-accent text-primary flex items-center justify-center">
            <CalendarDays size={18} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-900">{t('calendar.labels.title', 'Academic Calendar')}</h3>
            <p className="text-[12px] text-slate-500">
              {classroomName ?? t('calendar.labels.subtitle', 'Classroom events')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as CalendarEventType | 'all')}
          >
            <SelectTrigger className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-[12.5px] font-semibold text-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_FILTERS.map((f) => (
                <SelectItem key={f.key} value={f.key}>
                  {t(f.labelKey, f.key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Button
              onClick={() => setCreateMenuOpen((o) => !o)}
              className="h-9 px-3 rounded-lg bg-indigo-600 text-white text-[12.5px] font-semibold hover:bg-indigo-700 gap-1.5"
            >
              <Plus size={14} strokeWidth={2.5} />
              {t('calendar.labels.new_event', 'New event')}
            </Button>
            {createMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setCreateMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-40 overflow-hidden">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setCreateMenuOpen(false);
                      handleCreate();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <CalendarPlus size={14} className="text-indigo-600" />
                    {t('calendar.recurring.menu_one_day', 'Sự kiện 1 ngày')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setCreateMenuOpen(false);
                      setRecurringOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] font-semibold text-slate-700 hover:bg-slate-50 border-t border-slate-100"
                  >
                    <Repeat size={14} className="text-indigo-600" />
                    {t('calendar.recurring.menu_recurring', 'Thời khóa biểu')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={goPrev}
              className="hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={14} />
            </Button>
            <div className="h-4 w-px bg-slate-200" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={goNext}
              className="hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
          <Button
            type="button"
            onClick={goToday}
            className="h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[12px] font-semibold hover:bg-slate-50"
          >
            {locale === 'vi' ? 'Hôm nay' : 'Today'}
          </Button>
          <span className="text-[14px] font-bold text-slate-900 capitalize ml-2">{headerLabel}</span>
        </div>

        <ViewSwitcher value={view} onChange={setView} />
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 relative">
          {loading && (
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-white/90 px-2 py-1 rounded-md border border-slate-200 text-[11px] text-slate-500">
              <Loader2 size={11} className="animate-spin" />
              {t('calendar.labels.loading', 'Loading...')}
            </div>
          )}
          {view === 'month' && (
            <MonthGrid
              monthDate={currentDate}
              events={events}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onSelectEvent={handleEdit}
              locale={locale}
            />
          )}
          {view === 'week' && (
            <ShiftWeekGrid
              weekDate={currentDate}
              events={events}
              onSelectEvent={handleEdit}
              onShiftCellClick={handleShiftCellClick}
              locale={locale}
            />
          )}
        </div>

        <UpcomingList
          events={events}
          locale={locale}
          loading={loading}
          onSelectEvent={handleView}
        />
      </div>

      <EventDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
          setDialogOpen(o);
        }}
        initial={editing}
        lockedClassroom={{ uid: classroomUid, name: classroomName }}
        onSubmit={handleSubmit}
        onDelete={editing ? handleDelete : undefined}
        saving={saving}
        deleting={deleting}
        titleKey={editing ? 'title_edit' : 'title_create'}
      />

      <EventDetailsDialog
        open={Boolean(viewing)}
        event={viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        locale={locale}
      />

      <RecurringScheduleDialog
        open={recurringOpen}
        onOpenChange={(o) => {
          if (o) {
            setRecurringOpen(true);
          } else {
            void handleRecurringClose();
          }
        }}
        classroomOptions={classrooms}
        defaultClassroomId={classroomUid}
        onSubmit={handleRecurringSubmit}
        saving={saving}
      />
    </div>
  );
}
