'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Award, Printer, Copy, Check, Loader2, Trophy } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { useTranslation } from '@shared/components/LocaleProvider';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import type { RootState } from '@/lib/redux/store';
import { consumerQuizCollectionApi } from '@/lib/api/quiz-collection';
import type { IssuedCertificate } from '@/lib/api/types';

interface Props {
  params: Promise<{ issuedCertUid: string }>;
}

export default function IssuedCertificateViewPage({ params }: Props) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const issuedUid = use(params).issuedCertUid;
  const profile = useSelector((state: RootState) => state.user.profile);
  const [cert, setCert] = useState<IssuedCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    consumerQuizCollectionApi.myCertificates()
      .then(list => {
        const found = list.find(c => c.uid === issuedUid);
        if (!found) throw new Error('not_found');
        setCert(found);
      })
      .catch(() => toast.error(t('certificate.cert_not_found')))
      .finally(() => setLoading(false));
  }, [issuedUid, t]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print();
  };

  const handleCopy = async () => {
    if (!cert) return;
    const url = `${window.location.origin}/verify/${cert.verification_code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t('certificate.copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };

  if (loading || !cert) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  const studentName =
    cert.student_name ||
    profile?.full_name ||
    profile?.username ||
    'Student';
  const collectionTitle =
    cert.collection_title || cert.title || t('certificate.collection_fallback');
  const certTitle = cert.title || collectionTitle;
  const certDescription = cert.description || cert.collection_description || '';
  const classroomName = cert.classroom_name || '';

  const issuedDate = cert.issued_at_display
    || (cert.issued_at
      ? new Date(cert.issued_at).toLocaleDateString(
          locale === 'vi' ? 'vi-VN' : 'en-US',
          { year: 'numeric', month: 'long', day: 'numeric' }
        )
      : '');

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-4 print:p-0 print:max-w-none">
      <div className="flex items-center justify-between print:hidden">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          className="flex items-center gap-1"
        >
          <ArrowLeft size={14} />
          {t('certificate.back_btn')}
        </Button>
        <div className="flex items-center gap-2">
          <Button onClick={handleCopy} variant="outline" size="sm" className="gap-2">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {t('certificate.share_btn')}
          </Button>
          <Button onClick={handlePrint} size="sm" className="bg-warning hover:bg-warning/90 text-warning-foreground gap-2">
            <Printer size={14} />
            {t('certificate.download_btn')}
          </Button>
        </div>
      </div>

      <article
        className="bg-card border-2 border-warning/30 rounded-3xl shadow-xl p-8 sm:p-12 text-center relative overflow-hidden print:shadow-none print:border-warning"
        style={{
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        }}
      >
        <div className="absolute top-4 left-4 w-16 h-16 border-2 border-warning/30 rounded-full" />
        <div className="absolute top-4 right-4 w-16 h-16 border-2 border-warning/30 rounded-full" />
        <div className="absolute bottom-4 left-4 w-16 h-16 border-2 border-warning/30 rounded-full" />
        <div className="absolute bottom-4 right-4 w-16 h-16 border-2 border-warning/30 rounded-full" />

        <div className="relative z-10 space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-warning/20 flex items-center justify-center text-warning">
              <Trophy size={40} />
            </div>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-warning">
              {t('certificate.view_title')}
            </p>
            {certTitle && (
              <p className="text-base sm:text-lg font-bold text-warning mt-2">
                {certTitle}
              </p>
            )}
            {certDescription && (
              <p className="text-xs text-muted-foreground mt-1 italic max-w-xl mx-auto">
                {certDescription}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-3">{t('certificate.presented_to')}</p>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground mt-2 break-words" style={{ fontFamily: 'serif' }}>
              {studentName}
            </h1>
            {cert.student_pid && (
              <p className="text-[11px] font-mono text-muted-foreground mt-1">
                ID: {cert.student_pid}
              </p>
            )}
          </div>

          <p className="text-sm text-muted-foreground italic">
            {t('certificate.for_completing')}
          </p>

          <div>
            <p className="text-lg font-bold text-warning">
              {collectionTitle}
            </p>
            {classroomName && (
              <p className="text-[11px] font-bold text-muted-foreground mt-1">
                {t('certificate.classroom_label', undefined, { name: classroomName })}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-warning/20 max-w-md mx-auto">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                {t('certificate.date_label')}
              </p>
              <p className="text-sm font-bold text-foreground mt-1">{issuedDate}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                {t('certificate.teacher_label')}
              </p>
              <p className="text-sm font-bold text-foreground mt-1 break-all">{cert.issued_by?.slice(0, 8) || '—'}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-warning/20">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              {t('certificate.verification_label')}
            </p>
            <p className="text-base font-mono font-bold text-warning mt-1 tracking-widest">
              {cert.verification_code}
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}
