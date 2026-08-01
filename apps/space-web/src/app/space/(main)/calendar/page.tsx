'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Plus, Loader2, Calendar as CalendarIcon, Repeat, CalendarPlus } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { calendarApi, classroomApi, type ClassroomProps } from '@/lib/api';
import {
  CalendarEvent,
  CalendarEventType,
  CreateCalendarEventRequest,
} from '@shared/lib/api/calendar';
import { getShiftById } from '@shared/lib/calendar/shifts';
import { summarizeConflicts } from '@shared/lib/calendar/recurrence';
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

export default function SpaceCalendarPage() {
  const { t, locale } = useTranslation();
  const [classrooms, setClassrooms] = useState<ClassroomProps[]>([]);
  const [classroomFilter, setClassroomFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<CalendarEventType | 'all'>('all');
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [viewing, setViewing] = useState<CalendarEvent | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    classroomApi.getClassrooms()
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
    async (params: { startDate?: string; endDate?: string; classroomId?: string }) => {
      const events = await calendarApi.list({
        startDate: params.startDate,
        endDate: params.endDate,
        classroomId: params.classroomId === 'all' || !params.classroomId ? undefined : params.classroomId,
        type: typeFilter === 'all' ? undefined : typeFilter,
      });
      return events;
    },
    [typeFilter]
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
  } = useCalendarState({ fetchEvents, classroomId: classroomFilter === 'all' ? undefined : classroomFilter });

  const handleCreate = useCallback(() => {
    setEditing(null);
    setDialogOpen(true);
  }, []);

  const handleShiftCellClick = useCallback(
    (date: Date, shiftId: 1 | 2 | 3 | 4) => {
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
    },
    []
  );

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
          await calendarApi.create(payload as CreateCalendarEventRequest);
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
    [editing, refetch, t]
  );

  const [recurringResult, setRecurringResult] = useState<Awaited<ReturnType<typeof calendarApi.createRecurring>> | null>(null);

  const handleRecurringSubmit = useCallback(
    async (payload: Parameters<typeof calendarApi.createRecurring>[0]) => {
      let result: Awaited<ReturnType<typeof calendarApi.createRecurring>>;
      try {
        result = await calendarApi.createRecurring(payload);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t('calendar.recurring.error', 'Không thể tạo lịch.'));
        throw err;
      }

      if (result.created === 0 && result.conflicts.length > 0) {
        toast.error(
          t(
            'calendar.recurring.all_conflict',
            `Không tạo được lịch nào vì trùng ngày/giờ: {{dates}}`,
            { dates: summarizeConflicts(result.conflicts, locale) }
          )
        );
        throw new Error('Toàn bộ lịch bị trùng.');
      }

      setRecurringResult(result);
    },
    [locale, t]
  );

  const handleRecurringClose = useCallback(async () => {
    setRecurringOpen(false);
    if (recurringResult && recurringResult.created > 0) {
      toast.success(
        t(
          'calendar.recurring.success',
          `Created ${recurringResult.created} event(s) and emailed ${recurringResult.created} student(s)`
        )
      );
      setRecurringResult(null);
      await refetch();
    } else {
      setRecurringResult(null);
    }
  }, [recurringResult, refetch, t]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-brand-light text-primary-brand text-[11px] font-semibold mb-2">
            <CalendarIcon size={11} />
            {t('calendar.labels.title', 'Academic Calendar')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {t('calendar.labels.title', 'Academic Calendar')}
          </h1>
          <p className="text-muted-foreground text-[14px] mt-1">
            {t('calendar.labels.subtitle', 'Manage your study schedule and upcoming deadlines.')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={classroomFilter}
            onValueChange={(v) => setClassroomFilter(v)}
          >
            <SelectTrigger className="h-10 min-w-[180px]">
              <SelectValue placeholder={t('calendar.labels.all_classrooms', 'All classrooms')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('calendar.labels.all_classrooms', 'All classrooms')}</SelectItem>
              {classrooms.map((c) => (
                <SelectItem key={c.uid} value={c.uid}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as CalendarEventType | 'all')}
          >
            <SelectTrigger className="h-10 min-w-[140px]">
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
              className="h-10 gap-1.5"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span className="hidden sm:inline">{t('calendar.labels.new_event', 'New event')}</span>
              <span className="sm:hidden">{t('calendar.labels.new_event', 'New')}</span>
            </Button>
            {createMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setCreateMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg z-40 overflow-hidden">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setCreateMenuOpen(false);
                      handleCreate();
                    }}
                    className="w-full flex items-center gap-2 text-left"
                  >
                    <CalendarPlus size={14} className="text-primary-brand" />
                    {t('calendar.recurring.menu_one_day', 'Sự kiện 1 ngày')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setCreateMenuOpen(false);
                      setRecurringOpen(true);
                    }}
                    className="w-full flex items-center gap-2 text-left border-t border-border"
                  >
                    <Repeat size={14} className="text-primary-brand" />
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
          <div className="flex items-center bg-background border border-border rounded-lg overflow-hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={goPrev}
              aria-label="Previous"
            >
              <ChevronLeft size={15} />
            </Button>
            <div className="h-5 w-px bg-border" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={goNext}
              aria-label="Next"
            >
              <ChevronRight size={15} />
            </Button>
          </div>
          <Button
            type="button"
            onClick={goToday}
            variant="outline"
            className="h-10"
          >
            {locale === 'vi' ? 'Hôm nay' : 'Today'}
          </Button>
          <span className="text-[15px] font-bold text-foreground capitalize ml-2">{headerLabel}</span>
        </div>

        <ViewSwitcher value={view} onChange={setView} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-3">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
              {error}
            </div>
          )}

          <div className="relative">
            {loading && (
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-background/90 px-2 py-1 rounded-md border border-border text-[11px] text-muted-foreground">
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
        </div>

        <div className="space-y-4">
          <UpcomingList
            events={events}
            locale={locale}
            loading={loading}
            errorMessage={error ?? undefined}
            onSelectEvent={handleView}
          />
        </div>
      </div>

      <EventDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
          setDialogOpen(o);
        }}
        initial={editing}
        classroomOptions={classrooms}
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
        onSubmit={handleRecurringSubmit}
        saving={saving}
      />
    </div>
  );
}
