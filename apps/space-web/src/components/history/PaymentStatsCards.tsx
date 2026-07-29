import { Card, CardContent } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

type Tone = 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';

type StatItem = {
  label: string;
  value: string;
  tone?: Tone;
};

const TONE_CLASS: Record<Tone, string> = {
  indigo: 'text-primary-brand',
  emerald: 'text-emerald-700',
  amber: 'text-amber-700',
  rose: 'text-destructive',
  slate: 'text-foreground',
};

export function PaymentStatsCards({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {stats.map((s, idx) => (
        <Card key={idx}>
          <CardContent className="p-4">
            <p className="text-[11px] uppercase tracking-wide font-bold text-muted-foreground">
              {s.label}
            </p>
            <p
              className={cn(
                'mt-1 text-lg sm:text-xl font-extrabold truncate',
                TONE_CLASS[s.tone ?? 'slate']
              )}
            >
              {s.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function formatRevenue(amount: number): string {
  return formatVND(amount);
}
