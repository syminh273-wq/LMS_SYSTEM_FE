'use client';

import { useState } from 'react';
import { Button } from '@shared/components/ui/button';
import { Award, Crown, Medal, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Card, CardContent } from '@shared/components/ui/card';
import { cn } from '@/lib/utils';
import type { GlobalLeaderboardEntry, GlobalLeaderboardResponse, LeaderboardPeriod, MyRankResponse } from '@/lib/api';

export interface GlobalLeaderboardListProps {
  data: GlobalLeaderboardResponse;
  myRank: MyRankResponse | null;
  myStudentId: string;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
  onPeriodChange?: (period: LeaderboardPeriod) => void;
  loading?: boolean;
}

const PERIODS: { key: LeaderboardPeriod; label: 'period_all' | 'period_week' | 'period_month' }[] = [
  { key: 'all', label: 'period_all' },
  { key: 'week', label: 'period_week' },
  { key: 'month', label: 'period_month' },
];

function rankBadge(rank: number) {
  if (rank === 1) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 ring-2 ring-amber-300 dark:bg-amber-500/20">
        <Crown className="h-5 w-5 text-amber-500" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 ring-2 ring-slate-300 dark:bg-slate-700 dark:ring-slate-500">
        <Medal className="h-5 w-5 text-slate-500 dark:text-slate-200" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 ring-2 ring-orange-300 dark:bg-orange-500/20">
        <Award className="h-5 w-5 text-orange-500" />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {rank}
    </div>
  );
}

function initials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function GlobalLeaderboardList({
  data,
  myRank,
  myStudentId,
  t,
  onPeriodChange,
  loading,
}: GlobalLeaderboardListProps) {
  const [activePeriod, setActivePeriod] = useState<LeaderboardPeriod>(data.period || 'all');

  const handlePeriod = (p: LeaderboardPeriod) => {
    if (p === activePeriod) return;
    setActivePeriod(p);
    onPeriodChange?.(p);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <Trophy className="h-5 w-5 text-amber-500" />
            {t('ranking.leaderboard_title', 'Global leaderboard')}
          </h2>
          {myRank?.rank && (
            <p className="mt-0.5 text-sm text-slate-500">
              {t('ranking.my_rank', 'Your rank: #{{rank}}', { rank: myRank.rank })}
              <span className="ml-2 text-xs text-slate-400">
                · {myRank.total_xp.toLocaleString()} XP · Lv {myRank.level}
              </span>
            </p>
          )}
        </div>

        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {PERIODS.map((p) => (
            <Button
              key={p.key}
              type="button"
              onClick={() => handlePeriod(p.key)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-bold transition',
                activePeriod === p.key
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
              )}
            >
              {t(`ranking.${p.label}`, p.key)}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonList />
      ) : data.entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-500 dark:border-slate-700">
          {t('ranking.no_leaderboard_data', 'No students ranked yet.')}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.entries.map((entry) => (
                <LeaderboardRow
                  key={entry.student_id}
                  entry={entry}
                  isMe={entry.student_id === myStudentId}
                  youLabel={t('ranking.you', 'You')}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LeaderboardRow({
  entry,
  isMe,
  youLabel,
}: {
  entry: GlobalLeaderboardEntry;
  isMe: boolean;
  youLabel: string;
}) {
  return (
    <li
      className={cn(
        'flex items-center gap-3 px-4 py-3 transition sm:px-5',
        isMe
          ? 'bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40',
      )}
    >
      {rankBadge(entry.rank)}
      <Avatar className="h-9 w-9 shrink-0">
        {entry.student_avatar ? (
          <AvatarImage src={entry.student_avatar} alt={entry.student_name} />
        ) : null}
        <AvatarFallback className="bg-slate-100 text-xs font-black text-slate-600 dark:bg-slate-700 dark:text-slate-200">
          {initials(entry.student_name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
            {entry.student_name}
          </span>
          {isMe && (
            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {youLabel}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500">
          {entry.total_xp.toLocaleString()} XP
        </div>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <div className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
          Lv {entry.level}
        </div>
      </div>
    </li>
  );
}

function SkeletonList() {
  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <div className="h-10 w-10 shimmer rounded-full" />
              <div className="h-9 w-9 shimmer rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-1/3 shimmer rounded" />
                <div className="h-2.5 w-1/4 shimmer rounded" />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
