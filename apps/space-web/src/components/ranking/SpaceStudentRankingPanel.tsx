'use client';

import { useEffect, useState } from 'react';
import { Flame, Sparkles, Star, Trophy, Zap, BookOpen, CheckCircle2, Lock } from 'lucide-react';
import { Card, CardContent } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import {
  spaceRankingApi,
  type StudentRankingProfile,
  type StudentAchievement,
} from '@/lib/api/ranking';

export interface SpaceStudentRankingPanelProps {
  studentUid: string;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

export default function SpaceStudentRankingPanel({
  studentUid,
  t,
}: SpaceStudentRankingPanelProps) {
  const [profile, setProfile] = useState<StudentRankingProfile | null>(null);
  const [achievements, setAchievements] = useState<StudentAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [p, a] = await Promise.all([
          spaceRankingApi.getStudentProfile(studentUid),
          spaceRankingApi.getStudentAchievements(studentUid).catch(() => [] as StudentAchievement[]),
        ]);
        if (cancelled) return;
        setProfile(p);
        setAchievements(a);
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studentUid]);

  if (loading) {
    return <div className="h-48 shimmer rounded-2xl" />;
  }
  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-slate-500">
          {t('ranking.no_data', 'No ranking data yet.')}
        </CardContent>
      </Card>
    );
  }

  const pct = Math.max(0, Math.min(100, profile.progress_pct || 0));
  const unlocked = achievements.filter((a) => a.is_unlocked).length;
  const total = achievements.length;
  const streakActive = (profile.streak_days || 0) > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-2xl font-black text-white shadow-md">
              {profile.level}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                  {profile.level_title}
                </span>
                {streakActive && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[11px] font-bold text-orange-700">
                    <Flame className="h-3 w-3" />
                    {profile.streak_days}d
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-2xl font-black text-slate-900">
                  {profile.total_xp.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-slate-500">XP</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>
                    {t('ranking.xp_to_next', '{{count}} XP to level {{level}}', {
                      count: profile.xp_to_next_level,
                      level: profile.level + 1,
                    })}
                  </span>
                  <span>{pct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <CounterTile
          icon={BookOpen}
          value={profile.classrooms_joined_count}
          label={t('ranking.counter_classrooms', 'Classrooms')}
          color="text-sky-500"
        />
        <CounterTile
          icon={Zap}
          value={profile.quizzes_passed_count}
          label={t('ranking.counter_quizzes', 'Quizzes passed')}
          color="text-emerald-500"
        />
        <CounterTile
          icon={Trophy}
          value={profile.exams_passed_count}
          label={t('ranking.counter_exams', 'Exams passed')}
          color="text-violet-500"
        />
        <CounterTile
          icon={Star}
          value={profile.certificates_count}
          label={t('ranking.counter_certificates', 'Certificates')}
          color="text-amber-500"
        />
        <CounterTile
          icon={Flame}
          value={profile.attendance_count}
          label={t('ranking.counter_attendance', 'Attendances')}
          color="text-rose-500"
        />
        <CounterTile
          icon={Sparkles}
          value={profile.perfect_scores_count}
          label={t('ranking.counter_perfect', 'Perfect scores')}
          color="text-indigo-500"
        />
      </div>

      {total > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-700">
                {t('ranking.achievements_title', 'Achievements')}
              </h4>
              <span className="text-xs font-bold text-slate-500">
                {unlocked}/{total}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {achievements.map((a) => {
                const p = Math.max(0, Math.min(100, a.progress_pct || 0));
                return (
                  <div
                    key={a.code}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-2.5',
                      a.is_unlocked
                        ? 'border-amber-200 bg-amber-50/50'
                        : 'border-slate-200 bg-slate-50/50 opacity-80',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                        a.is_unlocked
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                          : 'bg-slate-200 text-slate-400',
                      )}
                    >
                      {a.is_unlocked ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-800">
                        {a.title}
                      </p>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            a.is_unlocked
                              ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                              : 'bg-indigo-500',
                          )}
                          style={{ width: `${p}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CounterTile({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-2.5 p-3">
        <Icon className={cn('h-4 w-4 shrink-0', color)} />
        <div className="min-w-0">
          <div className="text-base font-black text-slate-900">{value}</div>
          <div className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {label}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
