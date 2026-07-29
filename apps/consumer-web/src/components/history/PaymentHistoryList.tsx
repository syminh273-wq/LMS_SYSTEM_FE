'use client';

import * as React from 'react';
import Link from 'next/link';
import { CreditCard, CheckCircle2, Clock, XCircle, AlertTriangle, Loader2, FileText } from 'lucide-react';
import { Card, CardContent } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';
import type { PaymentListItem, PaymentStatus } from '@/lib/api/payment';

const STATUS_META: Record<PaymentStatus, { label: string; icon: React.ElementType; cls: string }> = {
  PENDING: { label: 'Đang chờ', icon: Clock, cls: 'text-warning bg-warning/10 ring-warning/30' },
  COMPLETED: { label: 'Thành công', icon: CheckCircle2, cls: 'text-success bg-success/10 ring-success/30' },
  FAILED: { label: 'Thất bại', icon: XCircle, cls: 'text-destructive bg-destructive/10 ring-destructive/30' },
  CANCELLED: { label: 'Đã hủy', icon: AlertTriangle, cls: 'text-muted-foreground bg-muted ring-border' },
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
      <div className="flex items-center justify-center py-16 text-muted-foreground">
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
            <Card>
              <CardContent className="p-4 sm:p-5 flex items-center gap-4">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                  <CreditCard size={20} strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-foreground truncate">{p.order_info || 'Đơn thanh toán'}</p>
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ring-1', meta.cls)}>
                      <Icon size={10} strokeWidth={2.5} />
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {p.resource_type === 'classroom' ? 'Lớp học' : p.resource_type === 'course' ? 'Khóa học' : 'Khác'}
                    {' · '}
                    {formatDate(p.created_at)}
                    {' · '}
                    Mã #{p.order_id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-extrabold text-foreground">{formatVND(p.amount)}</p>
                  <p className="text-[10px] text-primary font-semibold mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
    <div className="rounded-2xl border-2 border-dashed border-border bg-muted/50 p-12 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted mx-auto flex items-center justify-center text-muted-foreground">
        <FileText size={26} />
      </div>
      <h3 className="mt-4 text-sm font-bold text-foreground">Chưa có giao dịch nào</h3>
      <p className="mt-1 text-[12px] text-muted-foreground">Các giao dịch thanh toán MoMo của bạn sẽ hiển thị tại đây.</p>
    </div>
  );
}
