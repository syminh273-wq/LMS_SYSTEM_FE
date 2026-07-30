import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Crown, Medal, Sparkles, Trophy, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import { cn } from '@shared/lib/utils';
import { spaceRankingApi, type ClassroomLeaderboardResponse } from '@/lib/api/ranking';

export interface SpaceClassroomRankingViewProps {
  classroomUid: string;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

function rankBadge(rank: number) {
  if (rank === 1) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 ring-2 ring-amber-300">
        <Crown className="h-5 w-5 text-amber-500" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 ring-2 ring-slate-300">
        <Medal className="h-5 w-5 text-slate-500" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 ring-2 ring-orange-300">
        <Award className="h-5 w-5 text-orange-500" />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
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

export default function SpaceClassroomRankingView({
  classroomUid,
  t,
}: SpaceClassroomRankingViewProps) {
  const router = useRouter();
  const [data, setData] = useState<ClassroomLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await spaceRankingApi.getClassroomLeaderboard(classroomUid, 50);
        if (cancelled) return;
        setData(res);
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : t('ranking.error_load', 'Could not load ranking data.');
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [classroomUid, t, refreshKey]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 shimmer rounded-2xl" />
        <div className="h-96 shimmer rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (!data || data.entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center text-muted-foreground">
          <Trophy className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-bold">
            {t('ranking.no_data', 'No ranking data yet.')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t(
              'ranking.no_data_hint',
              'Students will appear here once they earn XP from classroom activities.',
            )}
          </p>
        </CardContent>
      </Card>
    );
  }

  const total = data.entries.length;
  const top = data.entries[0];
  const avgXp = Math.round(
    data.entries.reduce((sum, e) => sum + (e.total_xp || 0), 0) / Math.max(1, total),
  );
  const top3 = data.entries.slice(0, 3);
  const rest = data.entries.slice(3);

  return (
    <div className="space-y-6">
      {/* Stats summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          icon={Users}
          label={t('ranking.total_students', 'Students ranked')}
          value={total}
          accent="from-sky-500 to-indigo-500"
          shadow="shadow-sky-500/20"
        />
        <StatCard
          icon={Crown}
          label={t('ranking.top_performer', 'Top performer')}
          value={top.student_name}
          sub={`${top.total_xp.toLocaleString()} XP · Lv ${top.level}`}
          accent="from-amber-500 to-orange-500"
          shadow="shadow-amber-500/20"
        />
        <StatCard
          icon={TrendingUp}
          label={t('ranking.avg_xp', 'Average XP')}
          value={`${avgXp.toLocaleString()} XP`}
          accent="from-emerald-500 to-teal-500"
          shadow="shadow-emerald-500/20"
        />
      </div>

      {/* Podium for top 3 */}
      {top3.length > 0 && (
        <Card className="overflow-hidden">
          <div className="pointer-events-none h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
          <CardContent className="p-6">
            <div className="mb-6 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                {t('ranking.top3', 'Top 3')}
              </h3>
            </div>
            <div className="flex items-end justify-center gap-4 sm:gap-10">
              {top3.map((entry, i) => (
                <PodiumCell
                  key={entry.student_id}
                  entry={entry}
                  rank={(i + 1) as 1 | 2 | 3}
                  onClick={() => router.push(`/space/classrooms/${classroomUid}/students/${entry.student_id}`)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full ranking list */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary-brand" />
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                {t('ranking.full_list', 'Full ranking')}
              </h3>
            </div>
            <Badge variant="secondary" className="rounded-full font-bold">
              {t('ranking.entries_count', '{{count}} students', { count: data.entries.length })}
            </Badge>
          </div>
          <ul className="divide-y divide-border">
            {data.entries.map((entry) => (
              <li
                key={entry.student_id}
                onClick={() => router.push(`/space/classrooms/${classroomUid}/students/${entry.student_id}`)}
                className="group flex cursor-pointer items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/60"
              >
                {rankBadge(entry.rank)}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-black text-white ring-2 ring-background">
                  {entry.student_avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.student_avatar}
                      alt={entry.student_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials(entry.student_name)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-foreground group-hover:text-primary-brand">
                      {entry.student_name}
                    </p>
                    {entry.level_title && (
                      <Badge className="shrink-0 rounded-full bg-primary-brand/10 px-2 py-0 text-[10px] font-bold text-primary-brand hover:bg-primary-brand/10">
                        {entry.level_title}
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {entry.total_xp.toLocaleString()} XP · {entry.total_score.toFixed(1)} điểm
                  </p>
                  {entry.explanation && (
                    <p className="truncate text-[10px] text-muted-foreground">
                      {entry.explanation}
                    </p>
                  )}
                </div>
                <div className="shrink-0 rounded-full bg-primary-brand/10 px-2.5 py-0.5 text-xs font-bold text-primary-brand">
                  Lv {entry.level}
                </div>
              </li>
            ))}
            {rest.length === 0 && top3.length === data.entries.length && (
              <li className="px-5 py-6 text-center text-xs text-muted-foreground">
                {t('ranking.only_top3', 'Only top 3 students have earned XP so far.')}
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRefreshKey((k) => k + 1)}
          className="text-muted-foreground"
        >
          {t('common.refresh', 'Refresh')}
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  shadow,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  shadow?: string;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg',
            accent,
            shadow,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p className="truncate text-lg font-black leading-tight text-foreground">{value}</p>
          {sub && <p className="truncate text-[10px] font-medium text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

const PODIUM_STYLES: Record<
  1 | 2 | 3,
  { ring: string; bar: string; barHeight: string; avatarSize: string; order: string }
> = {
  1: {
    ring: 'ring-amber-400',
    bar: 'from-amber-400 via-amber-500 to-orange-500',
    barHeight: 'h-28',
    avatarSize: 'h-16 w-16 text-base',
    order: 'order-2',
  },
  2: {
    ring: 'ring-slate-300',
    bar: 'from-slate-300 to-slate-400',
    barHeight: 'h-20',
    avatarSize: 'h-12 w-12 text-xs',
    order: 'order-1',
  },
  3: {
    ring: 'ring-orange-300',
    bar: 'from-orange-300 to-orange-400',
    barHeight: 'h-16',
    avatarSize: 'h-12 w-12 text-xs',
    order: 'order-3',
  },
};

function PodiumCell({
  entry,
  rank,
  onClick,
}: {
  entry: ClassroomLeaderboardResponse['entries'][number];
  rank: 1 | 2 | 3;
  onClick: () => void;
}) {
  const style = PODIUM_STYLES[rank];
  const isFirst = rank === 1;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-24 flex-col items-center gap-1.5 rounded-2xl p-2 text-center transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-28',
        style.order,
      )}
    >
      <div className="relative mb-0.5">
        {isFirst && (
          <Crown className="absolute -top-5 left-1/2 h-5 w-5 -translate-x-1/2 text-amber-500 drop-shadow" />
        )}
        <div
          className={cn(
            'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 font-black text-white ring-4',
            style.ring,
            style.avatarSize,
          )}
        >
          {entry.student_avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.student_avatar} alt={entry.student_name} className="h-full w-full object-cover" />
          ) : (
            initials(entry.student_name)
          )}
        </div>
      </div>
      <p className="line-clamp-1 max-w-full px-1 text-xs font-bold text-foreground group-hover:text-primary-brand">
        {entry.student_name}
      </p>
      {entry.level_title && (
        <Badge variant="secondary" className="rounded-full px-2 py-0 text-[9px] font-bold">
          {entry.level_title}
        </Badge>
      )}
      <p className="text-[10px] font-medium text-muted-foreground">
        {entry.total_xp.toLocaleString()} XP · {entry.total_score.toFixed(1)} điểm
      </p>
      <div
        className={cn(
          'mt-1 flex w-full items-start justify-center rounded-t-2xl bg-gradient-to-b pt-2 text-white shadow-inner transition group-hover:brightness-105',
          style.bar,
          style.barHeight,
        )}
      >
        <span className="text-lg font-black drop-shadow-sm">#{rank}</span>
      </div>
    </button>
  );
}
