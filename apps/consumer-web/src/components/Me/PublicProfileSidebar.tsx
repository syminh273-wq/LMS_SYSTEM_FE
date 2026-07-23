'use client';

import { BarChart3 } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';

type Props = {
  followersCount: number;
  followingCount: number;
  postsCount: number;
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

export function PublicProfileSidebar({
  followersCount,
  followingCount,
  postsCount,
}: Props) {
  const { t } = useTranslation();

  return (
    <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <div className="bg-white border border-slate-200 rounded-xl p-5 card-elevated">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={13} className="text-slate-400" />
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
            {t('portfolio.me.stats_title')}
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="text-center px-1 py-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-base font-black text-slate-900 tabular-nums">
              {formatCount(followersCount)}
            </div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">
              {t('portfolio.me.followers')}
            </div>
          </div>
          <div className="text-center px-1 py-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-base font-black text-slate-900 tabular-nums">
              {formatCount(followingCount)}
            </div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">
              {t('portfolio.me.following_count')}
            </div>
          </div>
          <div className="text-center px-1 py-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <div className="text-base font-black text-slate-900 tabular-nums">
              {formatCount(postsCount)}
            </div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">
              {t('portfolio.me.posts')}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
