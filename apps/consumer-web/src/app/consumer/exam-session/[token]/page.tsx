'use client';

import { use, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  File,
  FileText,
  Loader2,
  LockKeyhole,
  Monitor,
  Timer,
  UploadCloud,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { examSessionApi } from '@/lib/api/exam-session';
import { classroomApi } from '@/lib/api/classroom';
import { FaceMonitorWidget, type MonitorResult } from '@/components/face/face-monitor-widget';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';
import type { Exam, ExamSessionInfo } from '@/lib/api/types';

interface Props {
  params: Promise<{ token: string }>;
}

export default function ExamSessionPage({ params }: Props) {
  const { token } = use(params);
  const { isAuthenticated, mounted } = useRequireAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [session, setSession] = useState<ExamSessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [answerContent, setAnswerContent] = useState('');
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<Array<{
    uid: string;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    order: number;
  }>>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSubmittedRef = useRef(false);

  // Camera enforcement
  const [cameraStatus, setCameraStatus] = useState<MonitorResult | null>(null);

  useEffect(() => {
    if (!mounted || !isAuthenticated) return;
    const load = async () => {
      try {
        setLoading(true);
        const result = await examSessionApi.join(token);
        setExam(result.exam);
        setSession(result.session);
        if (result.session.time_remaining_seconds !== null) {
          setTimeLeft(result.session.time_remaining_seconds);
        }
        if (result.exam.content_type === 'quiz') {
          const quizData = await classroomApi.examQuestions(result.exam.uid);
          setQuizQuestions([...quizData.questions].sort((a, b) => a.order - b.order));
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Link thi không hợp lệ hoặc đã hết hạn');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [token, mounted, isAuthenticated]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          setTimeExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const doSubmit = async (isAutoSubmit = false) => {
    if (!exam || submitting || submitted) return;

    const isCameraEnforced = exam.exam_mode === 'online' && exam.camera_required;
    const isCameraValid = !isCameraEnforced || (cameraStatus?.camera_open && cameraStatus?.recognized);
    if (isCameraEnforced && !isCameraValid) {
      if (!isAutoSubmit) setSubmitError('Camera chưa được xác thực. Vui lòng bật camera và giữ khuôn mặt trong khung hình.');
      return;
    }

    const needsFile = ['pdf', 'image', 'file'].includes(exam.content_type);

    if (!isAutoSubmit) {
      if (exam.content_type === 'quiz') {
        if (quizQuestions.length === 0) { setSubmitError('Bài thi chưa có câu hỏi'); return; }
        if (Object.keys(quizAnswers).length < quizQuestions.length) {
          setSubmitError('Vui lòng trả lời đầy đủ câu hỏi trước khi nộp bài'); return;
        }
      }
      if (exam.content_type === 'markdown' && !answerContent.trim()) {
        setSubmitError('Vui lòng nhập nội dung bài làm'); return;
      }
      if (needsFile && !answerFile) { setSubmitError('Vui lòng chọn file đính kèm'); return; }
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const accessToken = localStorage.getItem('accessToken');
      const headers: Record<string, string> = { 'Authorization': `Bearer ${accessToken}` };

      let body: string | FormData;
      let resourceUid: string | null = null;

      if (needsFile && answerFile) {
        const formData = new FormData();
        formData.append('file', answerFile);
        formData.append('metadata', JSON.stringify({ context: 'exam_submission' }));
        formData.append('owner_id', exam.classroom_id);
        formData.append('owner_type', 'classroom');
        const uploadRes = await fetch(`${apiBase}/api/v1/resource/upload/`, {
          method: 'POST', headers, body: formData,
        });
        if (!uploadRes.ok) throw new Error('Upload thất bại');
        const uploaded = await uploadRes.json() as { uid: string };
        resourceUid = uploaded.uid;
      }

      headers['Content-Type'] = 'application/json';
      const sessionDuration = session?.time_remaining_seconds != null && timeLeft !== null
        ? session.time_remaining_seconds - timeLeft
        : 0;
      body = exam.content_type === 'quiz'
        ? JSON.stringify({
            submission_type: 'online_quiz',
            answers: quizAnswers,
            time_taken_seconds: Math.max(0, sessionDuration),
          })
        : JSON.stringify({
            submission_type: exam.content_type === 'markdown' ? 'essay' : 'file',
            content: exam.content_type === 'markdown' ? answerContent.trim() : '',
            ref_id: resourceUid,
          });

      const res = await fetch(`${apiBase}/api/v1/consumer/course/exams/${exam.uid}/submissions/`, {
        method: 'POST', headers, body,
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error || 'Nộp bài thất bại');
      }
      setSubmitted(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể nộp bài');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await doSubmit(false);
  };

  // Auto-submit when timer expires
  useEffect(() => {
    if (!timeExpired || submitted || submitting || autoSubmittedRef.current || !exam) return;
    autoSubmittedRef.current = true;
    void doSubmit(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeExpired]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 size={40} className="mx-auto mb-4 animate-spin text-indigo-600" />
          <p className="text-sm font-bold text-slate-500">Đang xác thực phiên thi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
            <AlertCircle size={28} className="text-rose-500" />
          </div>
          <h1 className="text-xl font-black text-slate-900">Không thể vào phòng thi</h1>
          <p className="mt-2 text-sm font-bold text-rose-600">{error}</p>
          <p className="mt-1 text-xs text-slate-400">Link đã hết hạn hoặc không hợp lệ. Liên hệ giáo viên để được hỗ trợ.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 size={28} className="text-emerald-500" />
          </div>
          <h1 className="text-xl font-black text-slate-900">Nộp bài thành công!</h1>
          <p className="mt-2 text-sm font-bold text-slate-500">Bài làm của bạn đã được ghi nhận. Chờ giáo viên chấm điểm.</p>
        </div>
      </div>
    );
  }

  if (!exam || !session) return null;

  const isOnline = exam.exam_mode === 'online';
  const cameraEnforced = isOnline && exam.camera_required;
  const cameraValid = !cameraEnforced || (cameraStatus?.camera_open && cameraStatus?.recognized);
  const needsFile = ['pdf', 'image', 'file'].includes(exam.content_type);
  const canSubmit = !submitting && !timeExpired && session.token_status === 'active' && cameraValid;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Camera monitor for online + camera_required exams */}
      {isOnline && exam.camera_required && (
        <FaceMonitorWidget
          examUid={exam.uid}
          onStatusChange={setCameraStatus}
        />
      )}

      {/* Sticky header with timer */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500">
              <FileText size={12} />
              {isOnline ? 'Thi Trực Tuyến' : 'Bài Kiểm Tra'}
            </div>
            <h1 className="truncate text-lg font-black text-slate-900">{exam.title}</h1>
          </div>

          {timeLeft !== null && (
            <div className={`flex items-center gap-2 rounded-xl px-4 py-2 ${timeLeft <= 300 ? 'bg-rose-50' : 'bg-slate-100'}`}>
              <Timer size={16} className={timeLeft <= 300 ? 'text-rose-500' : 'text-slate-500'} />
              <span className={`text-lg font-black tabular-nums ${timeLeft <= 300 ? 'text-rose-600' : 'text-slate-800'}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}

          {isOnline && (
            exam.camera_required ? (
              <div className={`flex items-center gap-1.5 rounded-xl px-3 py-2 ${cameraStatus?.recognized ? 'bg-emerald-50' : cameraStatus?.camera_open ? 'bg-amber-50' : 'bg-rose-50'}`}>
                <Camera size={14} className={cameraStatus?.recognized ? 'text-emerald-500' : cameraStatus?.camera_open ? 'text-amber-500' : 'text-rose-500'} />
                <span className={`text-xs font-black ${cameraStatus?.recognized ? 'text-emerald-600' : cameraStatus?.camera_open ? 'text-amber-600' : 'text-rose-600'}`}>
                  {cameraStatus?.recognized ? 'Đã nhận diện' : cameraStatus?.camera_open ? 'Đang xác thực...' : 'Chưa bật camera'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2">
                <Camera size={14} className="text-slate-400" />
                <span className="text-xs font-black text-slate-400">Camera không bắt buộc</span>
              </div>
            )
          )}
        </div>
      </header>

      {/* Camera Enforcement Overlay */}
      {cameraEnforced && !cameraValid && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-md animate-in fade-in duration-500">
          <div className="w-full max-w-md p-8 text-center bg-white rounded-[32px] shadow-2xl border border-indigo-100">
            <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <Camera size={40} className="text-indigo-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Bắt buộc mở Camera</h2>
            <p className="text-slate-500 font-medium mb-8">
              Để đảm bảo tính công bằng, bài thi này yêu cầu bạn phải bật camera và giữ khuôn mặt trong khung hình suốt thời gian thi.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${cameraStatus?.camera_open ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {cameraStatus?.camera_open ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">Trạng thái Camera</p>
                  <p className="text-xs text-slate-500">{cameraStatus?.camera_open ? 'Đã bật' : 'Chưa bật hoặc bị chặn'}</p>
                </div>
              </div>

              {!cameraStatus?.recognized && cameraStatus?.camera_open && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-left">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Monitor size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">Xác thực khuôn mặt</p>
                    <p className="text-xs text-slate-500">Vui lòng hướng mặt về phía camera</p>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-widest">
              <Loader2 size={14} className="animate-spin" />
              Đang chờ xác thực...
            </div>
          </div>
        </div>
      )}

      {timeExpired && (
        <div className="sticky top-16 z-10 border-b border-rose-200 bg-rose-50 px-6 py-3 text-center">
          <p className="text-sm font-black text-rose-600">⏰ Đã hết thời gian làm bài! Không thể nộp thêm.</p>
        </div>
      )}

      <main className={`mx-auto max-w-4xl space-y-6 p-6 transition-all duration-500 ${(!cameraValid && cameraEnforced) ? 'blur-sm pointer-events-none' : ''}`}>
        {/* Exam info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-3 text-xs font-bold text-slate-500">
            {exam.due_date && (
              <span className="flex items-center gap-1.5">
                <Clock size={13} className="text-indigo-500" />
                Hạn nộp: {new Date(exam.due_date).toLocaleString('vi-VN')}
              </span>
            )}
            {exam.duration_seconds && exam.duration_seconds > 0 && (
              <span className="flex items-center gap-1.5">
                <Timer size={13} className="text-violet-500" />
                Thời gian: {Math.floor(exam.duration_seconds / 60)} phút
              </span>
            )}
          </div>

          {exam.description && (
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-600">{exam.description}</p>
          )}
        </div>

        {exam.content_type === 'quiz' && (
          <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Bài thi trắc nghiệm</div>
                <h2 className="mt-1 text-lg font-black text-slate-900">{quizQuestions.length} câu hỏi</h2>
              </div>
              <div className="rounded-xl bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-600">
                {Object.keys(quizAnswers).length}/{quizQuestions.length}
              </div>
            </div>
            <div className="space-y-5">
              {quizQuestions.map((question, index) => (
                <div key={question.uid} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-3 text-sm font-black leading-relaxed text-slate-900">
                    Câu {index + 1}. {question.question_text}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(['a', 'b', 'c', 'd'] as const).map(letter => {
                      const value = question[`option_${letter}` as keyof typeof question] as string;
                      const selected = quizAnswers[question.uid] === letter;
                      return (
                        <button
                          key={letter}
                          type="button"
                          disabled={timeExpired || submitted}
                          onClick={() => setQuizAnswers(prev => ({ ...prev, [question.uid]: letter }))}
                          className={`rounded-xl border px-4 py-3 text-left text-sm font-bold transition-all disabled:opacity-60 ${
                            selected
                              ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50'
                          }`}
                        >
                          <span className="mr-2 text-xs font-black uppercase">{letter}.</span>
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exam content */}
        {exam.content_type === 'markdown' && exam.body && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500">
              <FileText size={12} />
              Đề bài
            </div>
            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">{exam.body}</div>
          </div>
        )}

        {(exam.content_type === 'pdf' || exam.content_type === 'image' || exam.content_type === 'file') && exam.meta?.url && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500">
              <File size={12} />
              Tài liệu đề thi
            </div>
            {exam.content_type === 'image' ? (
              <img src={exam.meta.url} alt="Đề thi" className="max-w-full rounded-xl" />
            ) : (
              <a
                href={exam.meta.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-100"
              >
                <File size={16} />
                {exam.meta.name || 'Xem đề thi'}
              </a>
            )}
          </div>
        )}

        {/* Answer form */}
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 text-[10px] font-black uppercase tracking-widest text-indigo-500">Bài làm của bạn</div>

          {exam.content_type === 'markdown' && (
            <textarea
              value={answerContent}
              onChange={e => setAnswerContent(e.target.value)}
              rows={10}
              disabled={timeExpired || submitted}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50"
              placeholder="Nhập bài làm của bạn tại đây..."
            />
          )}

          {needsFile && (
            <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-slate-800">
                  {answerFile?.name || 'Chưa chọn file bài làm'}
                </div>
                <div className="text-[11px] font-bold uppercase text-slate-400">
                  {answerFile ? 'Sẵn sàng nộp' : 'Chọn file để đính kèm bài làm'}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                disabled={timeExpired}
                onChange={e => setAnswerFile(e.target.files?.[0] || null)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={timeExpired}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl text-xs font-bold"
              >
                <UploadCloud size={16} className="mr-2" />
                Chọn file
              </Button>
            </div>
          )}

          {exam.content_type === 'quiz' && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700">
              Kiểm tra lại đáp án đã chọn phía trên trước khi nộp bài.
            </div>
          )}

          {submitError && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600">
              <AlertCircle size={15} />
              {submitError}
            </div>
          )}

          <div className="mt-5 flex justify-end">
            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-12 min-w-[160px] rounded-xl bg-indigo-600 px-6 text-xs font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? (
                <><Loader2 size={16} className="mr-2 animate-spin" /> Đang nộp...</>
              ) : timeExpired ? (
                'Hết giờ'
              ) : exam.content_type === 'quiz' ? (
                <><CheckCircle2 size={16} className="mr-2" /> Nộp bài thi</>
              ) : (
                <><CheckCircle2 size={16} className="mr-2" /> Nộp bài</>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
