'use client';

import * as React from 'react';
import { Button } from '../ui/button';
import { useTranslation } from '@shared/components/LocaleProvider';
import { CalendarEvent, CALENDAR_TYPE_COLORS } from '@shared/lib/api/calendar';
import { SHIFTS, getShiftForDate } from '@shared/lib/calendar/shifts';
import { cn } from '@shared/lib/utils';
import { getColorDot } from './EventTypeBadge';

interface ShiftWeekGridProps {
  weekDate: Date;
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
  onShiftCellClick?: (date: Date, shiftId: 1 | 2 | 3 | 4) => void;
  locale?: 'vi' | 'en';
  readOnly?: boolean;
  maxEventsPerCell?: number;
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(hour: number, minute: number, locale: 'vi' | 'en'): string {
  const ref = new Date(2000, 0, 1, hour, minute, 0, 0);
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(ref);
}

function formatEventTime(iso: string, locale: 'vi' | 'en'): string {
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function ShiftWeekGrid({
  weekDate,
  events,
  onSelectEvent,
  onShiftCellClick,
  locale = 'vi',
  readOnly = false,
  maxEventsPerCell = 99,
}: ShiftWeekGridProps) {
  const { t } = useTranslation();
  const start = startOfWeek(weekDate);
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) =>
    new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
  );

  const grid: CalendarEvent[][][] = Array.from({ length: 4 }, () =>
    Array.from({ length: 7 }, () => [] as CalendarEvent[])
  );
  const outsideShift: CalendarEvent[][] = Array.from({ length: 7 }, () => [] as CalendarEvent[]);

  days.forEach((d, di) => {
    SHIFTS.forEach((s, si) => {
      const cellEvents = events
        .filter((e) => {
          const startDate = new Date(e.start_time);
          if (!isSameDay(startDate, d)) return false;
          const matchedShift = getShiftForDate(startDate);
          return matchedShift?.id === s.id;
        })
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      grid[si][di] = cellEvents;
    });
    outsideShift[di] = events
      .filter((e) => {
        const startDate = new Date(e.start_time);
        if (!isSameDay(startDate, d)) return false;
        return getShiftForDate(startDate) === null;
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] border-b border-slate-200 bg-slate-50">
        <div className="py-2.5 text-center text-[10.5px] font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200">
          {t('calendar.labels.shift_col', 'Ca')}
        </div>
        {days.map((d, i) => {
          const isToday = isSameDay(d, today);
          return (
            <div
              key={i}
              className="py-2.5 text-center border-r last:border-r-0 border-slate-200"
            >
              <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                {t(`calendar.days.${DAY_KEYS[i]}`)}
              </div>
              <div
                className={cn(
                  'mt-1 inline-flex items-center justify-center w-7 h-7 rounded-md text-[13px] font-semibold',
                  isToday ? 'bg-indigo-600 text-white' : 'text-slate-900'
                )}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))]">
        {SHIFTS.map((shift, si) => (
          <React.Fragment key={shift.id}>
            <div className="px-2 py-3 text-center border-r border-b border-slate-200 bg-slate-50/40 flex flex-col items-center justify-center min-h-[88px]">
              <div className="text-[11.5px] font-bold text-slate-700">
                {t(`calendar.shifts.ca_${shift.id}`)}
              </div>
              <div className="text-[10px] text-slate-500 tabular-nums mt-0.5">
                {formatTime(shift.startHour, shift.startMinute, locale)} – {formatTime(shift.endHour, shift.endMinute, locale)}
              </div>
            </div>
            {days.map((d, di) => {
              const evs = grid[si][di];
              const visible = evs.slice(0, maxEventsPerCell);
              const extra = evs.length - visible.length;
              return (
                <Button
                  type="button"
                  key={`${si}-${di}`}
                  disabled={evs.length === 0 || readOnly}
                  onClick={() => {
                    if (readOnly) return;
                    if (evs.length > 0 && onSelectEvent) onSelectEvent(evs[0]);
                    else if (evs.length === 0 && onShiftCellClick) onShiftCellClick(d, shift.id);
                  }}
                  className={cn(
                    'p-1.5 border-r border-b border-slate-200 min-h-[88px] text-left transition-colors space-y-1',
                    evs.length > 0 && 'cursor-pointer',
                    evs.length === 0 && !readOnly && 'hover:bg-indigo-50/50 cursor-pointer',
                    evs.length === 0 && readOnly && 'cursor-default'
                  )}
                  title={evs.map((e) => e.title).join('\n')}
                >
                  {visible.map((e) => {
                    const color = e.color ?? CALENDAR_TYPE_COLORS[e.type] ?? 'slate';
                    return (
                      <div
                        key={e.uid}
                        className={cn(
                          'w-full px-1.5 py-1 rounded text-white text-[10px] font-semibold leading-tight overflow-hidden',
                          getColorDot(color)
                        )}
                        title={e.title}
                      >
                        <div className="truncate">{e.title}</div>
                        <div className="text-[9px] opacity-80 tabular-nums">
                          {formatEventTime(e.start_time, locale)}
                        </div>
                      </div>
                    );
                  })}
                  {extra > 0 && (
                    <div className="text-[9.5px] text-slate-500 font-semibold px-1">
                      {t('calendar.labels.more', '+{{count}} more', { count: extra })}
                    </div>
                  )}
                </Button>
              );
            })}
          </React.Fragment>
        ))}

        <div className="px-2 py-2 text-center border-r border-slate-200 bg-slate-50/40 flex flex-col items-center justify-center min-h-[72px]">
          <div className="text-[10.5px] font-bold text-slate-700">
            {t('calendar.labels.outside_shift', 'Ngoài ca')}
          </div>
          <div className="text-[9.5px] text-slate-500 mt-0.5">
            {t('calendar.labels.outside_shift_hint', 'Giờ tự do')}
          </div>
        </div>
        {days.map((d, di) => {
          const evs = outsideShift[di];
          return (
            <Button
              type="button"
              key={`outside-${di}`}
              disabled={evs.length === 0 || readOnly}
              onClick={() => {
                if (readOnly || evs.length === 0 || !onSelectEvent) return;
                onSelectEvent(evs[0]);
              }}
              className={cn(
                'p-1 border-r last:border-r-0 border-slate-200 min-h-[72px] text-left transition-colors space-y-1',
                evs.length > 0 ? 'cursor-pointer' : 'cursor-default',
                evs.length > 0 && !readOnly && 'hover:bg-amber-50/50'
              )}
            >
              {evs.length === 0 ? (
                <div className="text-[9.5px] text-slate-300 italic">—</div>
              ) : (
                evs.map((e) => {
                  const color = e.color ?? CALENDAR_TYPE_COLORS[e.type] ?? 'slate';
                  return (
                    <div
                      key={e.uid}
                      className={cn(
                        'w-full p-1 rounded text-white text-[10px] font-semibold truncate',
                        getColorDot(color)
                      )}
                      title={e.title}
                    >
                      <span className="opacity-80 mr-1">{formatEventTime(e.start_time, locale)}</span>
                      <span className="truncate">{e.title}</span>
                    </div>
                  );
                })
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
