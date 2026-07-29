import { Calendar, X } from 'lucide-react';
import { Button } from '@shared/components/ui/button';

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
      <Calendar size={14} className="text-muted-foreground" />
      <input
        type="date"
        value={value.from ?? ''}
        onChange={(e) => onChange({ ...value, from: e.target.value || null })}
        className="px-2 py-1.5 rounded-lg text-[12px] font-medium border border-border bg-background text-foreground hover:border-primary-brand/40 focus:outline-none focus:ring-2 focus:ring-primary-brand/20"
        aria-label="Từ ngày"
      />
      <span className="text-muted-foreground text-[11px]">→</span>
      <input
        type="date"
        value={value.to ?? ''}
        onChange={(e) => onChange({ ...value, to: e.target.value || null })}
        className="px-2 py-1.5 rounded-lg text-[12px] font-medium border border-border bg-background text-foreground hover:border-primary-brand/40 focus:outline-none focus:ring-2 focus:ring-primary-brand/20"
        aria-label="Đến ngày"
      />
      <div className="flex items-center gap-1 ml-1">
        {PRESETS.map((p) => {
          const active = isPresetActive(p.days);
          return (
            <Button
              key={p.label}
              variant={active ? 'default' : 'outline'}
              size="sm"
              onClick={() => applyPreset(p.days)}
            >
              {p.label}
            </Button>
          );
        })}
        {(value.from || value.to) && (
          <Button
            onClick={() => onChange({ from: null, to: null })}
            variant="ghost"
            size="sm"
            className="ml-1 gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
