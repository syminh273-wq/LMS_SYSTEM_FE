'use client';

import * as React from 'react';
import { Button } from '../ui/button';
import { useTranslation } from '@shared/components/LocaleProvider';
import { SHIFTS } from '@shared/lib/calendar/shifts';
import { cn } from '@shared/lib/utils';

interface ShiftPickerProps {
  value: 1 | 2 | 3 | 4 | '';
  onChange: (id: 1 | 2 | 3 | 4 | '') => void;
  optional?: boolean;
  className?: string;
}

export function ShiftPicker({ value, onChange, optional = false, className }: ShiftPickerProps) {
  const { t } = useTranslation();
  return (
    <div className={cn('grid gap-2', optional ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4', className)}>
      {optional && (
        <Button
          type="button"
          onClick={() => onChange('')}
          className={cn(
            'h-14 rounded-lg border text-left px-2.5 py-1.5 transition-colors',
            value === ''
              ? 'border-slate-400 bg-slate-100 ring-2 ring-slate-200'
              : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
          )}
        >
          <div className={cn('text-[12px] font-bold', value === '' ? 'text-slate-700' : 'text-slate-900')}>
            {t('calendar.shifts.none', 'Không chọn ca')}
          </div>
          <div className="text-[10.5px] text-slate-500 mt-0.5">
            {t('calendar.shifts.none_hint', 'Giờ tự do')}
          </div>
        </Button>
      )}
      {SHIFTS.map((s) => {
        const active = value === s.id;
        return (
          <Button
            type="button"
            key={s.id}
            onClick={() => onChange(s.id)}
            className={cn(
              'h-14 rounded-lg border text-left px-2.5 py-1.5 transition-colors',
              active
                ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100'
                : 'border-slate-300 bg-white hover:border-indigo-300 hover:bg-slate-50'
            )}
          >
            <div className={cn('text-[12px] font-bold', active ? 'text-indigo-700' : 'text-slate-900')}>
              {t(s.labelKey)}
            </div>
            <div className="text-[10.5px] text-slate-500 tabular-nums mt-0.5">
              {String(s.startHour).padStart(2, '0')}:{String(s.startMinute).padStart(2, '0')} – {String(s.endHour).padStart(2, '0')}:{String(s.endMinute).padStart(2, '0')}
            </div>
          </Button>
        );
      })}
    </div>
  );
}
