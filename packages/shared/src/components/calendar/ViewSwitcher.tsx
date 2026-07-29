import { useTranslation } from '@shared/components/LocaleProvider';
import { Button } from '../ui/button';
import { cn } from '@shared/lib/utils';
import type { CalendarView } from './useCalendarState';

interface ViewSwitcherProps {
  value: CalendarView;
  onChange: (view: CalendarView) => void;
  className?: string;
}

export function ViewSwitcher({ value, onChange, className }: ViewSwitcherProps) {
  const { t } = useTranslation();
  const options: { key: CalendarView; label: string }[] = [
    { key: 'month', label: t('calendar.labels.view_month', 'Month') },
    { key: 'week', label: t('calendar.labels.view_week', 'Week') },
  ];
  return (
    <div className={cn('flex items-center bg-white border border-slate-200 rounded-lg p-0.5', className)}>
      {options.map((opt) => (
        <Button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={cn(
            'px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors',
            value === opt.key
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900'
          )}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
