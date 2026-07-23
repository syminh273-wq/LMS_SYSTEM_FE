'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@shared/components/LocaleProvider';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, Clock } from 'lucide-react';
import { Card, CardContent } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { toast } from 'sonner';
import { classroomApi, Classroom } from '@/lib/api';
import { PaymentSuccessDialog } from '@/components/payment';

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 30000;

export default function ClassroomCheckoutPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = use(params);
  const router = useRouter();
  const { t } = useTranslation();

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [status, setStatus] = useState<'initiating' | 'redirecting' | 'processing' | 'success' | 'failed' | 'timeout'>('initiating');
  const [errorMsg, setErrorMsg] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await classroomApi.retrieve(uid);
        if (!cancelled) setClassroom(data);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [uid]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      try {
        const access = await classroomApi.access(uid);
        if (access.pending_payment?.pay_url) {
          setStatus('redirecting');
          window.location.href = access.pending_payment.pay_url;
          return;
        }
      } catch {}

      try {
        const res = await classroomApi.checkout(uid);
        if (res.pay_url) {
          setStatus('redirecting');
          window.location.href = res.pay_url;
        } else {
          setStatus('failed');
          setErrorMsg('Không nhận được liên kết thanh toán');
        }
      } catch (err) {
        setStatus('failed');
        setErrorMsg(err instanceof Error ? err.message : 'Thanh toán thất bại');
      }
    })();
  }, [uid]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const resultCode = url.searchParams.get('resultCode');
    const isReturn = resultCode !== null;
    if (!isReturn) return;
    setStatus('processing');

    let elapsed = 0;
    const interval = setInterval(async () => {
      elapsed += POLL_INTERVAL_MS;
      try {
        const access = await classroomApi.access(uid);
        if (access.has_access) {
          clearInterval(interval);
          setStatus('success');
          toast.success(t('classroom.payment.success_title', 'Thanh toán thành công!'));
          setSuccessOpen(true);
          return;
        }
      } catch (err) {
      }
      if (elapsed >= POLL_TIMEOUT_MS) {
        clearInterval(interval);
        setStatus('timeout');
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [uid, router, t]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Button
          variant="ghost"
          onClick={() => router.push(`/consumer/classroom/${uid}`)}
          className="mb-4 rounded-xl gap-2"
        >
          <ArrowLeft size={16} /> Quay lại lớp học
        </Button>

        <Card className="border-border">
          <CardContent className="p-8 text-center space-y-5">
            {classroom && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lớp học</div>
                <div className="text-lg font-black text-foreground">{classroom.name}</div>
                {classroom.price_vnd ? (
                  <div className="text-sm font-bold text-amber-600">
                    {(classroom.price_vnd).toLocaleString('vi-VN')}đ
                  </div>
                ) : null}
              </div>
            )}

            {status === 'initiating' && (
              <>
                <Loader2 size={48} className="mx-auto text-indigo-600 animate-spin" />
                <h2 className="text-xl font-bold">Đang khởi tạo thanh toán...</h2>
              </>
            )}

            {status === 'redirecting' && (
              <>
                <Loader2 size={48} className="mx-auto text-indigo-600 animate-spin" />
                <h2 className="text-xl font-bold">Đang chuyển đến MoMo...</h2>
              </>
            )}

            {status === 'processing' && (
              <>
                <div className="relative mx-auto w-20 h-20">
                  <Clock size={64} className="text-indigo-600 mx-auto" />
                  <Loader2 size={20} className="absolute inset-0 m-auto animate-spin text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold">Đang xác nhận thanh toán...</h2>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle2 size={64} className="mx-auto text-emerald-500" />
                <h2 className="text-xl font-bold">Thanh toán thành công!</h2>
                <p className="text-slate-500 text-sm">Đang mở khóa nội dung lớp học...</p>
              </>
            )}

            {status === 'failed' && (
              <>
                <XCircle size={64} className="mx-auto text-rose-500" />
                <h2 className="text-xl font-bold">Thanh toán thất bại</h2>
                <p className="text-slate-500 text-sm">{errorMsg}</p>
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={() => {
                      startedRef.current = false;
                      setStatus('initiating');
                      setErrorMsg('');
                    }}
                    className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold"
                  >
                    Thử lại
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => router.push(`/consumer/classroom/${uid}`)}
                    className="rounded-xl"
                  >
                    Hủy
                  </Button>
                </div>
              </>
            )}

            {status === 'timeout' && (
              <>
                <AlertTriangle size={64} className="mx-auto text-amber-500" />
                <h2 className="text-xl font-bold">Đang xử lý</h2>
                <p className="text-slate-500 text-sm">Vui lòng quay lại lớp học sau vài phút để kiểm tra.</p>
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={() => router.push(`/consumer/classroom/${uid}`)}
                    variant="outline"
                    className="rounded-xl"
                  >
                    Quay lại lớp học
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <PaymentSuccessDialog
        open={successOpen}
        variant="classroom"
        classroomUid={uid}
        classroomName={classroom?.name}
        onClose={() => setSuccessOpen(false)}
      />
    </div>
  );
}
