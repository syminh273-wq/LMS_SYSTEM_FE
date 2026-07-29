'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, History as HistoryIcon } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { toast } from 'sonner';

import { rankingApi } from '@/lib/api/ranking';
import type { XpTransaction } from '@/lib/api';
import { XpHistoryList } from '@/components/ranking/XpHistoryList';

export default function MeHistoryPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [items, setItems] = useState<XpTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    (async () => {
      try {
        const data = await rankingApi.getMyTransactions({ limit: 100 });
        setItems(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : t('ranking.error_load');
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [router, t]);

  return (
    <div className="min-h-screen bg-muted">
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex items-center gap-3">
          <Link
            href="/consumer/me"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-black text-foreground sm:text-2xl">
              <HistoryIcon className="h-5 w-5 text-primary" />
              {t('ranking.history_title', 'XP history')}
            </h1>
          </div>
        </div>

        {loading ? (
          <div className="h-64 shimmer rounded-2xl" />
        ) : (
          <XpHistoryList transactions={items} t={t} />
        )}
      </div>
    </div>
  );
}
