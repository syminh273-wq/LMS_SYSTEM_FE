'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Copy, Check, Share2, Trophy, X } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { useTranslation } from '@shared/components/LocaleProvider';
import { toast } from 'sonner';
import type { IssuedCertificate } from '@/lib/api/types';

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  rotation: number;
  size: number;
  drift: number;
}

const CONFETTI_COLORS = [
  '#fbbf24', // amber-400
  '#f59e0b', // amber-500
  '#f97316', // orange-500
  '#ef4444', // red-500
  '#ec4899', // pink-500
  '#a855f7', // purple-500
  '#6366f1', // indigo-500
  '#0ea5e9', // sky-500
  '#10b981', // emerald-500
];

function Confetti({ count = 80 }: { count?: number }) {
  const pieces = React.useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 2.2 + Math.random() * 1.8,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      size: 6 + Math.random() * 8,
      drift: (Math.random() - 0.5) * 240,
    }));
  }, [count]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {pieces.map(p => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: '-12px',
            width: `${p.size}px`,
            height: `${p.size * 0.4}px`,
            background: p.color,
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall ${p.duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${p.delay}s forwards`,
            ['--drift' as never]: `${p.drift}px`,
            borderRadius: '2px',
            opacity: 0.95,
          }}
        />
      ))}
    </div>
  );
}

interface CertificateCelebrationProps {
  certificates: IssuedCertificate[];
  onClose?: () => void;
}

export function CertificateCelebration({ certificates, onClose }: CertificateCelebrationProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [seenUids, setSeenUids] = useState<Set<string>>(new Set());
  const closedRef = useRef(false);

  const current = certificates[currentIdx];

  useEffect(() => {
    if (!current) return;
    const seen = new Set(seenUids);
    seen.add(current.uid);
    setSeenUids(seen);
    try {
      const stored = JSON.parse(localStorage.getItem('seen_cert_uids') || '[]') as string[];
      if (!stored.includes(current.uid)) {
        stored.push(current.uid);
        localStorage.setItem('seen_cert_uids', JSON.stringify(stored));
        window.dispatchEvent(new Event('lms:certs-seen'));
      }
    } catch {
      /* ignore */
    }
  }, [current?.uid]);

  const handleClose = () => {
    closedRef.current = true;
    setOpen(false);
    setTimeout(() => {
      onClose?.();
    }, 250);
  };

  const handleView = () => {
    if (!current) return;
    router.push(`/consumer/certificate/${current.uid}`);
  };

  const handleShare = async () => {
    if (!current) return;
    const url = `${window.location.origin}/verify/${current.verification_code}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: t('quizCollection.celebration_title'),
          text: t('quizCollection.celebration_subtitle'),
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success(t('certificate.copied'));
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user cancelled */
    }
  };

  const handleNext = () => {
    if (currentIdx < certificates.length - 1) {
      setCurrentIdx(i => i + 1);
    } else {
      handleClose();
    }
  };

  if (!open || !current) return null;

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translate3d(0, -20px, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--drift), 110vh, 0) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes cert-celebrate-pop {
          0% { transform: scale(0.6) rotate(-8deg); opacity: 0; }
          50% { transform: scale(1.08) rotate(3deg); opacity: 1; }
          75% { transform: scale(0.97) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes cert-rays {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <Confetti />

      <div
        className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
        onClick={handleClose}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="relative w-full max-w-md rounded-3xl bg-gradient-to-br from-amber-50 via-white to-amber-100 p-6 shadow-2xl ring-1 ring-amber-200"
          onClick={e => e.stopPropagation()}
          style={{ animation: 'cert-celebrate-pop 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-3 top-3 rounded-full p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          <div className="relative flex flex-col items-center text-center space-y-4">
            <div className="relative w-24 h-24">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg, #fbbf24, #f59e0b, #f97316, #fbbf24)',
                  animation: 'cert-rays 8s linear infinite',
                  filter: 'blur(8px)',
                  opacity: 0.6,
                }}
              />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-300">
                <Trophy size={36} className="text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                {t('quizCollection.celebration_title')}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('quizCollection.celebration_subtitle')}
              </p>
              {(current.title || current.collection_title) && (
                <p className="text-base font-black text-amber-700 mt-2">
                  {current.title || current.collection_title}
                </p>
              )}
              {current.classroom_name && (
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {t('quizCollection.celebration_classroom_label')}: {current.classroom_name}
                </p>
              )}
              {current.student_name && (
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {t('quizCollection.celebration_student_label')}: {current.student_name}
                </p>
              )}
            </div>

            <div className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 p-4 space-y-2 shadow-inner">
              <div className="flex items-center gap-2 justify-center">
                <Award size={16} className="text-amber-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                  {t('quizCollection.celebration_verification_label')}
                </span>
              </div>
              <div className="font-mono text-base font-black text-slate-900 dark:text-slate-100 tracking-widest break-all">
                {current.verification_code}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {current.issued_at_display ||
                  (current.issued_at
                    ? new Date(current.issued_at).toLocaleString('vi-VN')
                    : '')}
              </div>
            </div>

            {certificates.length > 1 && (
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {currentIdx + 1} / {certificates.length}
              </div>
            )}

            <div className="flex w-full gap-2 pt-1">
              <Button
                onClick={handleShare}
                variant="outline"
                className="flex-1 h-11 rounded-xl font-bold gap-1.5"
              >
                {copied ? <Check size={14} /> : <Share2 size={14} />}
                {t('quizCollection.celebration_share_btn')}
              </Button>
              <Button
                onClick={handleView}
                className="flex-1 h-11 rounded-xl font-bold gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
              >
                <Award size={14} />
                {t('quizCollection.celebration_view_btn')}
              </Button>
            </div>

            {certificates.length > 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300"
              >
                {currentIdx < certificates.length - 1
                  ? `→ ${certificates[currentIdx + 1].verification_code.slice(0, 6)}…`
                  : t('quizCollection.celebration_stay_btn')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClose}
                className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300"
              >
                {t('quizCollection.celebration_stay_btn')}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
