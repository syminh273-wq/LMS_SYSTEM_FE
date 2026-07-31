'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, History as HistoryIcon, RefreshCw } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { toast } from 'sonner';
import { historyApi } from '@/lib/api';
import type { PaymentListItem, PaymentStatus } from '@/lib/api/payment';
import { PaymentHistoryList } from '@/components/history/PaymentHistoryList';

const STATUS_FILTERS: { value: PaymentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'COMPLETED', label: 'Thành công' },
  { value: 'PENDING', label: 'Đang chờ' },
  { value: 'FAILED', label: 'Thất bại' },
  { value: 'CANCELLED', label: 'Đã hủy' },
];

export default function ConsumerHistoryPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const { payments: pmts } = await historyApi.getOverview(100);
      setPayments(pmts);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="-ml-2"
              aria-label="Quay lại"
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <HistoryIcon size={20} className="text-primary" strokeWidth={2.4} />
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">Lịch sử</h1>
              </div>
              <p className="text-[12px] text-muted-foreground mt-0.5">
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
            >
              <RefreshCw size={14} className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/consumer/dashboard">Về Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FILTERS.map((s) => {
              const active = statusFilter === s.value;
              return (
                <Button
                  key={s.value}
                  variant={active ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(s.value)}
                >
                  {s.label}
                </Button>
              );
            })}
          </div>
          <PaymentHistoryList items={filteredPayments} loading={loading} />
        </div>
      </div>
    </div>
  );
}
