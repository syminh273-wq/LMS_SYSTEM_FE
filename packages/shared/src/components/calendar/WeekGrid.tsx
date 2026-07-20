'use client';

import * as React from 'react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { CalendarEvent, CALENDAR_TYPE_COLORS } from '@shared/lib/api/calendar';
import { cn } from '@shared/lib/utils';
import { getColorDot } from './EventTypeBadge';

interface WeekGridProps {
  weekDate: Date;
  events: CalendarEvent[];
  onSelectEvent?: (event: CalendarEvent) => void;
  locale?: 'vi' | 'en';
  readOnly?: boolean;
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

export function WeekGrid({ weekDate, events, onSelectEvent, locale = 'vi', readOnly = false }: WeekGridProps) {
  const { t } = useTranslation();
  const start = startOfWeek(weekDate);
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {days.map((d, i) => {
          const isToday = isSameDay(d, today);
          return (
            <div key={i} className="py-2.5 text-center border-r last:border-r-0 border-slate-200">
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

      <div className="grid grid-cols-7 min-h-[400px]">
        {days.map((d, i) => {
          const dayEvents = events
            .filter((e) => isSameDay(new Date(e.start_time), d))
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

          return (
            <div
              key={i}
              className="p-2 border-r last:border-r-0 border-slate-200 min-h-[400px] space-y-1.5"
            >
              {dayEvents.length === 0 ? (
                <div className="text-[10.5px] text-slate-300 italic">—</div>
              ) : (
                dayEvents.map((e) => {
                  const color = e.color ?? CALENDAR_TYPE_COLORS[e.type] ?? 'slate';
                  const start = new Date(e.start_time);
                  const time = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(start);
                  return (
                    <button
                      type="button"
                      key={e.uid}
                      onClick={() => !readOnly && onSelectEvent?.(e)}
                      className={cn(
                        'w-full text-left p-2 rounded-md text-white text-[11.5px] font-semibold truncate',
                        getColorDot(color)
                      )}
                      title={e.title}
                    >
                      <div className="opacity-80">{time}</div>
                      <div className="truncate">{e.title}</div>
                    </button>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
