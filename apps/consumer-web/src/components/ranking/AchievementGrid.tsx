'use client';

import { Award, CheckCircle2, Lock, Star, Trophy, Medal, Sparkles, School, Verified, PlayCircle, CalendarCheck, CalendarDays, Compass, LayoutDashboard, Flame } from 'lucide-react';
import { Card, CardContent } from '@shared/components/ui/card';
import { cn } from '@/lib/utils';
import type { Achievement } from '@/lib/api';

export interface AchievementGridProps {
  achievements: Achievement[];
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  award: Award,
  star: Star,
  medal: Medal,
  sparkles: Sparkles,
  school: School,
  verified: Verified,
  play_circle: PlayCircle,
  event_available: CalendarCheck,
  event_note: CalendarDays,
  explore: Compass,
  dashboard: LayoutDashboard,
  military_tech: Medal,
  workspace_premium: Award,
  emoji_events: Trophy,
  local_fire_department: Flame,
};

function getIcon(name: string) {
  return ICON_MAP[name] || Trophy;
}

export function AchievementGrid({ achievements, t }: AchievementGridProps) {
  if (!achievements.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center text-sm text-slate-500 dark:border-slate-700">
        {t('ranking.no_history', 'No data yet.')}
      </div>
    );
  }
  const unlocked = achievements.filter((a) => a.is_unlocked).length;
  const total = achievements.length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('ranking.achievements_title', 'Achievements')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('ranking.achievements_unlocked', '{{count}} of {{total}} unlocked', {
              count: unlocked,
              total,
            })}
          </p>
        </div>
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          {unlocked}/{total}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a) => {
          const Icon = getIcon(a.icon);
          return (
            <AchievementCard key={a.code} achievement={a} Icon={Icon} />
          );
        })}
      </div>
    </div>
  );
}

function AchievementCard({
  achievement,
  Icon,
}: {
  achievement: Achievement;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const pct = Math.max(0, Math.min(100, achievement.progress_pct || 0));
  const unlocked = achievement.is_unlocked;
  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all',
        unlocked
          ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm hover:shadow-md dark:border-amber-500/30 dark:from-amber-500/5 dark:to-orange-500/5'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 opacity-90 hover:opacity-100 dark:border-slate-700 dark:bg-slate-900/40',
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
              unlocked
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600',
            )}
          >
            {unlocked ? (
              <Icon className="h-6 w-6" />
            ) : (
              <Lock className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={cn(
                  'text-sm font-bold leading-tight',
                  unlocked
                    ? 'text-amber-900 dark:text-amber-100'
                    : 'text-slate-700 dark:text-slate-300',
                )}
              >
                {achievement.title}
              </h3>
              {unlocked && (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {achievement.description}
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide">
            <span className="text-slate-500 dark:text-slate-400">
              {achievement.current_value} / {achievement.target_value}
            </span>
            <span
              className={cn(
                unlocked ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400',
              )}
            >
              {pct}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                unlocked
                  ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                  : 'bg-indigo-500',
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
