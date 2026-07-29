'use client';

import { Calendar, X } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';

export type DateRangeValue = {
  from: string | null;
  to: string | null;
};

type Preset = { label: string; days: number | null };

const PRESETS: Preset[] = [
  { label: '7 ngày', days: 7 },
  { label: '30 ngày', days: 30 },
  { label: '90 ngày', days: 90 },
  { label: 'Tất cả', days: null },
];

type Props = {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
};

function toDateInput(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function DateRangeFilter({ value, onChange }: Props) {
  const applyPreset = (days: number | null) => {
    if (days === null) {
      onChange({ from: null, to: null });
      return;
    }
    const now = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    onChange({ from: toDateInput(from), to: toDateInput(now) });
  };

  const isPresetActive = (days: number | null) => {
    if (days === null) return !value.from && !value.to;
    if (!value.from || !value.to) return false;
    const now = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    return toDateInput(from) === value.from && toDateInput(now) === value.to;
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Calendar size={14} className="text-slate-500" />
      <input
        type="date"
        value={value.from ?? ''}
        onChange={(e) => onChange({ ...value, from: e.target.value || null })}
        className="px-2 py-1.5 rounded-lg text-[12px] font-medium border border-slate-200 bg-white text-slate-700 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        aria-label="Từ ngày"
      />
      <span className="text-slate-400 text-[11px]">→</span>
      <input
        type="date"
        value={value.to ?? ''}
        onChange={(e) => onChange({ ...value, to: e.target.value || null })}
        className="px-2 py-1.5 rounded-lg text-[12px] font-medium border border-slate-200 bg-white text-slate-700 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        aria-label="Đến ngày"
      />
      <div className="flex items-center gap-1 ml-1">
        {PRESETS.map((p) => {
          const active = isPresetActive(p.days);
          return (
            <Button
              key={p.label}
              onClick={() => applyPreset(p.days)}
              className={cn(
                'px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ring-1',
                active
                  ? 'bg-indigo-600 text-white ring-indigo-600'
                  : 'bg-white text-slate-600 ring-slate-200 hover:ring-indigo-300 hover:text-indigo-700'
              )}
            >
              {p.label}
            </Button>
          );
        })}
        {(value.from || value.to) && (
          <Button
            onClick={() => onChange({ from: null, to: null })}
            className="ml-1 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 ring-1 ring-rose-200 hover:bg-rose-100"
            aria-label="Xoá bộ lọc ngày"
          >
            <X size={10} />
            Xoá
          </Button>
        )}
      </div>
    </div>
  );
}
