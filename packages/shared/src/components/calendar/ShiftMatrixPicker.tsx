'use client';

import * as React from 'react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { SHIFTS } from '@shared/lib/calendar/shifts';
import { DayShiftMap } from '@shared/lib/calendar/recurrence';
import { cn } from '@shared/lib/utils';

interface ShiftMatrixPickerProps {
  value: DayShiftMap;
  onChange: (value: DayShiftMap) => void;
  className?: string;
}

const DAY_KEYS: Array<{ dow: 0 | 1 | 2 | 3 | 4 | 5 | 6; key: string }> = [
  { dow: 1, key: 'mon' },
  { dow: 2, key: 'tue' },
  { dow: 3, key: 'wed' },
  { dow: 4, key: 'thu' },
  { dow: 5, key: 'fri' },
  { dow: 6, key: 'sat' },
  { dow: 0, key: 'sun' },
];

export function ShiftMatrixPicker({ value, onChange, className }: ShiftMatrixPickerProps) {
  const { t } = useTranslation();

  const toggle = (dow: 0 | 1 | 2 | 3 | 4 | 5 | 6, shiftId: 1 | 2 | 3 | 4) => {
    const current = value[dow] ?? [];
    const next = current.includes(shiftId)
      ? current.filter((s) => s !== shiftId)
      : [...current, shiftId];
    onChange({ ...value, [dow]: next });
  };

  const isSelected = (dow: 0 | 1 | 2 | 3 | 4 | 5 | 6, shiftId: 1 | 2 | 3 | 4) =>
    (value[dow] ?? []).includes(shiftId);

  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="min-w-[520px]">
        <div className="grid grid-cols-[80px_repeat(7,minmax(0,1fr))] border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 border-r border-b border-slate-200" />
          {DAY_KEYS.map((d) => (
            <div
              key={d.dow}
              className="py-2 text-center text-[10.5px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-r last:border-r-0 border-b border-slate-200"
            >
              {t(`calendar.days.${d.key}`)}
            </div>
          ))}

          {SHIFTS.map((shift) => (
            <React.Fragment key={shift.id}>
              <div className="px-2 py-2 text-center border-r border-b border-slate-200 bg-slate-50/40 flex flex-col items-center justify-center">
                <div className="text-[11px] font-bold text-slate-700">
                  {t(`calendar.shifts.ca_${shift.id}`)}
                </div>
                <div className="text-[9.5px] text-slate-500 tabular-nums">
                  {String(shift.startHour).padStart(2, '0')}:{String(shift.startMinute).padStart(2, '0')}–{String(shift.endHour).padStart(2, '0')}:{String(shift.endMinute).padStart(2, '0')}
                </div>
              </div>
              {DAY_KEYS.map((d) => {
                const active = isSelected(d.dow, shift.id);
                return (
                  <button
                    type="button"
                    key={`${d.dow}-${shift.id}`}
                    onClick={() => toggle(d.dow, shift.id)}
                    className={cn(
                      'h-12 border-r last:border-r-0 border-b border-slate-200 transition-colors',
                      active
                        ? 'bg-indigo-500 hover:bg-indigo-600'
                        : 'bg-white hover:bg-indigo-50/50'
                    )}
                    aria-label={`${d.key}-ca-${shift.id}`}
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
