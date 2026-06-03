'use client';

import * as React from 'react';
import { useState, useEffect, use, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { consumerQuizApi } from '@/lib/api/quiz';
import { classroomApi } from '@/lib/api/classroom';
import type { QuizPublicDetail, QuizQuestionPublic, QuizResult, QuizAttemptRecord } from '@/lib/api/types';
import {
  Loader2, ArrowLeft, CheckCircle2, XCircle, Trophy,
  RotateCcw, ChevronRight, Clock, Lock,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';

type GamePhase = 'loading' | 'intro' | 'playing' | 'result';
type Answer = 'a' | 'b' | 'c' | 'd';

interface Props {
  params: Promise<{ uid: string; quizUid: string }>;
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

  // timer
  const [timeLeft, setTimeLeft] = useState(0);
  const startedAtRef = useRef<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // countdown timer during playing
  useEffect(() => {
    if (phase !== 'playing' || !quiz?.time_limit_seconds) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // auto-submit on timeout
          void handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleStartPlaying = () => {
    startedAtRef.current = new Date();
    if (quiz?.time_limit_seconds) {
      setTimeLeft(quiz.time_limit_seconds);
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex flex-col items-center justify-center p-4 text-center">
        <XCircle size={48} className="text-rose-400 mb-4" />
        <p className="font-bold text-slate-700">{error}</p>
        <Button onClick={() => router.push(`/consumer/classroom/${classroomUid}`)} className="mt-6 rounded-xl bg-indigo-600 text-white">
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

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-violet-700 flex flex-col items-center justify-center p-6 text-white">
        <div className="max-w-md w-full space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto border border-white/30">
              <Trophy size={40} className="text-yellow-300" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">{quiz.title}</h1>
            {quiz.description && (
              <p className="text-indigo-200 text-sm font-medium">{quiz.description}</p>
            )}
          </div>

          {/* Quiz info */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 border border-white/20 space-y-3">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-indigo-200">Tổng câu hỏi</span>
              <span>{quiz.questions_count} câu</span>
            </div>
            {quiz.time_limit_seconds > 0 && (
              <div className="flex justify-between text-sm font-bold">
                <span className="text-indigo-200 flex items-center gap-1.5"><Clock size={14} /> Thời gian</span>
                <span>{Math.round(quiz.time_limit_seconds / 60)} phút</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold">
              <span className="text-indigo-200 flex items-center gap-1.5"><RotateCcw size={14} /> Số lần làm</span>
              <span>
                {maxAttempts > 0
                  ? `${attemptCount}/${maxAttempts} lần`
                  : `${attemptCount} lần (không giới hạn)`}
              </span>
            </div>
            {bestScore !== null && (
              <div className="flex justify-between text-sm font-bold">
                <span className="text-indigo-200">Điểm cao nhất</span>
                <span className="text-yellow-300">{bestScore}%</span>
              </div>
            )}
          </div>

          {/* Past attempts history */}
          {pastAttempts.length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15 space-y-2">
              <div className="text-[10px] font-black uppercase text-indigo-300 tracking-wider mb-2">Lịch sử làm bài</div>
              {pastAttempts.slice(0, 3).map(a => (
                <div key={a.uid} className="flex items-center justify-between text-xs font-bold">
                  <span className="text-indigo-200">Lần #{a.attempt_number}</span>
                  <div className="flex items-center gap-3">
                    {a.time_taken_seconds > 0 && (
                      <span className="text-indigo-300">{fmtSeconds(a.time_taken_seconds)}</span>
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

          {/* Start / blocked */}
          {isBlocked ? (
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5 text-center space-y-2">
              <Lock size={28} className="mx-auto text-indigo-300" />
              <p className="font-black text-sm">Bạn đã dùng hết {maxAttempts} lần làm bài</p>
              <p className="text-xs text-indigo-300 font-medium">Liên hệ giáo viên để được mở thêm lượt</p>
            </div>
          ) : (
            <Button
              onClick={handleStartPlaying}
              className="w-full h-14 bg-white text-indigo-700 hover:bg-indigo-50 font-black text-base rounded-2xl shadow-xl shadow-indigo-900/30 gap-3"
            >
              {attemptCount > 0 ? 'LÀM LẠI' : 'BẮT ĐẦU CHƠI'}
              <ChevronRight size={20} />
            </Button>
          )}

          {attemptsRemaining !== null && !isBlocked && (
            <p className="text-center text-xs text-indigo-300 font-bold">
              Còn {attemptsRemaining} lần làm
            </p>
          )}

          <button
            type="button"
            onClick={() => router.push(`/consumer/classroom/${classroomUid}`)}
            className="w-full text-center text-indigo-200 text-sm font-bold hover:text-white transition flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Quay lại lớp học
          </button>
        </div>
      </div>
    );
  }

  /* ── PLAYING ── */
  if (phase === 'playing' && currentQuestion) {
    const progress = (currentIdx / totalQuestions) * 100;
    const timePct = quiz?.time_limit_seconds ? (timeLeft / quiz.time_limit_seconds) * 100 : 100;
    const timerUrgent = quiz?.time_limit_seconds ? timeLeft <= 30 : false;

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-100 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
          <button type="button" onClick={handleRestart} className="text-slate-400 hover:text-slate-600 transition">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
              <span>Câu {currentIdx + 1} / {totalQuestions}</span>
              {quiz?.time_limit_seconds ? (
                <span className={`flex items-center gap-1 font-black ${timerUrgent ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`}>
                  <Clock size={12} />
                  {fmtSeconds(timeLeft)}
                </span>
              ) : (
                <span>{Math.round(progress)}%</span>
              )}
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: quiz?.time_limit_seconds ? `${timePct}%` : `${progress}%`,
                  backgroundColor: timerUrgent ? '#ef4444' : '#6366f1',
                }}
              />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
          <div className="w-full space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="text-[10px] font-black uppercase text-indigo-500 tracking-wider mb-3">
                Câu hỏi {currentIdx + 1}
              </div>
              <p className="text-lg font-black text-slate-900 leading-relaxed">{currentQuestion.question_text}</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {OPTION_KEYS.map(opt => {
                const isSelected = selected === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleAnswer(opt)}
                    disabled={selected !== null}
                    className={`w-full flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left text-sm font-bold transition-all duration-150 focus:outline-none
                      ${selected === null
                        ? 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md active:scale-[0.98]'
                        : isSelected
                          ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                          : 'border-slate-100 bg-slate-50 text-slate-400 opacity-60'
                      }`}
                  >
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                      isSelected ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {OPTION_LABELS[opt]}
                    </span>
                    {currentQuestion[`option_${opt}` as keyof QuizQuestionPublic] as string}
                  </button>
                );
              })}
            </div>

            <Button
              onClick={() => void handleNext()}
              disabled={selected === null || submitting}
              className="w-full h-13 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 gap-2 text-base disabled:opacity-40"
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
    const scoreColor = result.score >= 80 ? 'text-emerald-600' : result.score >= 50 ? 'text-amber-600' : 'text-rose-600';
    const scoreBg = result.score >= 80 ? 'from-emerald-500 to-teal-600' : result.score >= 50 ? 'from-amber-500 to-orange-600' : 'from-rose-500 to-pink-600';
    void scoreColor;
    const timeTaken = startedAtRef.current
      ? Math.floor((Date.now() - startedAtRef.current.getTime()) / 1000)
      : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center py-10 px-4">
        <div className="max-w-2xl w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Score card */}
          <div className={`bg-gradient-to-br ${scoreBg} rounded-3xl p-8 text-white text-center shadow-2xl`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy size={40} className="text-yellow-200" />
              <span className="text-xs font-black bg-white/20 rounded-full px-3 py-1">
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
              <div className="mt-3 text-xs font-bold bg-white/20 rounded-full px-3 py-1 inline-block">
                Còn {result.attempts_remaining} lần làm
              </div>
            )}
          </div>

          {/* Exam linkage notice */}
          {examUid && (
            <div className="flex items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700">
              <CheckCircle2 size={16} className="shrink-0 text-indigo-500" />
              Kết quả đã được ghi nhận vào bài kiểm tra
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!examUid && (result.attempts_remaining === null || result.attempts_remaining > 0) && (
              <Button
                onClick={handleRestart}
                variant="outline"
                className="flex-1 h-12 rounded-2xl font-bold gap-2"
              >
                <RotateCcw size={16} />
                Làm lại
              </Button>
            )}
            <Button
              onClick={() => router.push(`/consumer/classroom/${classroomUid}`)}
              className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold gap-2"
            >
              <ArrowLeft size={16} />
              Về lớp học
            </Button>
          </div>

          {/* Detailed results */}
          <div className="space-y-3">
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Chi tiết kết quả</div>
            {result.results.map((item, idx) => (
              <div
                key={item.question_uid}
                className={`bg-white rounded-2xl border shadow-sm p-5 space-y-3 ${
                  item.is_correct ? 'border-emerald-100' : 'border-rose-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  {item.is_correct
                    ? <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                    : <XCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />
                  }
                  <p className="text-sm font-bold text-slate-900 leading-relaxed">
                    <span className="text-slate-400 font-black mr-1">{idx + 1}.</span>
                    {item.question_text}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pl-8">
                  {item.chosen && (
                    <div className={`rounded-xl px-3 py-2 text-xs font-bold ${
                      item.is_correct ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      Bạn chọn: {item.chosen.toUpperCase()}
                    </div>
                  )}
                  {!item.is_correct && (
                    <div className="rounded-xl px-3 py-2 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Đáp án: {item.correct_answer.toUpperCase()}
                    </div>
                  )}
                </div>

                {item.explanation && (
                  <div className="pl-8 text-xs text-slate-500 font-medium bg-amber-50 rounded-xl px-4 py-2 border border-amber-100">
                    <span className="font-black text-amber-600">Giải thích: </span>{item.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
