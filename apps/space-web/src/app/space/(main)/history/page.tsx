'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wallet, RefreshCw } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { usePaymentList } from '@/lib/hooks/use-payment-stats';
import type { PaymentListItem, PaymentStatus } from '@/lib/api/payment';
import { PaymentHistoryList } from '@/components/history/PaymentHistoryList';
import { PaymentStatusFilter } from '@/components/history/PaymentStatusFilter';
import { ClassroomFilter } from '@/components/history/ClassroomFilter';
import { DateRangeFilter, type DateRangeValue } from '@/components/history/DateRangeFilter';

export default function SpaceHistoryPage() {
  return (
    <Suspense fallback={null}>
      <SpaceHistoryPageContent />
    </Suspense>
  );
}

function SpaceHistoryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classroomFromUrl = searchParams.get('classroom') || 'all';
  const statusFromUrl = (searchParams.get('status') as PaymentStatus | 'all' | null) || 'all';
  const fromUrl = searchParams.get('from') || null;
  const toUrl = searchParams.get('to') || null;

  const [classroomUid, setClassroomUid] = useState<string | 'all'>(classroomFromUrl);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>(statusFromUrl);
  const [dateRange, setDateRange] = useState<DateRangeValue>({ from: fromUrl, to: toUrl });

  const { items, loading, refreshing, reload, error } = usePaymentList({
    resourceId: classroomUid === 'all' ? undefined : classroomUid,
    status: 'all',
    limit: 200,
  });

  const filtered = useMemo<PaymentListItem[]>(() => {
    let out = items;
    if (statusFilter !== 'all') {
      out = out.filter((p) => (p.status || '').toUpperCase() === statusFilter);
    }
    if (dateRange.from) {
      const from = new Date(`${dateRange.from}T00:00:00.000Z`).getTime();
      out = out.filter((p) => p.created_at && new Date(p.created_at).getTime() >= from);
    }
    if (dateRange.to) {
      const to = new Date(`${dateRange.to}T23:59:59.999Z`).getTime();
      out = out.filter((p) => p.created_at && new Date(p.created_at).getTime() <= to);
    }
    return out;
  }, [items, statusFilter, dateRange.from, dateRange.to]);

  const updateUrl = (mutate: (sp: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const qs = params.toString();
    router.replace(qs ? `/space/history?${qs}` : '/space/history', { scroll: false });
  };

  const handleClassroomChange = (next: string | 'all') => {
    setClassroomUid(next);
    updateUrl((sp) => {
      if (next === 'all') sp.delete('classroom');
      else sp.set('classroom', next);
    });
  };

  const handleStatusChange = (next: PaymentStatus | 'all') => {
    setStatusFilter(next);
    updateUrl((sp) => {
      if (next === 'all') sp.delete('status');
      else sp.set('status', next);
    });
  };

  const handleDateChange = (next: DateRangeValue) => {
    setDateRange(next);
    updateUrl((sp) => {
      if (next.from) sp.set('from', next.from);
      else sp.delete('from');
      if (next.to) sp.set('to', next.to);
      else sp.delete('to');
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-muted-foreground hover:text-foreground -ml-2"
              aria-label="Quay lại"
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Wallet size={20} className="text-primary-brand" strokeWidth={2.4} />
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">
                  Lịch sử thanh toán
                </h1>
              </div>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Các giao dịch MoMo nhận được từ học viên trong các lớp của bạn.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void reload()}
              disabled={refreshing}
              className="rounded-lg"
            >
              <RefreshCw size={14} className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-lg">
              <Link href="/space">Về Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap rounded-2xl border border-border bg-card p-3">
          <DateRangeFilter value={dateRange} onChange={handleDateChange} />
          <div className="h-5 w-px bg-border" />
          <ClassroomFilter value={classroomUid} onChange={handleClassroomChange} />
          <div className="h-5 w-px bg-border" />
          <PaymentStatusFilter value={statusFilter} onChange={handleStatusChange} />
        </div>

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <PaymentHistoryList items={filtered} loading={loading} />
      </div>
    </div>
  );
}
