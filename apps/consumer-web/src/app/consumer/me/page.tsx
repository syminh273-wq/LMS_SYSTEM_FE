'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Flame, History, Sparkles, Trophy } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { toast } from 'sonner';

import { rankingApi } from '@/lib/api/ranking';
import type { Achievement, RankingProfile } from '@/lib/api';

import { XpLevelCard, XpCounters } from '@/components/ranking/XpLevelCard';
import { AchievementGrid } from '@/components/ranking/AchievementGrid';

export default function MeRankingPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [profile, setProfile] = useState<RankingProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    (async () => {
      try {
        const [p, a] = await Promise.all([
          rankingApi.getMyProfile(),
          rankingApi.getMyAchievements().catch(() => [] as Achievement[]),
        ]);
        setProfile(p);
        setAchievements(a);
      } catch (err) {
        const msg = err instanceof Error ? err.message : t('ranking.error_load');
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [router, t]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-muted">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="h-48 shimmer rounded-2xl" />
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 shimmer rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const recentUnlocks = achievements
    .filter((a) => a.is_unlocked && a.unlocked_at)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-muted">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
            <Sparkles className="h-7 w-7 text-primary" />
            {t('ranking.page_title', 'My Ranking')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('ranking.page_subtitle', 'Track your learning progress, level, and achievements.')}
          </p>
        </div>

        <XpLevelCard profile={profile} t={t} />

        <div className="grid gap-3 sm:grid-cols-3">
          <NavCard
            href="/consumer/me/history"
            icon={History}
            color="from-sky-500 to-indigo-500"
            label={t('ranking.view_history', 'XP history')}
          />
          <NavCard
            href="/consumer/me/achievements"
            icon={Trophy}
            color="from-amber-500 to-orange-500"
            label={t('ranking.view_achievements', 'Achievements')}
          />
          <NavCard
            href="/consumer/me/leaderboard"
            icon={Flame}
            color="from-rose-500 to-pink-500"
            label={t('ranking.view_leaderboard', 'Leaderboard')}
          />
        </div>

        <XpCounters profile={profile} t={t} />

        {recentUnlocks.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">
              {t('ranking.recent_unlocks', 'Recent unlocks')}
            </h2>
            <AchievementGrid achievements={recentUnlocks} t={t} />
          </div>
        )}
      </div>
    </div>
  );
}

function NavCard({
  href,
  icon: Icon,
  color,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-border bg-background p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${color}`} />
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
      <p className="mt-3 text-sm font-bold text-foreground">
        {label}
      </p>
    </Link>
  );
}
