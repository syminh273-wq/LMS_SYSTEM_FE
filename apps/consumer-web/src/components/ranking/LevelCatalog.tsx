'use client';

import { Trophy } from 'lucide-react';
import { Card, CardContent } from '@shared/components/ui/card';
import { cn } from '@/lib/utils';
import type { LevelDefinition } from '@/lib/api';

export interface LevelCatalogProps {
  levels: LevelDefinition[];
  currentLevel: number;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

export function LevelCatalog({ levels, currentLevel, t }: LevelCatalogProps) {
  return (
    <div className="space-y-3">
      {levels.map((lvl) => {
        const isCurrent = lvl.level === currentLevel;
        const isPast = lvl.level < currentLevel;
        return (
          <Card
            key={lvl.level}
            className={cn(
              'overflow-hidden transition',
              isCurrent
                ? 'border-indigo-300 ring-2 ring-indigo-200 dark:border-indigo-500/40 dark:ring-indigo-500/30'
                : isPast
                  ? 'opacity-60'
                  : '',
            )}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={cn(
                  'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-black',
                  isCurrent
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md'
                    : isPast
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                )}
              >
                {lvl.level}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {lvl.title || t('ranking.level_label', 'Level {{level}}', { level: lvl.level })}
                  </span>
                  {isCurrent && (
                    <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      {t('ranking.current_level', 'Level')}
                    </span>
                  )}
                  {isPast && (
                    <Trophy className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {lvl.required_xp.toLocaleString()} XP
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
