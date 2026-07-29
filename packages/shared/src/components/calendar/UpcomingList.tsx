'use client';

import * as React from 'react';
import { Button } from '../ui/button';
import { useTranslation } from '@shared/components/LocaleProvider';
import { CalendarEvent, CALENDAR_TYPE_COLORS } from '@shared/lib/api/calendar';
import { cn } from '@shared/lib/utils';
import { Clock, FileText, Video, Users, BookOpen, Loader2, AlertCircle } from 'lucide-react';

interface UpcomingListProps {
  events: CalendarEvent[];
  locale?: 'vi' | 'en';
  emptyLabel?: string;
  loading?: boolean;
  errorMessage?: string;
  onSelectEvent?: (event: CalendarEvent) => void;
  className?: string;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  class: BookOpen,
  exam: FileText,
  deadline: AlertCircle,
  study_session: Clock,
};

const COLOR_BG: Record<string, string> = {
  indigo: 'bg-indigo-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  slate: 'bg-slate-500',
};

function formatTime(iso: string, locale: 'vi' | 'en') {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function formatRelative(iso: string, locale: 'vi' | 'en') {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const timePart = formatTime(iso, locale);

  if (locale === 'vi') {
    if (diffDays === 0) return `Hôm nay, ${timePart}`;
    if (diffDays === 1) return `Ngày mai, ${timePart}`;
    if (diffDays > 1 && diffDays < 7) return `${diffDays} ngày nữa, ${timePart}`;
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(d) + `, ${timePart}`;
  }
  if (diffDays === 0) return `Today, ${timePart}`;
  if (diffDays === 1) return `Tomorrow, ${timePart}`;
  if (diffDays > 1 && diffDays < 7) return `In ${diffDays} days, ${timePart}`;
  return new Intl.DateTimeFormat('en-US', { day: '2-digit', month: '2-digit' }).format(d) + `, ${timePart}`;
}

export function UpcomingList({
  events,
  locale = 'vi',
  emptyLabel,
  loading = false,
  errorMessage,
  onSelectEvent,
  className,
}: UpcomingListProps) {
  const { t } = useTranslation();
  const now = Date.now();
  const sorted = [...events]
    .filter((e) => new Date(e.end_time).getTime() >= now)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5);

  return (
    <div className={cn('bg-white border border-slate-200 rounded-xl p-4 sm:p-5', className)}>
      <h3 className="text-[14px] font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Clock size={14} className="text-indigo-600" />
        {t('calendar.labels.upcoming', 'Upcoming')}
      </h3>

      {loading ? (
        <div className="flex items-center gap-2 text-[12.5px] text-slate-500 py-6">
          <Loader2 size={14} className="animate-spin" />
          {t('calendar.labels.loading', 'Loading...')}
        </div>
      ) : errorMessage ? (
        <div className="text-[12.5px] text-rose-600 py-2">{errorMessage}</div>
      ) : sorted.length === 0 ? (
        <div className="text-[12.5px] text-slate-400 py-4 text-center">
          {emptyLabel ?? t('calendar.labels.no_events', 'No upcoming events')}
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((event) => {
            const Icon = TYPE_ICON[event.type] ?? Clock;
            const color = event.color ?? CALENDAR_TYPE_COLORS[event.type] ?? 'slate';
            return (
              <Button
                type="button"
                key={event.uid}
                onClick={() => onSelectEvent?.(event)}
                className="w-full text-left group flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
              >
                <div className={cn('w-1 h-10 rounded-full shrink-0', COLOR_BG[color] ?? COLOR_BG.slate)} />
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                    {event.title}
                  </p>
                  <p className="text-[11px] text-slate-500">{formatRelative(event.start_time, locale)}</p>
                  {event.classroom_name && (
                    <p className="text-[10.5px] text-slate-400 truncate">{event.classroom_name}</p>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
