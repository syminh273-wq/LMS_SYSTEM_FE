'use client';

import * as React from 'react';
import Link from 'next/link';
import { CreditCard, CheckCircle2, Clock, XCircle, AlertTriangle, Loader2, FileText } from 'lucide-react';
import { Card, CardContent } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import type { PaymentListItem, PaymentStatus } from '@/lib/api/payment';

const STATUS_META: Record<PaymentStatus, { label: string; icon: React.ElementType; cls: string }> = {
  PENDING: { label: 'Đang chờ', icon: Clock, cls: 'text-amber-700 bg-amber-50 ring-amber-200' },
  COMPLETED: { label: 'Thành công', icon: CheckCircle2, cls: 'text-emerald-700 bg-emerald-50 ring-emerald-200' },
  FAILED: { label: 'Thất bại', icon: XCircle, cls: 'text-rose-700 bg-rose-50 ring-rose-200' },
  CANCELLED: { label: 'Đã hủy', icon: AlertTriangle, cls: 'text-slate-600 bg-slate-50 ring-slate-200' },
};

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('vi-VN');
  } catch {
    return '';
  }
}

type Props = {
  items: PaymentListItem[];
  loading?: boolean;
};

export function PaymentHistoryList({ items, loading }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }
  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3">
      {items.map((p) => {
        const status = (p.status || 'PENDING') as PaymentStatus;
        const meta = STATUS_META[status] ?? STATUS_META.PENDING;
        const Icon = meta.icon;
        return (
          <Link
            key={p.uid}
            href={`/consumer/invoices/${p.order_id}`}
            className="block group"
          >
            <Card className="border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all">
              <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <CreditCard size={20} strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-900 truncate">{p.order_info || 'Đơn thanh toán'}</p>
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ring-1', meta.cls)}>
                      <Icon size={10} strokeWidth={2.5} />
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    {p.resource_type === 'classroom' ? 'Lớp học' : p.resource_type === 'course' ? 'Khóa học' : 'Khác'}
                    {' · '}
                    {formatDate(p.created_at)}
                    {' · '}
                    Mã #{p.order_id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-extrabold text-slate-900">{formatVND(p.amount)}</p>
                  <p className="text-[10px] text-indigo-600 font-semibold mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    Xem hóa đơn →
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
        <FileText size={26} />
      </div>
      <h3 className="mt-4 text-sm font-bold text-slate-700">Chưa có giao dịch nào</h3>
      <p className="mt-1 text-[12px] text-slate-500">Các giao dịch thanh toán MoMo của bạn sẽ hiển thị tại đây.</p>
    </div>
  );
}
