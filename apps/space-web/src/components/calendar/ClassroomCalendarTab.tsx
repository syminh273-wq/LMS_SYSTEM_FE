'use client';

import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Plus, Loader2, CalendarDays } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { calendarApi } from '@/lib/api';
import {
  CalendarEvent,
  CalendarEventType,
  CreateCalendarEventRequest,
} from '@shared/lib/api/calendar';
import {
  EventDialog,
  EventDetailsDialog,
  MonthGrid,
  UpcomingList,
  ViewSwitcher,
  WeekGrid,
  useCalendarState,
} from '@shared/components/calendar';
import { Button } from '@shared/components/ui/button';

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
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
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
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CalendarEventType | 'all')}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-[12.5px] font-semibold text-slate-700 outline-none focus:border-indigo-500"
          >
            {TYPE_FILTERS.map((f) => (
              <option key={f.key} value={f.key}>
                {t(f.labelKey, f.key)}
              </option>
            ))}
          </select>
          <Button
            onClick={handleCreate}
            className="h-9 px-3 rounded-lg bg-indigo-600 text-white text-[12.5px] font-semibold hover:bg-indigo-700 gap-1.5"
          >
            <Plus size={14} strokeWidth={2.5} />
            {t('calendar.labels.new_event', 'New event')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={goPrev}
              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <button
              type="button"
              onClick={goNext}
              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <button
            type="button"
            onClick={goToday}
            className="h-9 px-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-[12px] font-semibold hover:bg-slate-50"
          >
            {locale === 'vi' ? 'Hôm nay' : 'Today'}
          </button>
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
            <WeekGrid
              weekDate={currentDate}
              events={events}
              onSelectEvent={handleEdit}
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
    </div>
  );
}
