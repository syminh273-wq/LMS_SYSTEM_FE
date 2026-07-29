'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Loader2, ChevronRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@shared/components/LocaleProvider';
import { toast } from 'sonner';
import { consumerQuizCollectionApi } from '@/lib/api/quiz-collection';
import type { IssuedCertificate } from '@/lib/api/types';

export default function CertificateWallPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [items, setItems] = useState<IssuedCertificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    consumerQuizCollectionApi.myCertificates()
      .then(setItems)
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : t('certificate.load_error')))
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">

        <div className="relative overflow-hidden rounded-2xl bg-warning p-6 sm:p-8 text-warning-foreground shadow-lg">
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-warning/50 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-16 h-16 rounded-xl bg-background/20 flex items-center justify-center shrink-0 border border-background/30">
              <Award size={32} strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/20 border border-background/30 text-[11px] font-semibold mb-2">
                <Sparkles size={11} />
                Thành tích của bạn
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 text-balance">
                Bức tranh thành tích
              </h1>
              <p className="text-warning-foreground/80 text-[14px] max-w-lg">
                Tổng hợp các chứng chỉ bạn đã đạt được trong hành trình học tập.
              </p>
            </div>
            <div className="flex items-baseline gap-1.5 sm:flex-col sm:items-end">
              <span className="text-4xl sm:text-5xl font-bold tabular-nums">{items.length}</span>
              <span className="text-[12px] text-warning-foreground/80">chứng chỉ</span>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-[18px] sm:text-[20px] font-bold text-foreground tracking-tight">
              {t('certificate.wall_title')}
            </h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {t('certificate.wall_subtitle')}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={28} className="animate-spin text-warning" />
            <p className="text-[12.5px] text-muted-foreground">Đang tải chứng chỉ...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 px-6 bg-card border-2 border-dashed border-border rounded-2xl">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-warning/10 flex items-center justify-center">
              <Award size={36} className="text-warning" />
            </div>
            <h3 className="text-[16px] font-bold text-foreground mb-1">Chưa có chứng chỉ nào</h3>
            <p className="text-[13.5px] text-muted-foreground max-w-sm mx-auto">
              Hoàn thành các bài kiểm tra để nhận chứng chỉ đầu tiên của bạn.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {items.map((c, idx) => (
              <div
                key={c.uid}
                onClick={() => router.push(`/consumer/certificate/${c.uid}`)}
                style={{ animationDelay: `${Math.min(idx, 8) * 40}ms` }}
                className="group bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:border-warning/50 transition-all cursor-pointer card-elevated animate-fade-up"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center text-warning">
                    <Award size={22} strokeWidth={1.8} />
                  </div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-[10.5px] font-semibold border border-success/20">
                    <ShieldCheck size={10} />
                    Verified
                  </div>
                </div>

                <p className="text-[14px] font-semibold text-foreground line-clamp-2 leading-snug">
                  {c.title || c.collection_title
                    || t('certificate.for_collection', undefined, { title: c.collection_id })}
                </p>

                {(c.collection_description || c.description) && (
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                    {c.description || c.collection_description}
                  </p>
                )}

                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground">
                      {t('certificate.issued_on', undefined, {
                        date:
                          c.issued_at_display ||
                          (c.issued_at
                            ? new Date(c.issued_at).toLocaleDateString()
                            : '—'),
                      })}
                    </p>
                    {c.classroom_name && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {c.classroom_name}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-mono tracking-wider truncate">
                      {c.verification_code}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground group-hover:text-warning group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
