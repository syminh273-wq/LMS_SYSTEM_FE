'use client';

import { cn } from '@shared/lib/utils';
import type { PaymentStatus } from '@/lib/api/payment';

export const STATUS_FILTERS: { value: PaymentStatus | 'all'; label: string }[] = [
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
          <button
            key={s.value}
            onClick={() => onChange(s.value)}
            className={cn(
              'px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors ring-1',
              active
                ? 'bg-indigo-600 text-white ring-indigo-600'
                : 'bg-white text-slate-600 ring-slate-200 hover:ring-indigo-300 hover:text-indigo-700'
            )}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
