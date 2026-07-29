'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, History as HistoryIcon, RefreshCw } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { toast } from 'sonner';
import { paymentApi, classroomApi } from '@/lib/api';
import type { PaymentListItem, PaymentStatus } from '@/lib/api/payment';
import type { JoinHistoryItem } from '@/lib/api/classroom';
import { HistoryTabs, type HistoryTab } from '@/components/history/HistoryTabs';
import { PaymentHistoryList } from '@/components/history/PaymentHistoryList';
import { JoinHistoryList } from '@/components/history/JoinHistoryList';

const STATUS_FILTERS: { value: PaymentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'COMPLETED', label: 'Thành công' },
  { value: 'PENDING', label: 'Đang chờ' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

export default function ConsumerHistoryPage() {
  const router = useRouter();
  const [tab, setTab] = useState<HistoryTab>('payments');
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [joins, setJoins] = useState<JoinHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const [pmts, jn] = await Promise.all([
        paymentApi.getHistory({ limit: 100 }),
        classroomApi.getJoinHistory(100).catch(() => [] as JoinHistoryItem[]),
      ]);
      setPayments(pmts);
      setJoins(jn);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải lịch sử');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredPayments = useMemo(() => {
    if (statusFilter === 'all') return payments;
    return payments.filter((p) => p.status === statusFilter);
  }, [payments, statusFilter]);

  const counts = useMemo(
    () => ({ payments: payments.length, joins: joins.length }),
    [payments.length, joins.length],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-slate-600 hover:text-slate-900 -ml-2"
              aria-label="Quay lại"
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <HistoryIcon size={20} className="text-indigo-600" strokeWidth={2.4} />
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Lịch sử</h1>
              </div>
              <p className="text-[12px] text-slate-500 mt-0.5">
                Giao dịch thanh toán và các lớp bạn đã tham gia.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void load(true)}
              disabled={refreshing}
              className="rounded-lg"
            >
              <RefreshCw size={14} className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button asChild variant="ghost" size="sm" className="rounded-lg">
              <Link href="/consumer/dashboard">Về Dashboard</Link>
            </Button>
          </div>
        </div>

        <HistoryTabs value={tab} onChange={setTab} counts={counts} />

        {tab === 'payments' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {STATUS_FILTERS.map((s) => {
                const active = statusFilter === s.value;
                return (
                  <Button
                    key={s.value}
                    onClick={() => setStatusFilter(s.value)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors ring-1 ${
                      active
                        ? 'bg-indigo-600 text-white ring-indigo-600'
                        : 'bg-white text-slate-600 ring-slate-200 hover:ring-indigo-300 hover:text-indigo-700'
                    }`}
                  >
                    {s.label}
                  </Button>
                );
              })}
            </div>
            <PaymentHistoryList items={filteredPayments} loading={loading} />
          </div>
        ) : (
          <JoinHistoryList items={joins} loading={loading} />
        )}
      </div>
    </div>
  );
}
