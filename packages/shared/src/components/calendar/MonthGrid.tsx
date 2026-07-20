'use client';

import * as React from 'react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { CalendarEvent, CALENDAR_TYPE_COLORS } from '@shared/lib/api/calendar';
import { cn } from '@shared/lib/utils';
import { getColorDot } from './EventTypeBadge';

interface MonthGridProps {
  monthDate: Date;
  events: CalendarEvent[];
  onSelectDate?: (date: Date) => void;
  onSelectEvent?: (event: CalendarEvent) => void;
  selectedDate?: Date;
  locale?: 'vi' | 'en';
  emptyLabel?: string;
  maxPerCell?: number;
  readOnly?: boolean;
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((e) => {
    const start = new Date(e.start_time);
    return isSameDay(start, day);
  });
}

export function MonthGrid({
  monthDate,
  events,
  onSelectDate,
  onSelectEvent,
  selectedDate,
  locale = 'vi',
  emptyLabel,
  maxPerCell = 2,
  readOnly = false,
}: MonthGridProps) {
  const { t } = useTranslation();
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = startOfDay(new Date());

  const cells: Array<{ day: number; date: Date; current: boolean }> = [];
  const prevMonth = new Date(year, month, 0);
  const prevDays = prevMonth.getDate();
  for (let i = firstDay - 1; i >= 0; i -= 1) {
    cells.push({ day: prevDays - i, date: new Date(year, month - 1, prevDays - i), current: false });
  }
  for (let d = 1; d <= totalDays; d += 1) {
    cells.push({ day: d, date: new Date(year, month, d), current: true });
  }
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let d = 1; d <= remaining; d += 1) {
    cells.push({ day: d, date: new Date(year, month + 1, d), current: false });
  }

  const monthName = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(monthDate);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <span className="text-[15px] font-bold text-slate-900 capitalize">{monthName}</span>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-200">
        {DAY_KEYS.map((key, i) => (
          <div
            key={i}
            className="py-2.5 text-center text-[10.5px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50"
          >
            {t(`calendar.days.${key}`)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          const isToday = isSameDay(cell.date, today);
          const isSelected = selectedDate ? isSameDay(cell.date, selectedDate) : false;
          const dayEvents = cell.current ? getEventsForDay(events, cell.date) : [];
          return (
            <div
              key={i}
              className={cn(
                'min-h-[96px] sm:min-h-[110px] p-1.5 sm:p-2 border-r border-b border-slate-200 transition-colors',
                !cell.current && 'bg-slate-50/60',
                cell.current && 'hover:bg-slate-50 cursor-pointer',
                i % 7 === 6 && 'border-r-0'
              )}
              onClick={() => {
                if (!cell.current || readOnly) return;
                onSelectDate?.(cell.date);
              }}
            >
              {cell.current && (
                <>
                  <div className="flex justify-end mb-1">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center text-[11.5px] font-semibold tabular-nums w-6 h-6 rounded-md',
                        isToday
                          ? 'bg-indigo-600 text-white'
                          : isSelected
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'text-slate-700'
                      )}
                    >
                      {cell.day}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, maxPerCell).map((e) => {
                      const color = e.color ?? CALENDAR_TYPE_COLORS[e.type] ?? 'slate';
                      return (
                        <button
                          type="button"
                          key={e.uid}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            onSelectEvent?.(e);
                          }}
                          className={cn(
                            'w-full text-left px-1.5 py-0.5 text-[9.5px] font-semibold text-white rounded truncate',
                            getColorDot(color)
                          )}
                          title={e.title}
                        >
                          {e.title}
                        </button>
                      );
                    })}
                    {dayEvents.length > maxPerCell && (
                      <div className="text-[9px] text-slate-500 font-semibold px-1">
                        {t('calendar.labels.more', '+{{count}} more', { count: dayEvents.length - maxPerCell })}
                      </div>
                    )}
                    {dayEvents.length === 0 && emptyLabel && i % 14 === 0 && (
                      <div className="text-[9px] text-slate-300 italic px-1">{emptyLabel}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
