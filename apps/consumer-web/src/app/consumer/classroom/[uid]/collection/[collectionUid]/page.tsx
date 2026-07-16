'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Trophy,
  Award,
  CheckCircle2,
  Circle,
  ChevronRight,
  Gamepad2,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { useTranslation } from '@shared/components/LocaleProvider';
import { toast } from 'sonner';
import { consumerQuizCollectionApi } from '@/lib/api/quiz-collection';
import type {
  QuizCollectionDetail,
  QuizCollectionProgress,
  IssuedCertificate,
} from '@/lib/api/types';

interface Props {
  params: Promise<{ uid: string; collectionUid: string }>;
}

type Mode = 'game' | 'certificate';

export default function CollectionDetailPage({ params }: Props) {
  const router = useRouter();
  const { t } = useTranslation();
  const { uid: classroomUid, collectionUid } = use(params);
  const [detail, setDetail] = useState<QuizCollectionDetail | null>(null);
  const [progress, setProgress] = useState<QuizCollectionProgress | null>(null);
  const [certificate, setCertificate] = useState<IssuedCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCert, setLoadingCert] = useState(false);
  const [mode, setMode] = useState<Mode>('game');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const d = await consumerQuizCollectionApi.retrieve(collectionUid, classroomUid);
        setDetail(d);
        try {
          const p = await consumerQuizCollectionApi.getProgress(collectionUid, classroomUid);
          setProgress(p);
          if (p.is_completed && d.certificate_id) {
            setMode('certificate');
          }
        } catch { /* ignore */ }
        if (d.certificate_id) {
          try {
            const cert = await consumerQuizCollectionApi.getCertificate(collectionUid, classroomUid);
            setCertificate(cert);
          } catch { /* not yet issued */ }
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : t('quizCollection.load_error'));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [classroomUid, collectionUid, t]);

  const handleSelectMode = (next: Mode) => {
    if (next === 'certificate' && !progress?.is_completed) return;
    if (next === 'certificate' && !detail?.certificate_id) return;
    setMode(next);
    if (next === 'certificate' && !certificate && detail?.certificate_id) {
      void loadCertificate();
    }
  };

  const loadCertificate = async () => {
    try {
      setLoadingCert(true);
      const cert = await consumerQuizCollectionApi.getCertificate(collectionUid, classroomUid);
      setCertificate(cert);
    } catch { /* not yet issued */ }
    finally {
      setLoadingCert(false);
    }
  };

  if (loading || !detail) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  const passedSet = new Set(progress?.passed_quiz_ids ?? []);
  const certUnlocked = !!progress?.is_completed && !!detail.certificate_id;
  const hasCertificateConfig = !!detail.certificate_id;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-5">
      <button
        onClick={() => router.push(`/consumer/classroom/${classroomUid}/collection`)}
        className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        {t('quizCollection.title')}
      </button>

      <header>
        <h1 className="text-2xl font-black text-foreground">{detail.title}</h1>
        {detail.description && (
          <p className="text-sm text-muted-foreground mt-1">{detail.description}</p>
        )}
      </header>

      {progress && progress.total > 0 && (
        <section className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              {t('quizCollection.progress_label')}
            </h2>
            <span className="text-sm font-black text-foreground">
              {t('quizCollection.progress_percent', undefined, { percent: Math.round(progress.percent) })}
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                progress.is_completed ? 'bg-amber-500' : 'bg-primary-brand'
              }`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {t('quizCollection.card_progress', undefined, { done: progress.passed, total: progress.total })}
          </p>
        </section>
      )}

      <div className="bg-card border border-border rounded-2xl p-1.5 flex gap-1">
        <button
          type="button"
          onClick={() => handleSelectMode('game')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            mode === 'game'
              ? 'bg-primary-brand text-white shadow-sm'
              : 'text-muted-foreground hover:bg-muted/40'
          }`}
        >
          <Gamepad2 size={16} />
          {t('quizCollection.mode_game')}
        </button>
        <button
          type="button"
          onClick={() => handleSelectMode('certificate')}
          disabled={!certUnlocked}
          title={!certUnlocked ? t('quizCollection.mode_certificate_locked') : undefined}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            mode === 'certificate'
              ? 'bg-amber-500 text-white shadow-sm'
              : certUnlocked
              ? 'text-muted-foreground hover:bg-muted/40'
              : 'text-muted-foreground/50 cursor-not-allowed'
          }`}
        >
          {certUnlocked ? <Award size={16} /> : <Lock size={14} />}
          {t('quizCollection.mode_certificate')}
        </button>
      </div>

      {mode === 'game' && (
        <section className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            {t('quizCollection.items_section')}
          </h2>
          {detail.items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">{t('quizCollection.items_empty')}</p>
          ) : (
            <div className="space-y-2">
              {detail.items.map((item, idx) => {
                const passed = passedSet.has(item.quiz_id);
                return (
                  <button
                    key={item.quiz_id}
                    onClick={() => router.push(`/consumer/classroom/${classroomUid}/quiz/${item.quiz_id}`)}
                    className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl border border-border hover:bg-muted/30 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-primary-brand/10 text-primary-brand text-xs font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    {passed ? (
                      <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                    ) : (
                      <Circle size={20} className="text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">Quiz #{idx + 1}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {passed ? t('quizCollection.quiz_status_passed') : t('quizCollection.quiz_status_not_started')}
                      </p>
                    </div>
                    <Gamepad2 size={16} className="text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {mode === 'certificate' && (
        <section className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Award size={14} className="text-amber-500" />
            {t('quizCollection.completion_section')}
          </h2>
          {loadingCert ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : !hasCertificateConfig ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Award size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">{t('quizCollection.mode_certificate_empty_no_cert')}</p>
            </div>
          ) : certificate ? (
            <div className="rounded-2xl p-5 bg-gradient-to-r from-amber-500/20 to-amber-400/10 border border-amber-500/30 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/30 text-amber-700 flex items-center justify-center shrink-0">
                <Trophy size={28} />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-black text-foreground">{t('quizCollection.certificate_card_title')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('quizCollection.certificate_card_issued_at', undefined, {
                    date: new Date(certificate.issued_at).toLocaleDateString('vi-VN'),
                  })}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-mono font-bold">
                  <ShieldCheck size={12} />
                  <span>{t('quizCollection.certificate_card_verification')}: {certificate.verification_code}</span>
                </div>
              </div>
              <Button
                onClick={() => router.push(`/consumer/certificate/${certificate.uid}`)}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs gap-2 shrink-0"
              >
                {t('quizCollection.certificate_card_view_btn')}
                <ChevronRight size={14} />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Award size={36} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">{t('quizCollection.completion_pending')}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
