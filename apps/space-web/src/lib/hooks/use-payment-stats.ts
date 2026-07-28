'use client';

import { useCallback, useEffect, useState } from 'react';
import { spacePaymentApi } from '@/lib/api/space-payment';
import type {
  PaymentListItem,
  PaymentHistoryParams,
  PaymentStatus,
  PaymentAnalyticsSummary,
  PaymentSummaryParams,
} from '@/lib/api/payment';

function normalizeStatus(raw: string | undefined | null): PaymentStatus {
  const s = (raw || '').toUpperCase();
  if (s === 'PENDING' || s === 'COMPLETED' || s === 'FAILED' || s === 'CANCELLED') return s;
  return 'CANCELLED';
}

export type PaymentStats = {
  total: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  cancelledCount: number;
  totalRevenue: number;
};

export type UsePaymentOptions = {
  resourceId?: string;
  status?: PaymentStatus | 'all';
  limit?: number;
  autoLoad?: boolean;
};

function computeStats(items: PaymentListItem[]): PaymentStats {
  let completed = 0;
  let pending = 0;
  let failed = 0;
  let cancelled = 0;
  let revenue = 0;
  for (const p of items) {
    const s = normalizeStatus(p.status);
    if (s === 'COMPLETED') {
      completed += 1;
      revenue += p.amount || 0;
    } else if (s === 'PENDING') {
      pending += 1;
    } else if (s === 'FAILED') {
      failed += 1;
    } else {
      cancelled += 1;
    }
  }
  return {
    total: items.length,
    completedCount: completed,
    pendingCount: pending,
    failedCount: failed,
    cancelledCount: cancelled,
    totalRevenue: revenue,
  };
}

export function usePaymentList(options: UsePaymentOptions = {}) {
  const { resourceId, status, limit = 100, autoLoad = true } = options;
  const [items, setItems] = useState<PaymentListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(autoLoad);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        const params: PaymentHistoryParams = { limit };
        if (resourceId) {
          params.resource_type = 'classroom';
          params.resource_id = resourceId;
        }
        if (status && status !== 'all') {
          params.status = status;
        }
        const data = await spacePaymentApi.getHistory(params);
        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải lịch sử thanh toán');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [resourceId, status, limit]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial fetch is the only entry point for the data.
    if (autoLoad) void load();
  }, [load, autoLoad]);

  const stats = computeStats(items);
  return { items, loading, refreshing, error, reload: () => load(true), setItems, stats };
}

export function usePaymentSummary(filters: PaymentSummaryParams = {}, autoLoad = true) {
  const [summary, setSummary] = useState<PaymentAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const { from, to, status, resource_id, bucket } = filters;
  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await spacePaymentApi.getSummary({ from, to, status, resource_id, bucket });
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải thống kê thanh toán');
    } finally {
      setLoading(false);
    }
  }, [from, to, status, resource_id, bucket]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Initial fetch is the only entry point for the data.
    if (autoLoad) void reload();
  }, [reload, autoLoad]);

  return { summary, loading, error, reload };
}
