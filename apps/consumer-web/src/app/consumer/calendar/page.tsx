'use client';

import * as React from 'react';
import { Button } from '@shared/components/ui/button';
import { useCallback, useState } from 'react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { consumerCalendarApi } from '@/lib/api';
import { CalendarEvent } from '@shared/lib/api/calendar';
import {
  EventDetailsDialog,
  MonthGrid,
  ShiftWeekGrid,
  UpcomingList,
  ViewSwitcher,
  useCalendarState,
} from '@shared/components/calendar';
import { CalendarDays, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function ConsumerCalendarPage() {
  const { t, locale } = useTranslation();
  const [viewing, setViewing] = useState<CalendarEvent | null>(null);

  const fetchEvents = useCallback(async (params: { startDate?: string; endDate?: string }) => {
    return consumerCalendarApi.list({
      startDate: params.startDate,
      endDate: params.endDate,
    });
  }, []);

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
  } = useCalendarState({ fetchEvents });

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold mb-2">
            <CalendarDays size={11} />
            {t('calendar.labels.title', 'Academic Calendar')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t('calendar.labels.title', 'Academic Calendar')}
          </h1>
          <p className="text-slate-600 text-[14px] mt-1">
            {t('calendar.labels.subtitle', 'Manage your study schedule and upcoming deadlines.')}
          </p>
        </div>

        <ViewSwitcher value={view} onChange={setView} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden h-10">
            <Button
              type="button"
              onClick={goPrev}
              className="h-full px-2.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft size={15} />
            </Button>
            <div className="h-5 w-px bg-slate-200" />
            <Button
              type="button"
              onClick={goNext}
              className="h-full px-2.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
              aria-label="Next"
            >
              <ChevronRight size={15} />
            </Button>
          </div>
          <Button
            type="button"
            onClick={goToday}
            className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 text-[12.5px] font-semibold hover:bg-slate-50"
          >
            {locale === 'vi' ? 'Hôm nay' : 'Today'}
          </Button>
          <span className="text-[15px] font-bold text-slate-900 capitalize ml-2">{headerLabel}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-3">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
              {error}
            </div>
          )}

          <div className={cn('relative')}>
            {loading && (
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-white/90 px-2 py-1 rounded-md border border-slate-200 text-[11px] text-slate-500">
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
        </div>

        <div className="space-y-4">
          <UpcomingList
            events={events}
            locale={locale}
            loading={loading}
            errorMessage={error ?? undefined}
            onSelectEvent={setViewing}
          />
        </div>
      </div>

      <EventDetailsDialog
        open={Boolean(viewing)}
        event={viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        locale={locale}
      />
    </div>
  );
}
