'use client';

import * as React from 'react';
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
    <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
      {TABS.map((t) => {
        const active = value === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              'relative px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              active
                ? 'bg-white dark:bg-slate-900 text-indigo-700 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100',
            )}
          >
            {t.label}
            {typeof counts?.[t.key] === 'number' && (
              <span
                className={cn(
                  'ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold',
                  active ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600 dark:text-slate-400',
                )}
              >
                {counts[t.key]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
