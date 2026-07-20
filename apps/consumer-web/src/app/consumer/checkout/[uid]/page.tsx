'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@shared/components/LocaleProvider';
import { Loader2, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, Clock } from 'lucide-react';
import { Card, CardContent } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { toast } from 'sonner';
import { consumerCourseApi, type Course } from '@/lib/api';

const formatVnd = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 30000;

export default function CheckoutPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = use(params);
  const router = useRouter();
  const { t } = useTranslation();

  const [course, setCourse] = useState<Course | null>(null);
  const [status, setStatus] = useState<'initiating' | 'redirecting' | 'processing' | 'success' | 'failed' | 'timeout'>('initiating');
  const [errorMsg, setErrorMsg] = useState('');
  const startedRef = useRef(false);

  // Initiate payment on mount (once)
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    consumerCourseApi
      .checkout(uid)
      .then((res) => {
        if (res.pay_url) {
          setStatus('redirecting');
          // Open MoMo in same tab; when user returns, we poll for enrollment
          window.location.href = res.pay_url;
        } else {
          setStatus('failed');
          setErrorMsg('Không nhận được liên kết thanh toán');
        }
      })
      .catch((err) => {
        setStatus('failed');
        setErrorMsg(err instanceof Error ? err.message : 'Thanh toán thất bại');
      });
  }, [uid]);

  // Poll for enrollment after MoMo redirect back
  useEffect(() => {
    // Detect MoMo return — query params or just always poll on mount
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
        const access = await consumerCourseApi.access(uid);
        if (access.enrolled && access.redirect_to) {
          clearInterval(interval);
          setStatus('success');
          toast.success(t('course.checkout.success_title', 'Payment successful!'));
          setTimeout(() => router.push(access.redirect_to!), 800);
          return;
        }
      } catch (err) {
        // keep polling
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
          onClick={() => router.push(`/consumer/course/${uid}`)}
          className="mb-4 rounded-xl gap-2"
        >
          <ArrowLeft size={16} /> {t('common.back', 'Back')}
        </Button>

        <Card className="border-border">
          <CardContent className="p-8 text-center space-y-5">
            {status === 'initiating' && (
              <>
                <Loader2 size={48} className="mx-auto text-indigo-600 animate-spin" />
                <h2 className="text-xl font-bold">{t('course.detail.loading', 'Loading...')}</h2>
              </>
            )}

            {status === 'redirecting' && (
              <>
                <Loader2 size={48} className="mx-auto text-indigo-600 animate-spin" />
                <h2 className="text-xl font-bold">{t('course.checkout.processing_title', 'Processing payment')}</h2>
                <p className="text-slate-500 text-sm">{t('course.checkout.processing_desc', 'Redirecting to MoMo...')}</p>
              </>
            )}

            {status === 'processing' && (
              <>
                <div className="relative mx-auto w-20 h-20">
                  <Clock size={64} className="text-indigo-600 mx-auto" />
                  <Loader2 size={20} className="absolute inset-0 m-auto animate-spin text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold">{t('course.checkout.processing_title', 'Processing payment')}</h2>
                <p className="text-slate-500 text-sm">{t('course.checkout.processing_desc', 'Waiting for MoMo to confirm.')}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle2 size={64} className="mx-auto text-emerald-500" />
                <h2 className="text-xl font-bold">{t('course.checkout.success_title', 'Payment successful!')}</h2>
                <p className="text-slate-500 text-sm">{t('course.checkout.success_desc', 'Redirecting to your classroom...')}</p>
              </>
            )}

            {status === 'failed' && (
              <>
                <XCircle size={64} className="mx-auto text-rose-500" />
                <h2 className="text-xl font-bold">{t('course.checkout.failed_title', 'Payment failed')}</h2>
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
                    {t('course.checkout.retry', 'Retry')}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => router.push(`/consumer/course/${uid}`)}
                    className="rounded-xl"
                  >
                    {t('course.checkout.cancel', 'Cancel')}
                  </Button>
                </div>
              </>
            )}

            {status === 'timeout' && (
              <>
                <AlertTriangle size={64} className="mx-auto text-amber-500" />
                <h2 className="text-xl font-bold">{t('course.checkout.timeout_title', 'Still processing')}</h2>
                <p className="text-slate-500 text-sm">{t('course.checkout.timeout_desc', 'Please check back in a few minutes.')}</p>
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    onClick={() => router.push('/consumer/course')}
                    variant="outline"
                    className="rounded-xl"
                  >
                    {t('course.checkout.go_to_courses', 'Go to my courses')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
