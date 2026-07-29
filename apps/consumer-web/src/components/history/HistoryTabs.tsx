'use client';

import * as React from 'react';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';

export type HistoryTab = 'payments' | 'joins';

const TABS: { key: HistoryTab; label: string }[] = [
  { key: 'payments', label: 'Thanh toán' },
  { key: 'joins', label: 'Lớp đã tham gia' },
];

type Props = {
  value: HistoryTab;
  onChange: (next: HistoryTab) => void;
  counts?: Partial<Record<HistoryTab, number>>;
};

export function HistoryTabs({ value, onChange, counts }: Props) {
  return (
    <div className="inline-flex p-1 rounded-xl bg-muted border border-border">
      {TABS.map((t) => {
        const active = value === t.key;
        return (
          <Button
            key={t.key}
            variant="ghost"
            onClick={() => onChange(t.key)}
            data-active={active || undefined}
            className={cn(
              'relative text-muted-foreground data-[active=true]:text-foreground data-[active=true]:font-semibold data-[active=true]:border-b-2 data-[active=true]:border-primary',
            )}
          >
            {t.label}
            {typeof counts?.[t.key] === 'number' && (
              <span
                data-active={active || undefined}
                className={cn(
                  'ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground',
                  'data-[active=true]:text-foreground data-[active=true]:font-semibold',
                )}
              >
                {counts[t.key]}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
