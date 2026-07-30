'use client';

import * as React from 'react';
import { useState, useEffect, use, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { consumerQuizApi } from '@/lib/api/quiz';
import { classroomApi } from '@/lib/api/classroom';
import { consumerQuizCollectionApi } from '@/lib/api/quiz-collection';
import { CertificateCelebration } from '@/components/quiz/certificate-celebration';
import QuizLeaderboardModal from '@/components/quiz/QuizLeaderboardModal';
import type { QuizPublicDetail, QuizQuestionPublic, QuizResult, QuizAttemptRecord, IssuedCertificate } from '@/lib/api/types';
import {
  Loader2, ArrowLeft, CheckCircle2, XCircle, Trophy,
  RotateCcw, ChevronRight, Clock, Lock,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { toast } from 'sonner';

type GamePhase = 'loading' | 'intro' | 'playing' | 'result';
type Answer = 'a' | 'b' | 'c' | 'd';

interface Props {
  params: Promise<{ uid: string; quizUid: string }>;
}

type TimerTone = 'indigo' | 'amber' | 'urgent' | 'expired';

function TimerBadge({
  icon,
  label,
  title,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  tone: TimerTone;
}) {
  const toneClasses: Record<TimerTone, string> = {
    indigo: 'bg-primary/10 text-primary border-primary/20',
    amber: 'bg-warning/10 text-warning border-warning/20',
    urgent: 'bg-gradient-to-r from-destructive to-pink-500 text-white border-rose-400 shadow-lg shadow-rose-200 timer-shake',
    expired: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black border ${toneClasses[tone]} transition-colors duration-300`}
    >
      {icon}
      <span className="tabular-nums">{label}</span>
    </span>
  );
}

function fmtSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export default function QuizGamePage({ params }: Props) {
  const { uid: classroomUid, quizUid } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const examUid = searchParams.get('examUid');

  const [phase, setPhase] = useState<GamePhase>('loading');
  const [quiz, setQuiz] = useState<QuizPublicDetail | null>(null);
  const [pastAttempts, setPastAttempts] = useState<QuizAttemptRecord[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [selected, setSelected] = useState<Answer | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [celebrateCerts, setCelebrateCerts] = useState<IssuedCertificate[] | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // timer
  const [timeLeft, setTimeLeft] = useState(0);
  const [closesAtCountdown, setClosesAtCountdown] = useState<number | null>(null);
  const [closesAtDate, setClosesAtDate] = useState<Date | null>(null);
  const [forceSubmitted, setForceSubmitted] = useState(false);
  const startedAtRef = useRef<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closesAtRef = useRef<Date | null>(null);
  const autoSubmitFiredRef = useRef(false);
  const timeLeftRef = useRef(0);
  const closesAtCountdownRef = useRef<number | null>(null);
  const latestAnswersRef = useRef<Record<string, Answer>>({});
  const handleAutoSubmitRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    const load = async () => {
      try {
        const [data, attempts] = await Promise.all([
          consumerQuizApi.retrieve(quizUid, classroomUid),
          consumerQuizApi.listAttempts(quizUid, classroomUid),
        ]);
        const sorted = { ...data, questions: [...data.questions].sort((a, b) => a.order - b.order) };
        setQuiz(sorted);
        setPastAttempts(attempts);
        setPhase('intro');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Không thể tải quiz');
        setPhase('intro');
      }
    };
    void load();
  }, [quizUid]);

  // countdown timer during playing — 2 timers song song:
  //   - time_limit_seconds (per-attempt time limit)
  //   - closes_at (assignment-level deadline)
  // Timer nào chạm 0 sẽ trigger force-submit.
  useEffect(() => {
    if (phase !== 'playing') return;
    const hasAttemptTimer = !!quiz?.time_limit_seconds;
    const hasClosesTimer = !!closesAtRef.current;
    if (!hasAttemptTimer && !hasClosesTimer) return;
    autoSubmitFiredRef.current = false;
    timerRef.current = setInterval(() => {
      const attemptLeft = timeLeftRef.current;
      const closesLeft = closesAtCountdownRef.current ?? -1;

      // Clamp: never go below 0. Stop decrementing once either timer hits 0.
      if (attemptLeft === 0 || closesLeft === 0) {
        if (autoSubmitFiredRef.current) return;
        autoSubmitFiredRef.current = true;
        if (timerRef.current) clearInterval(timerRef.current);
        if (closesLeft === 0) setForceSubmitted(true);
        void handleAutoSubmitRef.current();
        return;
      }

      if (attemptLeft > 0) {
        const next = attemptLeft - 1;
        timeLeftRef.current = next;
        setTimeLeft(next);
      }
      if (closesLeft > 0) {
        const next = closesLeft - 1;
        closesAtCountdownRef.current = next;
        setClosesAtCountdown(next);
      }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleStartPlaying = () => {
    if (quiz?.closes_at && new Date(quiz.closes_at).getTime() <= Date.now()) {
      toast.error('Bài quiz đã quá thời gian cho phép.');
      return;
    }
    startedAtRef.current = new Date();
    autoSubmitFiredRef.current = false;
    setForceSubmitted(false);
    if (quiz?.time_limit_seconds) {
      timeLeftRef.current = quiz.time_limit_seconds;
      setTimeLeft(quiz.time_limit_seconds);
    } else {
      timeLeftRef.current = 0;
      setTimeLeft(0);
    }
    if (quiz?.closes_at) {
      const closeDate = new Date(quiz.closes_at);
      closesAtRef.current = closeDate;
      setClosesAtDate(closeDate);
      const nowMs = Date.now();
      const left = Math.max(0, Math.floor((closeDate.getTime() - nowMs) / 1000));
      closesAtCountdownRef.current = left;
      setClosesAtCountdown(left);
    } else {
      closesAtRef.current = null;
      closesAtCountdownRef.current = null;
      setClosesAtDate(null);
      setClosesAtCountdown(null);
    }
    setPhase('playing');
  };

  const currentQuestion: QuizQuestionPublic | undefined = quiz?.questions[currentIdx];
  const totalQuestions = quiz?.questions.length ?? 0;
  const isLast = currentIdx === totalQuestions - 1;

  const attemptCount = pastAttempts.length;
  const maxAttempts = quiz?.max_attempts ?? 0;
  const isBlocked = maxAttempts > 0 && attemptCount >= maxAttempts;
  const attemptsRemaining = maxAttempts > 0 ? maxAttempts - attemptCount : null;
  const isClosedBySchedule = !!(quiz?.closes_at && new Date(quiz.closes_at).getTime() <= Date.now());
  const isClosed = quiz?.is_closed === true || quiz?.is_expired === true || isClosedBySchedule;
  const isNotYetOpen = quiz?.is_not_yet_open === true;
  const isOpen = quiz?.is_open !== false;
  const canStart = isOpen && !isClosed && !isBlocked && !isNotYetOpen;

  const doSubmit = useCallback(async (finalAnswers: Record<string, Answer>) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const timeTaken = startedAtRef.current
        ? Math.floor((Date.now() - startedAtRef.current.getTime()) / 1000)
        : 0;

      if (examUid) {
        // Quiz is part of an exam — submit to exam endpoint so ExamSubmission is created
        await classroomApi.submitExam(examUid, {
          submission_type: 'online_quiz',
          answers: finalAnswers,
          time_taken_seconds: timeTaken,
        });
        // Build a minimal QuizResult-like object from the exam submission response
        // so the result screen still works
        const updated = await consumerQuizApi.listAttempts(quizUid, classroomUid);
        setPastAttempts(updated);
        const lastAttempt = updated[updated.length - 1];
        if (lastAttempt) {
          setResult({
            total: quiz?.questions.length ?? 0,
            correct: Math.round((lastAttempt.score_pct / 100) * (quiz?.questions.length ?? 0)),
            score: lastAttempt.score_pct,
            is_passed: lastAttempt.score_pct >= 50,
            passing_score: 50,
            attempt_number: lastAttempt.attempt_number,
            attempts_used: lastAttempt.attempt_number,
            attempts_remaining: null,
            results: [],
            show_explanation: false,
          });
        }
      } else {
        const res = await consumerQuizApi.submit(quizUid, {
          answers: finalAnswers,
          classroom_id: classroomUid,
          time_taken_seconds: timeTaken,
        });
        setResult(res);
        const updated = await consumerQuizApi.listAttempts(quizUid, classroomUid);
        setPastAttempts(updated);

        if (res.certificate_issued && res.certificate_issued.length > 0) {
          setCelebrateCerts(res.certificate_issued);
        } else {
          try {
            const all = await consumerQuizCollectionApi.myCertificates();
            const seen = new Set<string>(
              (() => {
                try {
                  return JSON.parse(localStorage.getItem('seen_cert_uids') || '[]') as string[];
                } catch {
                  return [];
                }
              })()
            );
            const fresh = all.filter(c => !seen.has(c.uid));
            const matchesHere = fresh.filter(
              c => c.classroom_id === classroomUid && !!c.issued_at && new Date(c.issued_at).getTime() > Date.now() - 5 * 60 * 1000
            );
            if (matchesHere.length > 0) {
              setCelebrateCerts(matchesHere);
            }
          } catch {
            /* ignore */
          }
        }
      }

      setPhase('result');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gửi câu trả lời thất bại');
    } finally {
      setSubmitting(false);
    }
  }, [quizUid, classroomUid, examUid, quiz]);

  const handleAutoSubmit = useCallback(async () => {
    await doSubmit({ ...answers });
  }, [answers, doSubmit]);

  // Keep refs in sync so the timer interval always reads the latest values
  useEffect(() => { latestAnswersRef.current = answers; }, [answers]);
  useEffect(() => { handleAutoSubmitRef.current = handleAutoSubmit; }, [handleAutoSubmit]);

  const handleAnswer = (option: Answer) => {
    if (selected !== null) return;
    setSelected(option);
  };

  const handleNext = useCallback(async () => {
    if (!currentQuestion || selected === null) return;
    const newAnswers = { ...answers, [currentQuestion.uid]: selected };
    setAnswers(newAnswers);
    if (isLast) {
      await doSubmit(newAnswers);
    } else {
      setCurrentIdx(prev => prev + 1);
      setSelected(null);
    }
  }, [currentQuestion, selected, answers, isLast, doSubmit]);

  const handleRestart = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentIdx(0);
    setAnswers({});
    setSelected(null);
    setResult(null);
    setTimeLeft(0);
    startedAtRef.current = null;
    setPhase('intro');
  };

  const OPTION_KEYS: Answer[] = ['a', 'b', 'c', 'd'];
  const OPTION_LABELS = { a: 'A', b: 'B', c: 'C', d: 'D' };

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-muted flex flex-col items-center justify-center p-4 text-center">
        <XCircle size={48} className="text-rose-400 mb-4" />
        <p className="font-bold text-foreground">{error}</p>
        <Button onClick={() => router.push(`/consumer/classroom/${classroomUid}`)} className="mt-6 rounded-xl bg-primary text-white">
          Quay lại lớp học
        </Button>
      </div>
    );
  }

  /* ── INTRO ── */
  if (phase === 'intro' && quiz) {
    const bestScore = pastAttempts.length > 0
      ? Math.max(...pastAttempts.map(a => a.score_pct))
      : null;
    const opensAtDate = quiz.opens_at ? new Date(quiz.opens_at) : null;
    const closesAtDate = quiz.closes_at ? new Date(quiz.closes_at) : null;
    const fmtOpensLocal = opensAtDate && !isNaN(opensAtDate.getTime())
      ? opensAtDate.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
      : null;
    const fmtClosesLocal = closesAtDate && !isNaN(closesAtDate.getTime())
      ? closesAtDate.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
      : null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary flex flex-col items-center justify-center p-6 text-white">
        <div className="max-w-md w-full space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-card/20 backdrop-blur-sm flex items-center justify-center mx-auto border border-white/30">
              <Trophy size={40} className="text-yellow-300" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">{quiz.title}</h1>
            {quiz.description && (
              <p className="text-primary-foreground/80 text-sm font-medium">{quiz.description}</p>
            )}
          </div>

          {/* Not yet open banner */}
          {isNotYetOpen && (
            <div className="bg-warning/20 backdrop-blur-sm border-2 border-amber-300/50 rounded-2xl p-4 flex items-center gap-3">
              <Lock size={24} className="text-amber-200 shrink-0" />
              <div>
                <p className="font-black text-sm">Bài quiz chưa mở</p>
                <p className="text-xs text-amber-100 font-medium">
                  {fmtOpensLocal
                    ? `Sẽ mở lúc ${fmtOpensLocal}. Vui lòng quay lại sau.`
                    : 'Vui lòng quay lại sau.'}
                </p>
              </div>
            </div>
          )}

          {/* Closed banner */}
          {isClosed && (
            <div className="bg-destructive/20 backdrop-blur-sm border-2 border-rose-300/50 rounded-2xl p-4 flex items-center gap-3">
              <Lock size={24} className="text-rose-200 shrink-0" />
              <div>
                <p className="font-black text-sm">Bài quiz đã đóng</p>
                <p className="text-xs text-rose-100 font-medium">
                  {quiz.is_closed
                    ? 'Giáo viên đã đóng bài quiz này.'
                    : 'Đã quá thời gian cho phép.'}
                  {' '}Bạn có thể xem bảng vàng.
                </p>
              </div>
            </div>
          )}

          {/* Quiz info */}
          <div className="bg-card/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20 space-y-3">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-primary-foreground/80">Tổng câu hỏi</span>
              <span>{quiz.questions_count} câu</span>
            </div>
            {quiz.time_limit_seconds > 0 && (
              <div className="flex justify-between text-sm font-bold">
                <span className="text-primary-foreground/80 flex items-center gap-1.5"><Clock size={14} /> Thời gian</span>
                <span>{Math.round(quiz.time_limit_seconds / 60)} phút</span>
              </div>
            )}
            {fmtOpensLocal && (
              <div className="flex justify-between text-sm font-bold">
                <span className="text-primary-foreground/80">Mở lúc</span>
                <span className="text-emerald-300">{fmtOpensLocal}</span>
              </div>
            )}
            {fmtClosesLocal && (
              <div className="flex justify-between text-sm font-bold">
                <span className="text-primary-foreground/80">Đóng lúc</span>
                <span className="text-rose-300">{fmtClosesLocal}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold">
              <span className="text-primary-foreground/80 flex items-center gap-1.5"><RotateCcw size={14} /> Số lần làm</span>
              <span>
                {maxAttempts > 0
                  ? `${attemptCount}/${maxAttempts} lần`
                  : `${attemptCount} lần (không giới hạn)`}
              </span>
            </div>
            {bestScore !== null && (
              <div className="flex justify-between text-sm font-bold">
                <span className="text-primary-foreground/80">Điểm cao nhất</span>
                <span className="text-yellow-300">{bestScore}%</span>
              </div>
            )}
          </div>

          {/* Past attempts history */}
          {pastAttempts.length > 0 && (
            <div className="bg-card/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15 space-y-2">
              <div className="text-[10px] font-black uppercase text-primary tracking-wider mb-2">Lịch sử làm bài</div>
              {pastAttempts.slice(0, 3).map(a => (
                <div key={a.uid} className="flex items-center justify-between text-xs font-bold">
                  <span className="text-primary-foreground/80">Lần #{a.attempt_number}</span>
                  <div className="flex items-center gap-3">
                    {a.time_taken_seconds > 0 && (
                      <span className="text-primary">{fmtSeconds(a.time_taken_seconds)}</span>
                    )}
                    <span className={
                      a.score_pct >= 80 ? 'text-emerald-300' :
                      a.score_pct >= 50 ? 'text-amber-300' : 'text-rose-300'
                    }>
                      {a.score_pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Leaderboard button — visible to all classroom members, even if they haven't taken the quiz yet */}
          <Button
            type="button"
            onClick={() => setShowLeaderboard(true)}
            className="w-full h-12 bg-gradient-to-r from-warning to-yellow-500 hover:from-warning hover:to-yellow-600 text-white font-black text-sm rounded-2xl gap-2 shadow-lg shadow-amber-900/30"
          >
            <Trophy size={18} /> XEM BẢNG VÀNG
          </Button>

          {/* Start / blocked / closed / not yet open */}
          {isClosed ? (
            <div className="bg-card/10 border border-white/20 rounded-2xl p-4 text-center">
              <p className="text-xs text-primary-foreground/80 font-medium">Không thể làm bài khi quiz đã đóng.</p>
            </div>
          ) : isBlocked ? (
            <div className="bg-card/10 border border-white/20 rounded-2xl p-5 text-center space-y-2">
              <Lock size={28} className="mx-auto text-primary" />
              <p className="font-black text-sm">Bạn đã dùng hết {maxAttempts} lần làm bài</p>
              <p className="text-xs text-primary font-medium">Liên hệ giáo viên để được mở thêm lượt</p>
            </div>
          ) : isNotYetOpen ? (
            <Button
              disabled
              className="w-full h-14 bg-card/30 text-white/60 font-black text-base rounded-2xl gap-3 cursor-not-allowed"
            >
              CHƯA MỞ
              <Lock size={18} />
            </Button>
          ) : (
            <Button
              onClick={handleStartPlaying}
              className="w-full h-14 bg-card text-primary hover:bg-primary/10 font-black text-base rounded-2xl shadow-xl shadow-indigo-900/30 gap-3"
            >
              {attemptCount > 0 ? 'LÀM LẠI' : 'BẮT ĐẦU CHƠI'}
              <ChevronRight size={20} />
            </Button>
          )}

          {attemptsRemaining !== null && !isBlocked && !isClosed && !isNotYetOpen && (
            <p className="text-center text-xs text-primary font-bold">
              Còn {attemptsRemaining} lần làm
            </p>
          )}

          <Button
            type="button"
            onClick={() => router.push(`/consumer/classroom/${classroomUid}`)}
            className="w-full text-center text-primary-foreground/80 text-sm font-bold hover:text-white transition flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Quay lại lớp học
          </Button>
        </div>

        {showLeaderboard && (
          <QuizLeaderboardModal
            quizUid={quizUid}
            classroomId={classroomUid}
            onClose={() => setShowLeaderboard(false)}
          />
        )}
      </div>
    );
  }

  /* ── PLAYING ── */
  if (phase === 'playing' && currentQuestion) {
    const progress = (currentIdx / totalQuestions) * 100;
    const hasAttemptTimer = !!(quiz?.time_limit_seconds && quiz.time_limit_seconds > 0);
    const hasClosesTimer = closesAtCountdown !== null;
    const timePct = hasAttemptTimer && timeLeft > 0
      ? (timeLeft / (quiz?.time_limit_seconds ?? 1)) * 100
      : (hasClosesTimer && (closesAtCountdown ?? 0) > 0 && closesAtRef.current)
        ? ((closesAtCountdown ?? 0) / Math.max(1, Math.floor((closesAtRef.current.getTime() - Date.now()) / 1000) + (closesAtCountdown ?? 0))) * 100
        : 100;
    const attemptUrgent = hasAttemptTimer && timeLeft <= 30 && timeLeft > 0;
    const closesUrgent = hasClosesTimer && (closesAtCountdown ?? 0) <= 30 && (closesAtCountdown ?? 0) > 0;
    const timerUrgent = attemptUrgent || closesUrgent;
    const attemptExpired = hasAttemptTimer && timeLeft === 0;
    const closesExpired = hasClosesTimer && (closesAtCountdown ?? 0) === 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-white to-primary/10 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-border/60 shadow-sm">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
            <Button
              type="button"
              onClick={handleRestart}
              className="shrink-0 w-10 h-10 rounded-xl bg-muted hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition active:scale-95"
              aria-label="Quay lại"
            >
              <ArrowLeft size={18} />
            </Button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <span className="text-[11px] sm:text-xs font-black text-muted-foreground uppercase tracking-wider">
                  Câu {currentIdx + 1} / {totalQuestions}
                </span>
                {hasAttemptTimer || hasClosesTimer ? (
                  <div className="flex items-center gap-2">
                    {hasClosesTimer && closesAtDate && (
                      <TimerBadge
                        icon={<Lock size={12} />}
                        label={closesAtDate.toLocaleString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                        title="Quiz sẽ đóng lúc"
                        tone={closesExpired ? 'expired' : closesUrgent ? 'urgent' : 'amber'}
                      />
                    )}
                    {hasAttemptTimer && (
                      <TimerBadge
                        icon={<Clock size={12} />}
                        label={fmtSeconds(timeLeft)}
                        title="Thời gian chơi còn lại"
                        tone={attemptExpired ? 'expired' : attemptUrgent ? 'urgent' : 'indigo'}
                      />
                    )}
                  </div>
                ) : (
                  <span className="text-xs font-black text-muted-foreground">{Math.round(progress)}%</span>
                )}
              </div>
              <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out ${
                    timerUrgent
                      ? 'bg-gradient-to-r from-destructive via-pink-500 to-destructive'
                      : 'bg-gradient-to-r from-primary via-violet-500 to-primary'
                  }`}
                  style={{ width: `${hasAttemptTimer || hasClosesTimer ? timePct : progress}%` }}
                />
                {timerUrgent && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-rose-400/40 animate-pulse"
                    style={{ width: `${hasAttemptTimer || hasClosesTimer ? timePct : progress}%` }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-2xl mx-auto w-full">
          <div className="w-full space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300" key={currentQuestion.uid}>
            <div className="relative bg-card rounded-3xl border border-border/80 shadow-lg shadow-indigo-100/40 p-6 sm:p-7 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500" />
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase text-primary tracking-widest bg-primary/10 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Câu hỏi {currentIdx + 1}
                </span>
                {Object.keys(answers).length > 0 && (
                  <span className="text-[10px] font-bold text-muted-foreground">
                    Đã trả lời {Object.keys(answers).length}/{totalQuestions}
                  </span>
                )}
              </div>
              <p className="text-base sm:text-lg font-bold text-foreground leading-relaxed">{currentQuestion.question_text}</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {OPTION_KEYS.map((opt, idx) => {
                const isSelected = selected === opt;
                return (
                  <Button
                    key={opt}
                    type="button"
                    onClick={() => handleAnswer(opt)}
                    disabled={selected !== null}
                    style={{ animationDelay: `${idx * 60}ms` }}
                    className={`group w-full flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left text-sm font-semibold transition-all duration-200 focus:outline-none animate-in fade-in slide-in-from-left-2
                      ${selected === null
                        ? 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/10 hover:shadow-lg hover:shadow-indigo-100 hover:-translate-y-0.5 active:scale-[0.98]'
                        : isSelected
                          ? 'border-primary bg-gradient-to-r from-primary to-primary text-white shadow-xl shadow-indigo-200 scale-[1.01]'
                          : 'border-border bg-muted text-muted-foreground opacity-60'
                      }`}
                  >
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-all ${
                      isSelected
                        ? 'bg-card text-primary shadow-md'
                        : selected === null
                          ? 'bg-gradient-to-br from-muted to-muted text-muted-foreground group-hover:from-primary/10 group-hover:to-primary/10 group-hover:text-primary'
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {OPTION_LABELS[opt]}
                    </span>
                    <span className="flex-1">{currentQuestion[`option_${opt}` as keyof QuizQuestionPublic] as string}</span>
                    {isSelected && <CheckCircle2 size={18} className="shrink-0" />}
                  </Button>
                );
              })}
            </div>

            <Button
              onClick={() => void handleNext()}
              disabled={selected === null || submitting}
              className="w-full h-14 bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white font-black rounded-2xl shadow-xl shadow-indigo-200/60 gap-2 text-base disabled:opacity-40 disabled:shadow-none transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {submitting ? (
                <><Loader2 size={18} className="animate-spin" /> Đang gửi...</>
              ) : isLast ? (
                <><Trophy size={18} /> NỘP BÀI</>
              ) : (
                <>CÂU TIẾP THEO <ChevronRight size={18} /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ── RESULT ── */
  if (phase === 'result' && result) {
    const scoreColor = result.score >= 80 ? 'text-success' : result.score >= 50 ? 'text-warning' : 'text-destructive';
    const scoreBg = result.score >= 80 ? 'from-success to-teal-600' : result.score >= 50 ? 'from-warning to-orange-600' : 'from-destructive to-pink-600';
    void scoreColor;
    const timeTaken = startedAtRef.current
      ? Math.floor((Date.now() - startedAtRef.current.getTime()) / 1000)
      : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-muted to-primary/10 flex flex-col items-center py-10 px-4">
        {celebrateCerts && celebrateCerts.length > 0 && (
          <CertificateCelebration
            certificates={celebrateCerts}
            onClose={() => setCelebrateCerts(null)}
          />
        )}
        <div className="max-w-2xl w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {forceSubmitted && (
            <div className="rounded-2xl border-2 border-rose-300 bg-destructive/10 px-4 py-3 flex items-center gap-3 text-rose-800">
              <Lock size={18} className="shrink-0" />
              <div>
                <p className="text-sm font-black">Bài đã được hệ thống nộp tự động</p>
                <p className="text-xs font-medium">Đã hết thời gian làm bài (closes_at).</p>
              </div>
            </div>
          )}
          {/* Score card */}
          <div className={`bg-gradient-to-br ${scoreBg} rounded-3xl p-8 text-white text-center shadow-2xl`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy size={40} className="text-yellow-200" />
              <span className="text-xs font-black bg-card/20 rounded-full px-3 py-1">
                Lần thứ #{result.attempt_number}
              </span>
            </div>
            <div className="text-6xl font-black mb-1">{result.score}%</div>
            <div className="text-lg font-bold opacity-90">{result.correct} / {result.total} câu đúng</div>
            {timeTaken > 0 && (
              <div className="mt-1 text-sm font-medium opacity-75 flex items-center justify-center gap-1.5">
                <Clock size={13} /> {fmtSeconds(timeTaken)}
              </div>
            )}
            <div className="mt-2 text-sm font-medium opacity-75">
              {result.score >= 80 ? 'Xuất sắc! Bạn nắm vững nội dung này.' :
               result.score >= 50 ? 'Khá tốt! Hãy ôn lại những câu sai.' :
               'Cần cố gắng hơn! Hãy ôn tập và thử lại.'}
            </div>
            {result.attempts_remaining !== null && (
              <div className="mt-3 text-xs font-bold bg-card/20 rounded-full px-3 py-1 inline-block">
                Còn {result.attempts_remaining} lần làm
              </div>
            )}
          </div>

          {/* Exam linkage notice */}
          {examUid && (
            <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-bold text-primary">
              <CheckCircle2 size={16} className="shrink-0 text-primary" />
              Kết quả đã được ghi nhận vào bài kiểm tra
            </div>
          )}

          {/* Certificate celebration card (persists after modal closes) */}
          {celebrateCerts && celebrateCerts.length > 0 && (
            <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-warning/10 to-warning/10 p-4 flex items-center gap-3 shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center shrink-0">
                <Trophy size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-amber-900">Bạn vừa nhận chứng chỉ mới!</p>
                <p className="text-[11px] text-warning font-mono font-bold truncate">
                  {celebrateCerts[0].verification_code}
                </p>
              </div>
              <Button
                onClick={() => router.push(`/consumer/certificate/${celebrateCerts[0].uid}`)}
                className="bg-warning hover:bg-warning text-white font-bold h-9 px-3 text-[11px] rounded-xl shrink-0"
              >
                Xem
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => setShowLeaderboard(true)}
              className="h-12 px-5 bg-gradient-to-r from-warning to-yellow-500 hover:from-warning hover:to-yellow-600 text-white rounded-2xl font-bold gap-2"
            >
              <Trophy size={16} />
              Bảng vàng
            </Button>
            {!examUid && (result.attempts_remaining === null || result.attempts_remaining > 0) && !isClosed && (
              <Button
                onClick={handleRestart}
                variant="outline"
                className="flex-1 h-12 rounded-2xl font-bold gap-2 min-w-[120px]"
              >
                <RotateCcw size={16} />
                Làm lại
              </Button>
            )}
            <Button
              onClick={() => router.push(`/consumer/classroom/${classroomUid}`)}
              className="flex-1 h-12 bg-primary hover:bg-primary text-white rounded-2xl font-bold gap-2 min-w-[120px]"
            >
              <ArrowLeft size={16} />
              Về lớp học
            </Button>
          </div>

          {/* Detailed results */}
          <div className="space-y-3">
            <div className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Chi tiết kết quả</div>
            {result.results.map((item, idx) => (
              <div
                key={item.question_uid}
                className={`bg-card rounded-2xl border shadow-sm p-5 space-y-3 ${
                  item.is_correct ? 'border-success/20' : 'border-destructive/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  {item.is_correct
                    ? <CheckCircle2 size={20} className="text-success shrink-0 mt-0.5" />
                    : <XCircle size={20} className="text-destructive shrink-0 mt-0.5" />
                  }
                  <p className="text-sm font-bold text-foreground leading-relaxed">
                    <span className="text-muted-foreground font-black mr-1">{idx + 1}.</span>
                    {item.question_text}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pl-8">
                  {item.chosen && (
                    <div className={`rounded-xl px-3 py-2 text-xs font-bold ${
                      item.is_correct ? 'bg-success/10 text-success border border-success/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
                    }`}>
                      Bạn chọn: {item.chosen.toUpperCase()}
                    </div>
                  )}
                  {!item.is_correct && (
                    <div className="rounded-xl px-3 py-2 text-xs font-bold bg-success/10 text-success border border-success/20">
                      Đáp án: {String(item.correct_answer ?? '').toUpperCase()}
                    </div>
                  )}
                </div>

                {item.explanation && (
                  <div className="pl-8 text-xs text-muted-foreground font-medium bg-warning/10 rounded-xl px-4 py-2 border border-warning/20">
                    <span className="font-black text-warning">Giải thích: </span>{item.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {showLeaderboard && (
          <QuizLeaderboardModal
            quizUid={quizUid}
            classroomId={classroomUid}
            onClose={() => setShowLeaderboard(false)}
          />
        )}
      </div>
    );
  }

  return null;
}
