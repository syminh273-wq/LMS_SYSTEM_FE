'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { accountService } from '@/lib/api/account';
import { dashboardApi, type DashboardSummary } from '@/lib/api/dashboard';

type DashboardData = {
  teacherName: string;
  summary: DashboardSummary;
};

type DashboardStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type UseDashboardResult = {
  status: DashboardStatus;
  data: DashboardData | null;
  reload: () => Promise<void>;
};

/**
 * Fetches the full space dashboard summary in a single pass.
 *
 * Falls back to unauthenticated and lets the caller redirect to /space/login
 * if the token is missing or invalid.
 */
export function useDashboard(): UseDashboardResult {
  const router = useRouter();
  const [status, setStatus] = useState<DashboardStatus>('loading');
  const [data, setData] = useState<DashboardData | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [profile, summary] = await Promise.all([
        accountService.getProfile(),
        dashboardApi.summary(),
      ]);

      setData({
        teacherName: profile.full_name || profile.email || '',
        summary,
      });
      setStatus('authenticated');
    } catch {
      setData(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect --
       Initial mount triggers the same loader that updates state; mirrors
       the consumer-web useMe pattern. load only fires once on mount
       (load is stable via useCallback([])). */
    void load();
  }, [load]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      router.push('/space/login');
    }
  }, [status, router]);

  return { status, data, reload: load };
}
