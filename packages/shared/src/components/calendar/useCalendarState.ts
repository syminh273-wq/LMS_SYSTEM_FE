import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarEvent, ListCalendarEventsParams } from '@shared/lib/api/calendar';

export type CalendarView = 'month' | 'week' | 'day';

export interface UseCalendarStateOptions {
  fetchEvents: (params: ListCalendarEventsParams) => Promise<CalendarEvent[]>;
  classroomId?: string;
  initialDate?: Date;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
  s.setHours(0, 0, 0, 0);
  return s;
}

function endOfWeek(d: Date): Date {
  const day = d.getDay();
  const e = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (6 - day), 23, 59, 59, 999);
  return e;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function useCalendarState({ fetchEvents, classroomId, initialDate }: UseCalendarStateOptions) {
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState<Date>(initialDate ?? new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => {
    if (view === 'month') {
      // pad by a week on each side to catch overflow days from prev/next month
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1, 0, 0, 0, 0);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0, 23, 59, 59, 999);
      return { start, end };
    }
    if (view === 'week') return { start: startOfWeek(currentDate), end: endOfWeek(currentDate) };
    return { start: startOfDay(currentDate), end: endOfDay(currentDate) };
  }, [view, currentDate]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: ListCalendarEventsParams = {
        startDate: range.start.toISOString(),
        endDate: range.end.toISOString(),
      };
      if (classroomId) params.classroomId = classroomId;
      const data = await fetchEvents(params);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [fetchEvents, range.start.getTime(), range.end.getTime(), classroomId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const goPrev = useCallback(() => {
    setCurrentDate((d) => {
      if (view === 'month') return new Date(d.getFullYear(), d.getMonth() - 1, 1);
      if (view === 'week') return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    });
  }, [view]);

  const goNext = useCallback(() => {
    setCurrentDate((d) => {
      if (view === 'month') return new Date(d.getFullYear(), d.getMonth() + 1, 1);
      if (view === 'week') return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    });
  }, [view]);

  const goToday = useCallback(() => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  }, []);

  return {
    view,
    setView,
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    events,
    loading,
    error,
    range,
    goPrev,
    goNext,
    goToday,
    refetch,
  };
}
