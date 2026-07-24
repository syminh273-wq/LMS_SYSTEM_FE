'use client';

import {
  BookOpen, CalendarCheck, CheckCircle2, FileText, GraduationCap,
  Layers, PlayCircle, Star as StarIcon, Trophy,
} from 'lucide-react';
import { Card, CardContent } from '@shared/components/ui/card';
import { cn } from '@/lib/utils';
import type { XpTransaction } from '@/lib/api';

export interface XpHistoryListProps {
  transactions: XpTransaction[];
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

const ICON_BY_EVENT: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  classroom_joined:     { icon: BookOpen,         color: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300' },
  attendance_present:   { icon: CalendarCheck,    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300' },
  exam_submitted:       { icon: FileText,         color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300' },
  exam_passed:          { icon: GraduationCap,    color: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300' },
  quiz_submitted:       { icon: PlayCircle,       color: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300' },
  quiz_passed:          { icon: CheckCircle2,     color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300' },
  quiz_perfect:         { icon: StarIcon,         color: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300' },
  doc_completed:        { icon: BookOpen,         color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200' },
  collection_completed: { icon: Layers,           color: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300' },
  certificate_issued:   { icon: Trophy,           color: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300' },
};

function relativeTime(iso: string): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return iso;
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d`;
  const month = Math.floor(day / 30);
  if (month < 12) return `${month}mo`;
  const year = Math.floor(day / 365);
  return `${year}y`;
}

export function XpHistoryList({ transactions, t }: XpHistoryListProps) {
  if (!transactions.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-500 dark:border-slate-700">
        {t('ranking.no_history', 'No XP events yet.')}
      </div>
    );
  }
  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {transactions.map((tx) => {
            const meta = ICON_BY_EVENT[tx.event_type] || ICON_BY_EVENT.quiz_submitted;
            const Icon = meta.icon;
            return (
              <li
                key={tx.uid}
                className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 sm:px-5 dark:hover:bg-slate-800/40"
              >
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    meta.color,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {tx.description || tx.event_type}
                  </p>
                  <p className="text-xs text-slate-500">
                    {relativeTime(tx.created_at)} · {tx.event_type}
                  </p>
                </div>
                <div className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  +{tx.delta_xp}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
