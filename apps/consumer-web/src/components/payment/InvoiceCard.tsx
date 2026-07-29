'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock, XCircle, AlertTriangle, Copy, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import type { PaymentListItem, PaymentStatus } from '@/lib/api/payment';

type InvoiceCardProps = {
  payment: PaymentListItem;
  classroomName?: string | null;
  courseName?: string | null;
  teacherName?: string | null;
};

const STATUS_META: Record<PaymentStatus, { label: string; icon: React.ElementType; cls: string }> = {
  PENDING: { label: 'Đang chờ thanh toán', icon: Clock, cls: 'text-amber-600 bg-amber-50 ring-amber-200' },
  COMPLETED: { label: 'Đã thanh toán', icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50 ring-emerald-200' },
  FAILED: { label: 'Thanh toán thất bại', icon: XCircle, cls: 'text-rose-600 bg-rose-50 ring-rose-200' },
  CANCELLED: { label: 'Đã hủy', icon: AlertTriangle, cls: 'text-slate-600 bg-slate-50 ring-slate-200' },
};

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('vi-VN');
  } catch {
    return '—';
  }
}

export function InvoiceCard({ payment, classroomName, courseName, teacherName }: InvoiceCardProps) {
  const status = (payment.status || 'PENDING') as PaymentStatus;
  const meta = STATUS_META[status] ?? STATUS_META.PENDING;
  const Icon = meta.icon;
  const targetName = classroomName || courseName || payment.order_info || 'Đơn thanh toán';
  const isClassroom = payment.resource_type === 'classroom';

  const copy = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text).then(() => toast.success(`Đã sao chép ${label}`));
    }
  };

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-indigo-50 via-white to-white border-b border-slate-100 px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <FileText size={20} strokeWidth={2.2} />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Hóa đơn thanh toán</CardTitle>
              <p className="text-[12px] text-slate-500 mt-0.5">Mã đơn hàng #{payment.order_id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <div className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold ring-1', meta.cls)}>
            <Icon size={13} strokeWidth={2.5} />
            {meta.label}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Mô tả">
            <p className="text-sm font-semibold text-slate-900">{payment.order_info || 'Thanh toán đơn hàng'}</p>
            {isClassroom && classroomName && (
              <p className="text-[12px] text-slate-500 mt-0.5">Lớp: {classroomName}</p>
            )}
            {!isClassroom && courseName && (
              <p className="text-[12px] text-slate-500 mt-0.5">Khóa học: {courseName}</p>
            )}
            {teacherName && isClassroom && (
              <p className="text-[12px] text-slate-500 mt-0.5">Giáo viên: {teacherName}</p>
            )}
          </Field>

          <Field label="Số tiền">
            <p className="text-2xl font-extrabold text-indigo-600">{formatVND(payment.amount)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Đã bao gồm VAT (nếu có)</p>
          </Field>

          <Field label="Thời gian tạo">
            <p className="text-sm font-medium text-slate-800">{formatDate(payment.created_at)}</p>
          </Field>

          {payment.updated_at && payment.updated_at !== payment.created_at && (
            <Field label="Cập nhật lần cuối">
              <p className="text-sm font-medium text-slate-800">{formatDate(payment.updated_at)}</p>
            </Field>
          )}

          <Field label="Mã giao dịch MoMo" full>
            <div className="flex items-center gap-2">
              <code className="px-2 py-1 rounded-md bg-slate-100 text-[12px] font-mono text-slate-700 truncate">
                {payment.trans_id && payment.trans_id > 0 ? String(payment.trans_id) : payment.order_id}
              </code>
              <Button
                onClick={() => copy(payment.trans_id && payment.trans_id > 0 ? String(payment.trans_id) : payment.order_id, 'mã giao dịch')}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                aria-label="Sao chép mã"
              >
                <Copy size={13} />
              </Button>
            </div>
          </Field>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
          {isClassroom && payment.resource_id && status === 'COMPLETED' && (
            <Button asChild className="rounded-xl font-bold flex-1 sm:flex-none">
              <Link href={`/consumer/classroom/${payment.resource_id}`}>Vào lớp học</Link>
            </Button>
          )}
          {status === 'PENDING' && isClassroom && payment.resource_id && (
            <Button asChild variant="outline" className="rounded-xl font-bold flex-1 sm:flex-none">
              <Link href={`/consumer/classroom/checkout/${payment.resource_id}?order_id=${payment.order_id}`}>
                Tiếp tục thanh toán
              </Link>
            </Button>
          )}
          <Button asChild variant="ghost" className="rounded-xl font-bold flex-1 sm:flex-none">
            <Link href="/consumer/history">Xem lịch sử</Link>
          </Button>
          <Button asChild variant="ghost" className="rounded-xl font-bold flex-1 sm:flex-none">
            <Link href="/consumer/dashboard">Về Dashboard</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-1', full && 'sm:col-span-2')}>
      <span className="text-[11px] uppercase tracking-wide font-bold text-slate-500">{label}</span>
      {children}
    </div>
  );
}
