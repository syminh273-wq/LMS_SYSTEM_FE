'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Loader2, ChevronRight, Copy, Check } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-5">
      <div>
        <h1 className="text-2xl font-black text-foreground">{t('certificate.wall_title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('certificate.wall_subtitle')}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 size={32} className="animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border-2 border-dashed border-border rounded-2xl">
          <Award size={40} className="mb-3 opacity-30" />
          <p className="text-sm font-medium">{t('certificate.empty')}</p>
          <p className="text-xs mt-1">{t('certificate.empty_hint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(c => (
            <div
              key={c.uid}
              onClick={() => router.push(`/consumer/certificate/${c.uid}`)}
              className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:border-amber-500/50 transition-all cursor-pointer group flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                <Award size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {t('certificate.for_collection', undefined, { title: c.collection_id })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {t('certificate.issued_on', undefined, {
                    date: new Date(c.issued_at).toLocaleDateString(),
                  })}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1 font-mono tracking-wider">
                  {c.verification_code}
                </p>
              </div>
              <ChevronRight size={16} className="text-muted-foreground group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
