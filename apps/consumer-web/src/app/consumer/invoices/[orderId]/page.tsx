'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { paymentApi } from '@/lib/api';
import { classroomApi } from '@/lib/api';
import type { PaymentListItem } from '@/lib/api/payment';
import type { Classroom } from '@/lib/api/types';
import { InvoiceCard } from '@/components/payment/InvoiceCard';

type ResolveState =
  | { kind: 'loading' }
  | { kind: 'not-found' }
  | { kind: 'ready'; payment: PaymentListItem; classroom: Classroom | null };

function InvoiceContent() {
  const params = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const next = searchParams.get('next');
  const [state, setState] = useState<ResolveState>({ kind: 'loading' });
  const [autoRedirectTimer, setAutoRedirectTimer] = useState(0);

  const orderId = params?.orderId || '';

  useEffect(() => {
    if (!orderId) {
      setState({ kind: 'not-found' });
      return;
    }
    let cancelled = false;
    (async () => {
      const payment = await paymentApi.findByOrderId(orderId);
      if (cancelled) return;
      if (!payment) {
        setState({ kind: 'not-found' });
        return;
      }
      let classroom: Classroom | null = null;
      if (payment.resource_type === 'classroom' && payment.resource_id) {
        try {
          classroom = await classroomApi.retrieve(payment.resource_id);
        } catch {
          classroom = null;
        }
      }
      if (cancelled) return;
      setState({ kind: 'ready', payment, classroom });
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    if (state.kind !== 'ready') return;
    if (state.payment.status !== 'COMPLETED') return;
    if (!next) return;
    if (!state.payment.resource_id) return;
    if (state.payment.resource_type !== 'classroom') return;
    setAutoRedirectTimer(5);
    const interval = setInterval(() => {
      setAutoRedirectTimer((s) => {
        if (s <= 1) {
          clearInterval(interval);
          router.push(next);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state, next, router]);

  if (state.kind === 'loading') {
    return (
      <Center>
        <Loader2 size={40} className="animate-spin text-indigo-600" />
        <p className="mt-4 text-sm text-slate-500">Đang tải hóa đơn...</p>
      </Center>
    );
  }

  if (state.kind === 'not-found') {
    return (
      <Center>
        <AlertTriangle size={48} className="text-amber-500" />
        <h2 className="mt-4 text-lg font-bold text-slate-900">Không tìm thấy hóa đơn</h2>
        <p className="mt-2 text-sm text-slate-500 max-w-md">
          Hóa đơn này không tồn tại hoặc bạn không có quyền truy cập. Vui lòng kiểm tra lại mã đơn hàng.
        </p>
        <div className="flex gap-2 mt-6">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/consumer/history">Xem lịch sử</Link>
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/consumer/dashboard">Về Dashboard</Link>
          </Button>
        </div>
      </Center>
    );
  }

  const { payment, classroom } = state;
  const teacherName = (classroom as unknown as { teacher_name?: string } | null)?.teacher_name || null;
  const isFreeAutoRedirect =
    payment.status === 'COMPLETED' &&
    next &&
    payment.resource_type === 'classroom' &&
    payment.resource_id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-slate-600 hover:text-slate-900 -ml-2"
        >
          <ArrowLeft size={15} className="mr-1" />
          Quay lại
        </Button>

        {isFreeAutoRedirect && autoRedirectTimer > 0 && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 font-medium flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Tự động chuyển đến lớp trong {autoRedirectTimer}s...
          </div>
        )}

        <InvoiceCard
          payment={payment}
          classroomName={classroom?.name ?? null}
          teacherName={teacherName}
        />

        <p className="text-center text-[12px] text-slate-500">
          Mọi thắc mắc vui lòng liên hệ hỗ trợ qua trang{' '}
          <Link href="/consumer/settings" className="text-indigo-600 hover:underline font-semibold">
            Cài đặt
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">{children}</div>
    </div>
  );
}

export default function InvoicePage() {
  return (
    <Suspense
      fallback={
        <Center>
          <Loader2 size={32} className="animate-spin text-slate-400" />
        </Center>
      }
    >
      <InvoiceContent />
    </Suspense>
  );
}
