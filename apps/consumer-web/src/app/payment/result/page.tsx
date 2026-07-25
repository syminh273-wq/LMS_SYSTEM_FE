'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { paymentApi } from '@/lib/api';

function PaymentResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || searchParams.get('order_id');
  const resultCode = searchParams.get('resultCode');
  const message = searchParams.get('message') || searchParams.get('localMessage');
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'success' | 'failed'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    (async () => {
      if (!orderId) {
        setStatus('failed');
        setErrorMsg('Thiếu mã đơn hàng.');
        return;
      }
      try {
        const payment = await paymentApi.findByOrderId(orderId);
        if (!payment) {
          setStatus('failed');
          setErrorMsg('Không tìm thấy đơn hàng.');
          return;
        }
        setStatus('redirecting');
        const invoiceUrl = `/consumer/invoices/${orderId}`;
        router.replace(invoiceUrl);
        return;
      } catch (err) {
        setStatus('failed');
        setErrorMsg(err instanceof Error ? err.message : 'Không thể tra cứu đơn hàng');
      }
    })();
  }, [orderId, resultCode, message, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="border-border">
          <CardContent className="p-8 text-center space-y-5">
            {(status === 'loading' || status === 'redirecting') && (
              <>
                <Loader2 size={48} className="mx-auto text-indigo-600 animate-spin" />
                <h2 className="text-xl font-bold">
                  {status === 'loading' ? 'Đang xử lý kết quả thanh toán...' : 'Đang chuyển hướng...'}
                </h2>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle2 size={64} className="mx-auto text-emerald-500" />
                <h2 className="text-xl font-bold">Thanh toán thành công</h2>
                <Button onClick={() => router.push('/consumer/classroom')} className="rounded-xl font-bold">
                  Về danh sách lớp
                </Button>
              </>
            )}

            {status === 'failed' && (
              <>
                <XCircle size={64} className="mx-auto text-rose-500" />
                <h2 className="text-xl font-bold">Không thể xử lý kết quả</h2>
                <p className="text-slate-500 text-sm">{errorMsg}</p>
                <Button
                  onClick={() => router.push('/consumer/classroom')}
                  variant="outline"
                  className="rounded-xl"
                >
                  Về danh sách lớp
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-slate-400" />
        </div>
      }
    >
      <PaymentResultContent />
    </Suspense>
  );
}
