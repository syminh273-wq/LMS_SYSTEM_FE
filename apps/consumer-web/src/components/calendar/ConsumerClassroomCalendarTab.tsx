'use client';

import * as React from 'react';
import { Button } from '@shared/components/ui/button';
import { useCallback, useState } from 'react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { consumerCalendarApi, consumerLeaveRequestApi } from '@/lib/api';
import { CalendarEvent, CalendarEventType } from '@shared/lib/api/calendar';
import { CreateLeaveRequestInput, LeaveRequestEventOption } from '@shared/lib/api/leaveRequest';
import {
  EventDetailsDialog,
  MonthGrid,
  ShiftWeekGrid,
  UpcomingList,
  ViewSwitcher,
  useCalendarState,
} from '@shared/components/calendar';
import { LeaveRequestForm } from '@shared/components/leave-request';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { CalendarDays, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  classroomUid: string;
  classroomName?: string;
}

const TYPE_FILTERS: Array<{ key: CalendarEventType | 'all'; labelKey: string }> = [
  { key: 'all', labelKey: 'calendar.labels.all_classrooms' },
  { key: 'class', labelKey: 'calendar.types.class' },
  { key: 'exam', labelKey: 'calendar.types.exam' },
  { key: 'deadline', labelKey: 'calendar.types.deadline' },
  { key: 'study_session', labelKey: 'calendar.types.study_session' },
];

export function ConsumerClassroomCalendarTab({ classroomUid, classroomName }: Props) {
  const { t, locale } = useTranslation();
  const [typeFilter, setTypeFilter] = useState<CalendarEventType | 'all'>('all');
  const [viewing, setViewing] = useState<CalendarEvent | null>(null);
  const [leaveEvent, setLeaveEvent] = useState<CalendarEvent | null>(null);
  const [leaveEvents, setLeaveEvents] = useState<LeaveRequestEventOption[]>([]);
  const [leaveSaving, setLeaveSaving] = useState(false);

  const fetchEvents = useCallback(
    async (params: { startDate?: string; endDate?: string }) => {
      return consumerCalendarApi.list({
        startDate: params.startDate,
        endDate: params.endDate,
        classroomId: classroomUid,
        type: typeFilter === 'all' ? undefined : typeFilter,
      });
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
  } = useCalendarState({ fetchEvents, classroomId: classroomUid });

  const openLeaveForEvent = useCallback((ev: CalendarEvent) => {
    setLeaveEvents([
      {
        uid: ev.uid,
        title: ev.title,
        start_time: ev.start_time,
        end_time: ev.end_time,
        classroom_name: ev.classroom_name ?? null,
      },
    ]);
    setLeaveEvent(ev);
  }, []);

  const handleLeaveSubmit = useCallback(
    async (input: CreateLeaveRequestInput) => {
      setLeaveSaving(true);
      try {
        await consumerLeaveRequestApi.create({ ...input, classroom_id: classroomUid });
        toast.success(t('leave_request.actions.create_success', 'Đã gửi đơn nghỉ phép.'));
        setLeaveEvent(null);
        setLeaveEvents([]);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t('leave_request.actions.create_error', 'Gửi đơn thất bại.'));
        throw err;
      } finally {
        setLeaveSaving(false);
      }
    },
    [classroomUid, t]
  );

  const headerLabel = React.useMemo(() => {
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
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <CalendarDays size={18} />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-foreground">{t('calendar.labels.title', 'Academic Calendar')}</h3>
            <p className="text-[12px] text-muted-foreground">
              {classroomName ?? t('calendar.labels.subtitle', 'Classroom events')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as CalendarEventType | 'all')}
          >
            <SelectTrigger className="h-9">
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
          <ViewSwitcher value={view} onChange={setView} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-card border border-border rounded-lg overflow-hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={goPrev}
            aria-label="Previous"
          >
            <ChevronLeft size={14} />
          </Button>
          <div className="h-4 w-px bg-border" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={goNext}
            aria-label="Next"
          >
            <ChevronRight size={14} />
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={goToday}
        >
          {locale === 'vi' ? 'Hôm nay' : 'Today'}
        </Button>
        <span className="text-[14px] font-bold text-foreground capitalize ml-2">{headerLabel}</span>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-[13px] text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 relative">
          {loading && (
            <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-background/90 px-2 py-1 rounded-md border border-border text-[11px] text-muted-foreground">
              <Clock size={11} className="animate-spin" />
              {t('calendar.labels.loading', 'Loading...')}
            </div>
          )}
          {view === 'month' && (
            <MonthGrid
              monthDate={currentDate}
              events={events}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onSelectEvent={setViewing}
              locale={locale}
              readOnly
            />
          )}
          {view === 'week' && (
            <ShiftWeekGrid
              weekDate={currentDate}
              events={events}
              onSelectEvent={setViewing}
              locale={locale}
              readOnly
            />
          )}
        </div>

        <UpcomingList
          events={events}
          locale={locale}
          loading={loading}
          onSelectEvent={setViewing}
        />
      </div>

      <EventDetailsDialog
        open={Boolean(viewing)}
        event={viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        locale={locale}
        showLeaveRequest
        onRequestLeave={openLeaveForEvent}
      />

      <LeaveRequestForm
        open={Boolean(leaveEvent)}
        onOpenChange={(o) => {
          if (!o) {
            setLeaveEvent(null);
            setLeaveEvents([]);
          }
        }}
        events={leaveEvents}
        classroomId={classroomUid}
        onSubmit={handleLeaveSubmit}
        saving={leaveSaving}
      />
    </div>
  );
}
