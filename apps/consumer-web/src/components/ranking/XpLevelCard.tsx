import { Flame, Sparkles, Star, Trophy, TrendingUp, Zap } from 'lucide-react';
import { Card, CardContent } from '@shared/components/ui/card';
import { cn } from '@/lib/utils';
import type { RankingProfile } from '@/lib/api';

export interface XpLevelCardProps {
  profile: RankingProfile;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

const LEVEL_GRADIENTS: Array<{ from: string; to: string; ring: string; text: string }> = [
  { from: 'from-slate-400', to: 'to-slate-500', ring: 'ring-slate-300', text: 'text-slate-100' },
  { from: 'from-sky-500', to: 'to-indigo-500', ring: 'ring-sky-300', text: 'text-sky-50' },
  { from: 'from-violet-500', to: 'to-fuchsia-500', ring: 'ring-violet-300', text: 'text-violet-50' },
  { from: 'from-amber-500', to: 'to-orange-500', ring: 'ring-amber-300', text: 'text-amber-50' },
  { from: 'from-emerald-500', to: 'to-teal-500', ring: 'ring-emerald-300', text: 'text-emerald-50' },
  { from: 'from-rose-500', to: 'to-pink-500', ring: 'ring-rose-300', text: 'text-rose-50' },
];

function levelGradient(level: number) {
  if (level >= 50) return LEVEL_GRADIENTS[5];
  if (level >= 30) return LEVEL_GRADIENTS[4];
  if (level >= 20) return LEVEL_GRADIENTS[3];
  if (level >= 10) return LEVEL_GRADIENTS[2];
  if (level >= 5) return LEVEL_GRADIENTS[1];
  return LEVEL_GRADIENTS[0];
}

export function XpLevelCard({ profile, t }: XpLevelCardProps) {
  const grad = levelGradient(profile.level);
  const pct = Math.max(0, Math.min(100, profile.progress_pct || 0));
  const streakActive = (profile.streak_days || 0) > 0;
  const maxLevel = profile.next_level_xp === 0 && profile.xp_to_next_level === 0;

  return (
    <Card className="overflow-hidden border-0 shadow-xl">
      <CardContent className={cn('p-0', 'bg-gradient-to-br', grad.from, grad.to, grad.text)}>
        <div className="relative grid gap-6 p-6 sm:p-8 sm:grid-cols-[auto,1fr] sm:items-center">
          <div className={cn(
            'flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-2xl bg-white/15 ring-4 backdrop-blur',
            grad.ring,
          )}>
            <div className="text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                {t('ranking.current_level', 'Level')}
              </div>
              <div className="text-4xl font-black leading-none">{profile.level}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                {profile.level_title}
              </span>
              {streakActive && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/80 px-3 py-1 text-xs font-semibold backdrop-blur">
                  <Flame className="h-3.5 w-3.5" />
                  {profile.streak_days} {t('ranking.no_streak', '').length === 0 ? '' : ''}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <Trophy className="h-5 w-5 opacity-80" />
              <span className="text-3xl sm:text-4xl font-black tracking-tight">
                {profile.total_xp.toLocaleString()}
              </span>
              <span className="text-sm font-semibold opacity-80">
                {t('ranking.total_xp', 'Total XP')}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold opacity-90">
                <span>
                  {maxLevel
                    ? t('ranking.max_level', 'Max level reached')
                    : t('ranking.xp_to_next', '{{count}} XP to level {{level}}', {
                        count: profile.xp_to_next_level,
                        level: profile.level + 1,
                      })}
                </span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] opacity-80">
                <span>{profile.current_level_xp.toLocaleString()} XP</span>
                <span>{profile.next_level_xp.toLocaleString()} XP</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function XpCounters({ profile, t }: XpLevelCardProps) {
  const items = [
    { key: 'classrooms', value: profile.classrooms_joined_count, icon: TrendingUp, color: 'text-sky-500' },
    { key: 'quizzes', value: profile.quizzes_passed_count, icon: Zap, color: 'text-emerald-500' },
    { key: 'exams', value: profile.exams_passed_count, icon: Trophy, color: 'text-violet-500' },
    { key: 'certificates', value: profile.certificates_count, icon: Star, color: 'text-amber-500' },
    { key: 'attendance', value: profile.attendance_count, icon: Flame, color: 'text-rose-500' },
    { key: 'perfect', value: profile.perfect_scores_count, icon: Sparkles, color: 'text-indigo-500' },
  ];
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">
          {t('ranking.counters_title', 'Stats')}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <div
                key={it.key}
                className="flex items-center gap-2.5 rounded-lg border border-slate-200/70 bg-slate-50/50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/40"
              >
                <Icon className={cn('h-4 w-4 shrink-0', it.color)} />
                <div className="min-w-0">
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    {it.value}
                  </div>
                  <div className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    {t(`ranking.counter_${it.key}`, it.key)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
