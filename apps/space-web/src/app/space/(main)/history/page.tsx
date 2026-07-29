'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wallet, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { usePaymentList, usePaymentSummary } from '@/lib/hooks/use-payment-stats';
import type {
  PaymentListItem,
  PaymentStatus,
  PaymentSummaryParams,
} from '@/lib/api/payment';
import { PaymentHistoryList } from '@/components/history/PaymentHistoryList';
import { PaymentStatusFilter } from '@/components/history/PaymentStatusFilter';
import { PaymentStatsCards, formatRevenue } from '@/components/history/PaymentStatsCards';
import { ClassroomFilter } from '@/components/history/ClassroomFilter';
import { RevenueTrendChart } from '@/components/history/RevenueTrendChart';
import { PaymentStatusDonut } from '@/components/history/PaymentStatusDonut';
import { DateRangeFilter, type DateRangeValue } from '@/components/history/DateRangeFilter';

function toIsoStart(date: string | null): string | undefined {
  if (!date) return undefined;
  return `${date}T00:00:00.000Z`;
}

function toIsoEnd(date: string | null): string | undefined {
  if (!date) return undefined;
  return `${date}T23:59:59.999Z`;
}

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

  const summaryFilters: PaymentSummaryParams = useMemo(
    () => ({
      from: toIsoStart(dateRange.from),
      to: toIsoEnd(dateRange.to),
      resource_id: classroomUid === 'all' ? undefined : classroomUid,
      status: statusFilter,
    }),
    [dateRange.from, dateRange.to, classroomUid, statusFilter]
  );

  const { items, loading, refreshing, reload, error } = usePaymentList({
    resourceId: classroomUid === 'all' ? undefined : classroomUid,
    status: 'all',
    limit: 200,
  });

  const { summary, loading: summaryLoading, reload: reloadSummary, error: summaryError } =
    usePaymentSummary(summaryFilters);

  const filtered = useMemo<PaymentListItem[]>(() => {
    if (statusFilter === 'all') return items;
    return items.filter((p) => (p.status || '').toUpperCase() === statusFilter);
  }, [items, statusFilter]);

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

  const handleRefresh = async () => {
    await Promise.all([reload(), reloadSummary()]);
  };

  const headerStats = useMemo(() => {
    if (!summary) {
      return [
        { label: 'Tổng doanh thu', value: formatRevenue(0), tone: 'indigo' as const },
        { label: 'Tổng giao dịch', value: '0', tone: 'slate' as const },
        { label: 'Đã thanh toán', value: formatRevenue(0), tone: 'emerald' as const },
        { label: 'Đang chờ', value: formatRevenue(0), tone: 'amber' as const },
        { label: 'Đã hoàn tiền', value: formatRevenue(0), tone: 'slate' as const },
        { label: 'Thanh toán lỗi', value: '0', tone: 'rose' as const },
      ];
    }
    const k = summary.kpis;
    return [
      { label: 'Tổng doanh thu', value: formatRevenue(k.total_revenue), tone: 'indigo' as const },
      { label: 'Tổng giao dịch', value: String(k.total_transactions), tone: 'slate' as const },
      { label: 'Đã thanh toán', value: formatRevenue(k.total_paid_amount), tone: 'emerald' as const },
      { label: 'Đang chờ', value: formatRevenue(k.total_pending_amount), tone: 'amber' as const },
      { label: 'Đã hoàn tiền', value: formatRevenue(k.refunded_amount), tone: 'slate' as const },
      { label: 'Thanh toán lỗi', value: String(k.failed_count), tone: 'rose' as const },
    ];
  }, [summary]);

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
              onClick={() => void handleRefresh()}
              disabled={refreshing || summaryLoading}
              className="rounded-lg"
            >
              <RefreshCw
                size={14}
                className={`mr-1 ${refreshing || summaryLoading ? 'animate-spin' : ''}`}
              />
              Làm mới
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-lg">
              <Link href="/space">Về Dashboard</Link>
            </Button>
          </div>
        </div>

        <PaymentStatsCards stats={headerStats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <RevenueTrendChart data={summary?.revenue_trend ?? []} loading={summaryLoading} />
          <PaymentStatusDonut
            data={summary?.status_distribution ?? []}
            loading={summaryLoading}
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap rounded-2xl border border-border bg-card p-3">
          <DateRangeFilter value={dateRange} onChange={handleDateChange} />
          <div className="h-5 w-px bg-border" />
          <ClassroomFilter value={classroomUid} onChange={handleClassroomChange} />
          <div className="h-5 w-px bg-border" />
          <PaymentStatusFilter value={statusFilter} onChange={handleStatusChange} />
        </div>

        {summary?.approximated && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
            <AlertTriangle size={14} />
            Dữ liệu lớn — kết quả có thể gần đúng (đã giới hạn 2.000 giao dịch gần nhất).
          </div>
        )}

        {summaryError && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {summaryError}
          </div>
        )}

        {summary && summary.by_classroom?.length > 0 && classroomUid === 'all' && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="text-[12px] font-extrabold uppercase tracking-wide text-muted-foreground mb-3">
              Tổng hợp theo lớp
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 font-bold">Lớp</th>
                    <th className="py-2 font-bold text-right">Giao dịch</th>
                    <th className="py-2 font-bold text-right">Thành công</th>
                    <th className="py-2 font-bold text-right">Đang chờ</th>
                    <th className="py-2 font-bold text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.by_classroom.map((row) => (
                    <tr
                      key={row.classroom_uid}
                      className="border-t border-border hover:bg-muted cursor-pointer"
                      onClick={() => handleClassroomChange(row.classroom_uid)}
                    >
                      <td className="py-2 font-semibold text-foreground">{row.classroom_name}</td>
                      <td className="py-2 text-right text-foreground">{row.total_count}</td>
                      <td className="py-2 text-right text-emerald-700 font-bold">
                        {row.completed_count}
                      </td>
                      <td className="py-2 text-right text-amber-700 font-bold">
                        {row.pending_count}
                      </td>
                      <td className="py-2 text-right text-primary-brand font-extrabold">
                        {formatRevenue(row.total_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
