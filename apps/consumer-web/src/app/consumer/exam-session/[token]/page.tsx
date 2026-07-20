'use client';

import { use, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  File,
  FileText,
  Loader2,
  LockKeyhole,
  Monitor,
  Timer,
  UploadCloud,
  X,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import {
  formatAuditClockTime,
  formatAuditEventData,
  humanizeAuditEvent as humanizeAuditEventShared,
  isAuditForce,
  isAuditLimit,
  isAuditViolation,
} from '@shared/lib/exam';
import { examSessionApi, type ProctoringEventType } from '@/lib/api/exam-session';
import { classroomApi } from '@/lib/api/classroom';
import { FaceMonitorWidget, type FaceEventType, type MonitorResult } from '@/components/face/face-monitor-widget';
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

  // Proctoring warnings (visibility break / face warning)
  const [warning, setWarning] = useState<{
    message: string;
    severity: 'info' | 'warning' | 'danger';
    rule: 'visibility_breaks' | 'face_warnings' | null;
    count: number;
    max: number;
    remaining: number | null;
  } | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittingFromProctorRef = useRef(false);
  const loadAbortRef = useRef<AbortController | null>(null);
  const submitAbortRef = useRef<AbortController | null>(null);
  const proctorAbortRef = useRef<AbortController | null>(null);

  // Result + audit log (post-submit view)
  const [resultSubmission, setResultSubmission] = useState<Record<string, unknown> | null>(null);
  const [resultLoading, setResultLoading] = useState(false);
  const [resultAuditEvents, setResultAuditEvents] = useState<Array<{
    uid: string;
    event_type: string;
    event_data: Record<string, unknown>;
    created_at: string;
  }>>([]);
  const [resultCounters, setResultCounters] = useState<{
    visibility_breaks: { count: number; max: number };
    face_warnings: { count: number; max: number };
  } | null>(null);
  const [resultView, setResultView] = useState<'overview' | 'audit' | 'answers'>('overview');

  // Audit log (self-view) for student
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditEvents, setAuditEvents] = useState<Array<{
    uid: string;
    event_type: string;
    event_data: Record<string, unknown>;
    created_at: string;
  }>>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditCounters, setAuditCounters] = useState<{
    visibility_breaks: { count: number; max: number };
    face_warnings: { count: number; max: number };
  } | null>(null);

  const FACE_EVENT_MAP: Record<FaceEventType, { type: ProctoringEventType; skipIfNotChanged?: boolean }> = {
    camera_lost:           { type: 'camera_lost' },
    camera_restored:       { type: 'face_recognized' },
    face_not_recognized:   { type: 'face_not_recognized' },
    face_recognized:       { type: 'face_recognized' },
    no_face:               { type: 'no_face' },
    multiple_faces:        { type: 'multiple_faces' },
    single_face_restored:  { type: 'face_recognized' },
  };

  const handleFaceEvent = (eventType: FaceEventType, data: Record<string, unknown>) => {
    const mapped = FACE_EVENT_MAP[eventType];
    if (!mapped) return;
    // Skip "restored" events — they don't add to counter but we may still log
    sendProctoringEvent(mapped.type, { ...data, face_transition: eventType });
  };

  const fetchAuditLog = async () => {
    if (!session?.uid) return;
    setAuditLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const accessToken = localStorage.getItem('accessToken');
      const res = await fetch(
        `${apiBase}/api/v1/consumer/course/exam-sessions/${session.uid}/audit-log/me/`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } },
      );
      if (!res.ok) return;
      const data = await res.json();
      setAuditEvents(data.events || []);
      setAuditCounters(data.counters || null);
    } catch {
      // ignore
    } finally {
      setAuditLoading(false);
    }
  };

  const showWarning = (
    next: {
      message: string;
      severity: 'info' | 'warning' | 'danger';
      rule: 'visibility_breaks' | 'face_warnings' | null;
      count: number;
      max: number;
      remaining: number | null;
    },
    persistent: boolean = false,
  ) => {
    setWarning(next);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (persistent) {
      // Caller is responsible for clearing the timer (e.g. after navigation)
      return;
    }
    const ttl = next.severity === 'danger' ? 8000 : 5000;
    warningTimerRef.current = setTimeout(() => setWarning(null), ttl);
  };

  const sendProctoringEvent = (eventType: ProctoringEventType, eventData?: Record<string, unknown>) => {
    if (!session?.uid) return;
    if (submitted || timeExpired) return;
    if (submittingFromProctorRef.current) return;
    const controller = new AbortController();
    proctorAbortRef.current = controller;
    void examSessionApi
      .recordEvent(session.uid, { event_type: eventType, event_data: eventData }, { signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return;
        if (res.warning) {
          showWarning({
            message: res.message,
            severity: res.severity,
            rule: res.rule,
            count: res.count,
            max: res.max,
            remaining: res.remaining,
          });
        }
        if (res.force_submitted) {
          submittingFromProctorRef.current = true;
          // Persistent toast: don't auto-dismiss, navigation will replace screen
          showWarning(
            {
              message: res.message || 'Bạn đã vi phạm quy chế thi. Hệ thống sẽ nộp bài bắt buộc và báo cáo giáo viên nhé.',
              severity: 'danger',
              rule: res.rule,
              count: res.count,
              max: res.max,
              remaining: res.remaining,
            },
            true,
          );
          // Delay navigation so student sees the warning before the screen changes
          setTimeout(() => {
            if (!controller.signal.aborted) {
              setSubmitted(true);
            }
          }, 1800);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        // silently ignore other proctoring errors - best-effort
      });
  };

  useEffect(() => {
    if (!mounted || !isAuthenticated) return;
    const controller = new AbortController();
    loadAbortRef.current?.abort();
    loadAbortRef.current = controller;
    const load = async () => {
      try {
        setLoading(true);
        const result = await examSessionApi.join(token, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setExam(result.exam);
        setSession(result.session);
        if (result.session.time_remaining_seconds !== null) {
          setTimeLeft(result.session.time_remaining_seconds);
        }
        if (result.exam.content_type === 'quiz') {
          const quizData = await classroomApi.examQuestions(result.exam.uid, { signal: controller.signal });
          if (controller.signal.aborted) return;
          setQuizQuestions([...quizData.questions].sort((a, b) => a.order - b.order));
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Link thi không hợp lệ hoặc đã hết hạn');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    return () => controller.abort();
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

    submitAbortRef.current?.abort();
    const controller = new AbortController();
    submitAbortRef.current = controller;

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
          method: 'POST', headers, body: formData, signal: controller.signal,
        });
        if (controller.signal.aborted) return;
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
        method: 'POST', headers, body, signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error || 'Nộp bài thất bại');
      }
      setSubmitted(true);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setSubmitError(err instanceof Error ? err.message : 'Không thể nộp bài');
    } finally {
      if (!controller.signal.aborted) setSubmitting(false);
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

  // Fetch submission + audit log when submitted
  useEffect(() => {
    if (!submitted || !exam) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const accessToken = localStorage.getItem('accessToken');
    setResultLoading(true);
    const headers = { 'Authorization': `Bearer ${accessToken}` };
    Promise.all([
      fetch(`${apiBase}/api/v1/consumer/course/exams/${exam.uid}/submissions/me/`, { headers })
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
      session?.uid
        ? fetch(`${apiBase}/api/v1/consumer/course/exam-sessions/${session.uid}/audit-log/me/`, { headers })
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        : Promise.resolve(null),
    ]).then(([sub, audit]) => {
      if (sub) setResultSubmission(sub);
      if (audit) {
        setResultAuditEvents(audit.events || []);
        setResultCounters(audit.counters || null);
      }
    }).finally(() => setResultLoading(false));
  }, [submitted, exam?.uid, session?.uid]);

  // ── Proctoring: detect tab/window/fullscreen/visibility changes ──────────
  useEffect(() => {
    if (!exam || !session) return;
    if (exam.exam_mode !== 'online') return;
    if (submitted || timeExpired) return;

    const onVisibility = () => {
      if (document.hidden) {
        sendProctoringEvent('visibility_lost', { visibility_state: document.visibilityState });
        sendProctoringEvent('tab_leave');
      } else {
        sendProctoringEvent('visibility_restored');
        sendProctoringEvent('tab_return');
      }
    };
    const onBlur = () => {
      sendProctoringEvent('window_blur');
      sendProctoringEvent('app_blur');
    };
    const onFocus = () => {
      sendProctoringEvent('app_focus');
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        sendProctoringEvent('fullscreen_exit');
      }
    };
    const onPageHide = () => {
      sendProctoringEvent('window_out', { reason: 'pagehide' });
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      window.removeEventListener('pagehide', onPageHide);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      proctorAbortRef.current?.abort();
      submitAbortRef.current?.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam?.uid, session?.uid, submitted, timeExpired]);

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

  if (submitted && exam) {
    const forced = submittingFromProctorRef.current;
    const sub = resultSubmission as (Record<string, unknown> & {
      uid?: string;
      grade?: number;
      max_grade?: number;
      passed?: boolean;
      feedback?: string;
      status?: string;
      is_effective?: boolean;
      force_submitted?: boolean;
      force_submit_reason?: string;
      force_submitted_at?: string;
      submitted_at?: string;
      submission_type?: string;
      quiz_result?: { correct_count: number; total: number; score_pct: number; results: Array<Record<string, unknown>> };
      resource_url?: string;
      resource_name?: string;
      content?: string;
    }) | null;

    const stType = sub?.submission_type ?? 'file';
    const isEffective = sub?.is_effective === true;
    const isForceSub = sub?.force_submitted === true || forced;

    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl space-y-4 p-6">
          {/* Header card */}
          <div className={`rounded-2xl border p-6 shadow-sm ${
            isForceSub ? 'border-rose-200 bg-white' : 'border-emerald-200 bg-white'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                isForceSub ? 'bg-rose-50' : 'bg-emerald-50'
              }`}>
                {isForceSub ? (
                  <AlertCircle size={24} className="text-rose-500" />
                ) : (
                  <CheckCircle2 size={24} className="text-emerald-500" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-black text-slate-900">
                  {isForceSub ? 'Bài đã bị nộp bắt buộc' : 'Nộp bài thành công!'}
                </h1>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  {isForceSub
                    ? 'Bạn đã vi phạm quy chế thi quá số lần cho phép. Bài làm đã được hệ thống ghi nhận và chờ giáo viên xét duyệt.'
                    : 'Bài làm của bạn đã được ghi nhận. Chờ giáo viên chấm điểm.'}
                </p>
                {isForceSub && sub?.force_submit_reason && (
                  <p className="mt-2 text-xs font-bold text-rose-600">
                    Lý do: {humanizeAuditEvent(sub.force_submit_reason)}
                  </p>
                )}
              </div>
            </div>

            {resultLoading ? (
              <div className="mt-6 flex items-center justify-center py-8">
                <Loader2 size={24} className="animate-spin text-indigo-500" />
              </div>
            ) : sub ? (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Điểm</p>
                  <p className="mt-1 text-2xl font-black text-slate-900 tabular-nums">
                    {sub.grade != null ? sub.grade : '—'}
                    <span className="text-sm font-bold text-slate-500">/{sub.max_grade ?? exam.max_grade}</span>
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Trạng thái</p>
                  <p className={`mt-1 text-sm font-black ${
                    sub.status === 'graded' ? 'text-emerald-600'
                    : sub.status === 'late' ? 'text-amber-600'
                    : 'text-slate-600'
                  }`}>
                    {sub.status === 'graded' ? 'Đã chấm' : sub.status === 'late' ? 'Trễ hạn' : 'Đã nộp'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hiệu lực</p>
                  <p className={`mt-1 text-sm font-black ${isEffective ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isEffective ? 'Có hiệu lực' : 'Chờ duyệt'}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Loại</p>
                  <p className="mt-1 text-sm font-black text-slate-700">
                    {stType === 'online_quiz' || stType === 'multiple_choice' ? 'Trắc nghiệm'
                      : stType === 'essay' ? 'Tự luận'
                      : 'File'}
                  </p>
                </div>
              </div>
            ) : null}

            {sub?.feedback && (
              <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Nhận xét từ giáo viên</p>
                <p className="mt-1 text-sm font-bold text-slate-800">{sub.feedback}</p>
              </div>
            )}
          </div>

          {/* Counters card */}
          {resultCounters && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-black text-slate-900">Tổng quan vi phạm</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Rời màn hình</p>
                  <p className="mt-1 text-2xl font-black text-amber-900 tabular-nums">
                    {resultCounters.visibility_breaks.count}/{resultCounters.visibility_breaks.max}
                  </p>
                </div>
                <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-violet-700">Cảnh báo khuôn mặt</p>
                  <p className="mt-1 text-2xl font-black text-violet-900 tabular-nums">
                    {resultCounters.face_warnings.count}/{resultCounters.face_warnings.max}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => setResultView('overview')}
                className={`flex-1 px-4 py-3 text-sm font-black transition-colors ${
                  resultView === 'overview'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Tổng quan
              </button>
              <button
                type="button"
                onClick={() => setResultView('answers')}
                className={`flex-1 px-4 py-3 text-sm font-black transition-colors ${
                  resultView === 'answers'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Bài làm của tôi
              </button>
              <button
                type="button"
                onClick={() => setResultView('audit')}
                className={`flex-1 px-4 py-3 text-sm font-black transition-colors ${
                  resultView === 'audit'
                    ? 'border-b-2 border-indigo-500 text-indigo-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Lịch sử ({resultAuditEvents.length})
              </button>
            </div>

            <div className="p-5">
              {resultView === 'overview' && (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                    <span className="font-bold text-slate-600">Thời gian nộp</span>
                    <span className="font-black text-slate-900">{sub?.submitted_at ? new Date(sub.submitted_at).toLocaleString('vi-VN') : '—'}</span>
                  </div>
                  {sub?.force_submitted_at && (
                    <div className="flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3">
                      <span className="font-bold text-rose-600">Bị nộp bắt buộc lúc</span>
                      <span className="font-black text-rose-700">{new Date(sub.force_submitted_at).toLocaleString('vi-VN')}</span>
                    </div>
                  )}
                  {sub?.quiz_result && (
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Kết quả trắc nghiệm</p>
                      <p className="mt-1 text-lg font-black text-indigo-900 tabular-nums">
                        {sub.quiz_result.correct_count}/{sub.quiz_result.total} đúng ({sub.quiz_result.score_pct}%)
                      </p>
                    </div>
                  )}
                  {resultAuditEvents.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sự kiện ghi nhận</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        Tổng cộng <span className="font-black text-slate-900">{resultAuditEvents.length}</span> sự kiện đã được ghi lại trong phiên thi này.
                      </p>
                      <button
                        type="button"
                        onClick={() => setResultView('audit')}
                        className="mt-2 text-xs font-black text-indigo-600 hover:text-indigo-700"
                      >
                        Xem chi tiết →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {resultView === 'answers' && (
                <div className="space-y-3">
                  {stType === 'online_quiz' || stType === 'multiple_choice' ? (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Đáp án đã chọn</p>
                      {sub?.quiz_result?.results && sub.quiz_result.results.length > 0 ? (
                        <ol className="space-y-2">
                          {sub.quiz_result.results.map((r, i) => (
                            <li key={String(r.question_uid ?? i)} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <div className="flex items-start gap-3">
                                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                                  r.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                }`}>
                                  {r.is_correct ? '✓' : '✗'}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-black text-slate-900">{String(r.question_text ?? `Câu ${i + 1}`)}</p>
                                  <p className="mt-1 text-xs text-slate-600">
                                    Bạn chọn: <span className="font-black text-slate-800">{String(r.chosen ?? '(bỏ trống)').toUpperCase()}</span>
                                    {' · '}
                                    Đáp án đúng: <span className="font-black text-emerald-700">{String(r.correct_answer ?? '').toUpperCase()}</span>
                                  </p>
                                  {(r.explanation as string | undefined) && (
                                    <p className="mt-1 text-xs italic text-slate-500">{String(r.explanation)}</p>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="text-sm text-slate-400">Không có dữ liệu đáp án.</p>
                      )}
                    </div>
                  ) : stType === 'file' ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">File đã nộp</p>
                      {sub?.resource_url ? (
                        <a
                          href={String(sub.resource_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-2 text-sm font-black text-indigo-600 hover:text-indigo-700"
                        >
                          <File size={14} />
                          {String(sub.resource_name ?? 'Mở file đã nộp')}
                        </a>
                      ) : (
                        <p className="mt-1 text-sm text-slate-400">Không có file.</p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bài làm tự luận</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm font-bold text-slate-800">{sub?.content || '(trống)'}</p>
                    </div>
                  )}
                </div>
              )}

              {resultView === 'audit' && (
                <div>
                  {resultAuditEvents.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-400">Chưa có sự kiện nào được ghi nhận.</p>
                  ) : (
                    <ol className="relative space-y-2 border-l-2 border-slate-200 pl-5">
                      {resultAuditEvents.map((ev) => {
                        const violation = isAuditViolation(ev.event_type);
                        const limit = isAuditLimit(ev.event_type);
                        const force = isAuditForce(ev.event_type);
                        const dotColor = force || limit
                          ? 'bg-rose-500 ring-rose-200'
                          : violation
                            ? 'bg-amber-500 ring-amber-200'
                            : 'bg-indigo-400 ring-indigo-200';
                        return (
                          <li key={ev.uid} className="relative">
                            <span className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full ring-4 ${dotColor}`} />
                            <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2.5">
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm font-black ${
                                  force || limit ? 'text-rose-700' : violation ? 'text-amber-700' : 'text-slate-800'
                                }`}>
                                  {humanizeAuditEvent(ev.event_type)}
                                </p>
                                {ev.event_data && Object.keys(ev.event_data).length > 0 && (
                                  <p className="mt-0.5 text-[11px] font-bold text-slate-500">
                                    {formatAuditEventData(ev.event_type, ev.event_data)}
                                  </p>
                                )}
                              </div>
                              <time className="shrink-0 text-[11px] font-bold tabular-nums text-slate-400">
                                {formatAuditClockTime(ev.created_at)}
                              </time>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </div>
              )}
            </div>
          </div>
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
          onFaceEvent={handleFaceEvent}
        />
      )}

      {/* Proctoring warning toast (fixed top-right, auto-dismiss) */}
      {warning && (
        <div
          key={`${warning.severity}-${warning.count}-${warning.rule ?? 'none'}-${warning.message}`}
          className={`fixed right-4 top-4 z-[200] w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-2xl border bg-white shadow-2xl animate-in slide-in-from-top-2 fade-in duration-300 ${
            warning.severity === 'danger'
              ? 'border-rose-300'
              : warning.severity === 'warning'
                ? 'border-amber-300'
                : 'border-indigo-300'
          }`}
          role="alert"
          aria-live="assertive"
        >
          <div
            className={`flex items-start gap-3 border-b px-4 py-3 ${
              warning.severity === 'danger'
                ? 'border-rose-200 bg-rose-50'
                : warning.severity === 'warning'
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-indigo-200 bg-indigo-50'
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                warning.severity === 'danger'
                  ? 'bg-rose-100'
                  : warning.severity === 'warning'
                    ? 'bg-amber-100'
                    : 'bg-indigo-100'
              }`}
            >
              <AlertTriangle
                size={18}
                className={
                  warning.severity === 'danger'
                    ? 'text-rose-600'
                    : warning.severity === 'warning'
                      ? 'text-amber-600'
                      : 'text-indigo-600'
                }
              />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-black ${
                  warning.severity === 'danger'
                    ? 'text-rose-700'
                    : warning.severity === 'warning'
                      ? 'text-amber-700'
                      : 'text-indigo-700'
                }`}
              >
                {warning.severity === 'danger'
                  ? 'Cảnh báo nghiêm trọng'
                  : warning.severity === 'warning'
                    ? 'Cảnh báo'
                    : 'Thông báo'}
              </p>
              <p className="mt-0.5 text-sm font-bold text-slate-800">{warning.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setWarning(null)}
              className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              aria-label="Đóng"
            >
              ×
            </button>
          </div>
          {warning.rule && warning.max > 0 && (
            <div className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="flex-1">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <span>
                    {warning.rule === 'visibility_breaks'
                      ? 'Rời tab/cửa sổ'
                      : 'Cảnh báo khuôn mặt'}
                  </span>
                  <span className="tabular-nums">
                    {warning.count}/{warning.max}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      warning.remaining !== null && warning.remaining <= 0
                        ? 'bg-rose-500'
                        : warning.remaining !== null && warning.remaining === 1
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (warning.count / warning.max) * 100)}%`,
                    }}
                  />
                </div>
                {warning.remaining !== null && (
                  <p
                    className={`mt-1 text-[11px] font-bold ${
                      warning.remaining <= 0
                        ? 'text-rose-600'
                        : warning.remaining === 1
                          ? 'text-amber-600'
                          : 'text-slate-500'
                    }`}
                  >
                    {warning.remaining <= 0
                      ? 'Hết lượt cho phép — bài sẽ bị nộp bắt buộc'
                      : `Còn ${warning.remaining} lần`}
                  </p>
                )}
              </div>
            </div>
          )}
          <div
            className={`h-1 origin-left animate-toast-progress ${
              warning.severity === 'danger' ? 'bg-rose-500' : warning.severity === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'
            }`}
            style={{ ['--toast-duration' as string]: `${warning.severity === 'danger' ? 8 : 5}s` }}
          />
        </div>
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

          {isOnline && session?.uid && (
            <button
              type="button"
              onClick={() => {
                setAuditOpen(true);
                void fetchAuditLog();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 transition-all hover:bg-slate-100"
              title="Xem lịch sử giám sát"
            >
              <Activity size={14} className="text-slate-500" />
              <span className="hidden sm:inline">Lịch sử</span>
            </button>
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

      {/* Audit log modal (self-view) */}
      {auditOpen && (
        <div
          className="fixed inset-0 z-[300] flex items-end justify-center bg-slate-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setAuditOpen(false)}
        >
          <div
            className="flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[80vh] sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-200 bg-gradient-to-br from-indigo-50 to-white px-6 py-4">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500">
                  <Activity size={12} />
                  Lịch sử giám sát
                </div>
                <h2 className="mt-1 text-lg font-black text-slate-900">
                  {auditCounters && (
                    <>
                      {auditCounters.visibility_breaks.count}/{auditCounters.visibility_breaks.max}
                      <span className="ml-1 text-xs font-bold text-slate-500">rời màn hình</span>
                      <span className="mx-2 text-slate-300">·</span>
                      {auditCounters.face_warnings.count}/{auditCounters.face_warnings.max}
                      <span className="ml-1 text-xs font-bold text-slate-500">cảnh báo khuôn mặt</span>
                    </>
                  )}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAuditOpen(false)}
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {auditLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={28} className="animate-spin text-indigo-500" />
                </div>
              ) : auditEvents.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm font-bold text-slate-400">Chưa có sự kiện nào.</p>
                </div>
              ) : (
                <ol className="relative space-y-3 border-l-2 border-slate-200 pl-5">
                  {auditEvents.map((ev) => {
                    const violation = isAuditViolation(ev.event_type);
                    const limit = isAuditLimit(ev.event_type);
                    const force = isAuditForce(ev.event_type);
                    const dotColor = force
                      ? 'bg-rose-500 ring-rose-200'
                      : limit
                        ? 'bg-rose-500 ring-rose-200'
                        : violation
                          ? 'bg-amber-500 ring-amber-200'
                          : 'bg-indigo-400 ring-indigo-200';
                    return (
                      <li key={ev.uid} className="relative">
                        <span
                          className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full ring-4 ${dotColor}`}
                        />
                        <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-black ${
                              force ? 'text-rose-700' : limit ? 'text-rose-700' : violation ? 'text-amber-700' : 'text-slate-800'
                            }`}>
                              {humanizeAuditEvent(ev.event_type)}
                            </p>
                            {ev.event_data && Object.keys(ev.event_data).length > 0 && (
                              <p className="mt-0.5 text-[11px] font-bold text-slate-500">
                                {formatAuditEventData(ev.event_type, ev.event_data)}
                              </p>
                            )}
                          </div>
                          <time className="shrink-0 text-[11px] font-bold tabular-nums text-slate-400">
                            {formatAuditClockTime(ev.created_at)}
                          </time>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function humanizeAuditEvent(eventType: string): string {
  return humanizeAuditEventShared(eventType);
}
