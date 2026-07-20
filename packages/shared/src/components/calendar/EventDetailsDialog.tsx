'use client';

import * as React from 'react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { CalendarEvent, CALENDAR_TYPE_COLORS } from '@shared/lib/api/calendar';
import { cn } from '@shared/lib/utils';
import { Clock, MapPin, X, CalendarOff } from 'lucide-react';
import { EventTypeBadge } from './EventTypeBadge';

interface EventDetailsDialogProps {
  open: boolean;
  event: CalendarEvent | null;
  onOpenChange: (open: boolean) => void;
  locale?: 'vi' | 'en';
  onRequestLeave?: (event: CalendarEvent) => void;
  showLeaveRequest?: boolean;
}

function formatDateTime(iso: string, locale: 'vi' | 'en') {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function EventDetailsDialog({
  open,
  event,
  onOpenChange,
  locale = 'vi',
  onRequestLeave,
  showLeaveRequest = false,
}: EventDetailsDialogProps) {
  const { t } = useTranslation();
  if (!open || !event) return null;

  const color = event.color ?? CALENDAR_TYPE_COLORS[event.type] ?? 'slate';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-fade-in"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={cn('h-1.5 w-full', {
          'bg-indigo-500': color === 'indigo',
          'bg-rose-500': color === 'rose',
          'bg-amber-500': color === 'amber',
          'bg-emerald-500': color === 'emerald',
          'bg-slate-500': color === 'slate',
        })} />

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">{event.title}</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <EventTypeBadge type={event.type} color={color} />

          <div className="space-y-3 text-[13px] text-slate-700">
            <div className="flex items-start gap-2.5">
              <Clock size={15} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <div>{formatDateTime(event.start_time, locale)}</div>
                <div className="text-slate-500 text-[12px]">
                  → {new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(event.end_time))}
                </div>
              </div>
            </div>
            {event.classroom_name && (
              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="text-slate-400 mt-0.5 shrink-0" />
                <div>{event.classroom_name}</div>
              </div>
            )}
          </div>

          {event.description && (
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-[12.5px] text-slate-600 whitespace-pre-line">
              {event.description}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {showLeaveRequest && onRequestLeave && event.classroom_id && (
              <button
                type="button"
                onClick={() => {
                  onRequestLeave(event);
                  onOpenChange(false);
                }}
                className="w-full h-10 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 text-[13px] font-semibold inline-flex items-center justify-center gap-1.5"
              >
                <CalendarOff size={15} />
                {t('calendar.event.request_leave', 'Xin nghỉ buổi này')}
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full h-10 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold"
            >
              {t('calendar.dialog.close', 'Close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
