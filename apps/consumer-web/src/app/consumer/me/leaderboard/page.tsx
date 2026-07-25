'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { toast } from 'sonner';

import { rankingApi } from '@/lib/api/ranking';
import type {
  GlobalLeaderboardResponse, LeaderboardPeriod, MyRankResponse,
} from '@/lib/api';
import { GlobalLeaderboardList } from '@/components/ranking/GlobalLeaderboardList';

export default function MeLeaderboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const [data, setData] = useState<GlobalLeaderboardResponse | null>(null);
  const [myRank, setMyRank] = useState<MyRankResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/auth/login');
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [lb, rank] = await Promise.all([
          rankingApi.getGlobalLeaderboard({ limit: 50, period }),
          rankingApi.getMyRank(period).catch(() => null),
        ]);
        if (cancelled) return;
        setData(lb);
        setMyRank(rank);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : t('ranking.error_load');
        toast.error(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [period, t]);

  const myStudentId = myRank?.student_id || '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50">
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex items-center gap-3">
          <Link
            href="/consumer/me"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 transition hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-black text-slate-900 dark:text-slate-100 sm:text-2xl dark:text-white">
              <Trophy className="h-5 w-5 text-amber-500" />
              {t('ranking.leaderboard_title', 'Global leaderboard')}
            </h1>
          </div>
        </div>

        {loading || !data ? (
          <div className="h-96 shimmer rounded-2xl" />
        ) : (
          <GlobalLeaderboardList
            data={data}
            myRank={myRank}
            myStudentId={myStudentId}
            t={t}
            loading={loading}
            onPeriodChange={(p) => setPeriod(p)}
          />
        )}
      </div>
    </div>
  );
}
