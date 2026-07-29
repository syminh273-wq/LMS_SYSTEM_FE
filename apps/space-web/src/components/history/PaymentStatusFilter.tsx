'use client';

import { cn } from '@shared/lib/utils';
import { Button } from '@shared/components/ui/button';
import type { PaymentStatus } from '@/lib/api/payment';

const STATUS_FILTERS: { value: PaymentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'COMPLETED', label: 'Thành công' },
  { value: 'PENDING', label: 'Đang chờ' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

type Props = {
  value: PaymentStatus | 'all';
  onChange: (next: PaymentStatus | 'all') => void;
};

export function PaymentStatusFilter({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {STATUS_FILTERS.map((s) => {
        const active = value === s.value;
        return (
          <Button
            key={s.value}
            onClick={() => onChange(s.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors ring-1',
              active
                ? 'bg-primary-brand text-primary-foreground ring-primary-brand'
                : 'bg-background text-muted-foreground ring-border hover:ring-primary-brand/40 hover:text-primary-brand'
            )}
          >
            {s.label}
          </Button>
        );
      })}
    </div>
  );
}
