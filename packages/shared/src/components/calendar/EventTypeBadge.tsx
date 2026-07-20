'use client';

import { CalendarEventType, CALENDAR_TYPE_COLORS } from '@shared/lib/api/calendar';
import { useTranslation } from '@shared/components/LocaleProvider';
import { cn } from '@shared/lib/utils';

const COLOR_BG: Record<string, string> = {
  indigo: 'bg-indigo-500',
  rose: 'bg-rose-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  slate: 'bg-slate-500',
};

const COLOR_BG_SOFT: Record<string, string> = {
  indigo: 'bg-indigo-100 text-indigo-700',
  rose: 'bg-rose-100 text-rose-700',
  amber: 'bg-amber-100 text-amber-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  slate: 'bg-slate-100 text-slate-700',
};

export function getColorDot(color: string | undefined | null): string {
  return COLOR_BG[color ?? 'slate'] ?? COLOR_BG.slate;
}

interface EventTypeBadgeProps {
  type: CalendarEventType | string;
  color?: string;
  className?: string;
}

export function EventTypeBadge({ type, color, className }: EventTypeBadgeProps) {
  const { t } = useTranslation();
  const resolved = color ?? CALENDAR_TYPE_COLORS[type as CalendarEventType] ?? 'slate';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-semibold uppercase tracking-wider',
        COLOR_BG_SOFT[resolved] ?? COLOR_BG_SOFT.slate,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', COLOR_BG[resolved] ?? COLOR_BG.slate)} />
      {t(`calendar.types.${type}`, String(type))}
    </span>
  );
}
