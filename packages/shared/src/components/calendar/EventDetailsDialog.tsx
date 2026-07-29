import * as React from 'react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { CalendarEvent, CALENDAR_TYPE_COLORS } from '@shared/lib/api/calendar';
import { cn } from '@shared/lib/utils';
import { Clock, MapPin, CalendarOff } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
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

const COLOR_BAR: Record<string, string> = {
  indigo: 'bg-indigo-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  slate: 'bg-slate-500',
};

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
  const colorBar = COLOR_BAR[color] ?? COLOR_BAR.slate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className={cn('h-1.5 w-full', colorBar)} />

        <DialogHeader className="px-6 pt-4 pb-4 border-b">
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <EventTypeBadge type={event.type} color={color} />

          <div className="space-y-3 text-sm text-foreground">
            <div className="flex items-start gap-2.5">
              <Clock size={15} className="text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div>{formatDateTime(event.start_time, locale)}</div>
                <div className="text-muted-foreground text-xs">
                  → {new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(event.end_time))}
                </div>
              </div>
            </div>
            {event.classroom_name && (
              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="text-muted-foreground mt-0.5 shrink-0" />
                <div>{event.classroom_name}</div>
              </div>
            )}
          </div>

          {event.description && (
            <div className="rounded-lg bg-muted/50 border p-3 text-xs text-muted-foreground whitespace-pre-line">
              {event.description}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {showLeaveRequest && onRequestLeave && event.classroom_id && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onRequestLeave(event);
                  onOpenChange(false);
                }}
                className="w-full border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
              >
                <CalendarOff size={15} className="mr-1.5" />
                {t('calendar.event.request_leave', 'Xin nghỉ buổi này')}
              </Button>
            )}
            <Button type="button" onClick={() => onOpenChange(false)} className="w-full">
              {t('calendar.dialog.close', 'Close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
