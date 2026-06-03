'use client';

import { use, useEffect, useRef, useState } from 'react';
import type { DragEvent, FormEvent, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock3,
  File,
  FileDown,
  FileText,
  MessageSquareText,
  Trash2,
  X,
  Image as ImageIcon,
  Loader2,
  UploadCloud,
  Camera,
  Timer,
  Check,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { classroomApi, Classroom, Exam, ExamContentType, ExamSubmission, ExamSubmissionType } from '@/lib/api';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';
import { FaceMonitorWidget } from '@/components/face/face-monitor-widget';

export default function ConsumerExamDetailPage({ params }: { params: Promise<{ uid: string; examUid: string }> }) {
  const { uid, examUid } = use(params);
  const router = useRouter();
  const { isAuthenticated, mounted } = useRequireAuth();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [submission, setSubmission] = useState<ExamSubmission | null>(null);
  const [quizData, setQuizData] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<PreviewFile | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quizStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !uid || !examUid) return;

    const fetchExam = async () => {
      try {
        setLoading(true);
        setError('');
        const [classroomData, examsData] = await Promise.all([
          classroomApi.retrieve(uid),
          classroomApi.exams(uid),
        ]);
        const publishedExam = examsData.find(item => item.uid === examUid && item.status === 'published');

        if (!publishedExam) {
          throw new Error('Không tìm thấy bài kiểm tra đã xuất bản.');
        }

        setClassroom(classroomData);
        setExam(publishedExam);

        if (publishedExam.exam_type === 'quiz') {
          try {
            const questions = await classroomApi.examQuestions(examUid);
            setQuizData(questions);
            quizStartedAtRef.current = Date.now();
          } catch (err) {
            console.error('Failed to load exam questions', err);
          }
        }

        try {
          const currentSubmission = await classroomApi.examSubmission(examUid);
          setSubmission(currentSubmission);
        } catch {
          setSubmission(null);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Không thể tải bài kiểm tra');
      } finally {
        setLoading(false);
      }
    };

    void fetchExam();
  }, [examUid, isAuthenticated, uid]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => {
    if (selectedPreviewFile?.url.startsWith('blob:')) URL.revokeObjectURL(selectedPreviewFile.url);
  }, [selectedPreviewFile]);

  if (!mounted) return null;

  if (loading) {
    return <ExamResultSkeleton />;
  }

  if (error || !exam) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md space-y-4 rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Không thể tải bài kiểm tra</h2>
          <p className="text-sm text-slate-500">{error || 'Không tìm thấy bài kiểm tra'}</p>
          <Button onClick={() => router.push(`/consumer/classroom/${uid}`)} className="w-full bg-indigo-600">
            Quay lại lớp học
          </Button>
        </div>
      </div>
    );
  }

  const deadline = getDeadlineMeta(exam.due_date, now);
  const submissionDisabled = deadline.expired || submitting || (exam.exam_type === 'quiz' && submission !== null);
  const submitActionDisabled = submissionDisabled || (exam.exam_type === 'assignment' && !answerFile) || (exam.exam_type === 'quiz' && Object.keys(quizAnswers).length === 0);
  const submittedFile = submission?.resource_url
    ? {
        url: submission.resource_url,
        name: submission.resource_name || 'File đã nộp',
        type: 'file',
      }
    : null;

  const handleSelectFile = (file: File | null) => {
    setAnswerFile(file);
    setSelectedPreviewFile(file
      ? { url: URL.createObjectURL(file), name: file.name, type: getSubmissionContentType(file) }
      : null);
  };

  const handleFileDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);
    if (submissionDisabled) return;
    handleSelectFile(event.dataTransfer.files?.[0] || null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionDisabled) return;

    try {
      setSubmitting(true);
      setSubmitError('');
      setSubmitMessage('');

      if (exam.exam_type === 'quiz') {
        const timeTaken = quizStartedAtRef.current
          ? Math.floor((Date.now() - quizStartedAtRef.current) / 1000)
          : 0;
        const savedSubmission = await classroomApi.submitExam(examUid, {
          submission_type: 'multiple_choice',
          answers: quizAnswers,
          time_taken_seconds: timeTaken,
        });
        setSubmission(savedSubmission);
        setSubmitMessage('Bài thi trắc nghiệm đã được nộp và tự động chấm điểm.');
      } else {
        const selectedFile = answerFile!;
        const uploadedResource = await saveSubmissionResource(selectedFile, examUid, submission?.ref_id || null);
        const savedSubmission = await classroomApi.submitExam(examUid, {
          submission_type: 'file',
          ref_id: uploadedResource.uid,
        });
        setSubmission(savedSubmission);
        setAnswerFile(null);
        setSelectedPreviewFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSubmitMessage('Đã nộp bài tự luận thành công.');
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể nộp bài. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveFile = async () => {
    if (answerFile) {
      setAnswerFile(null);
      setSelectedPreviewFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!submission?.resource_url || submissionDisabled) return;

    try {
      setSubmitting(true);
      setSubmitError('');
      setSubmitMessage('');
      const savedSubmission = await classroomApi.submitExam(examUid, {
        submission_type: 'essay',
        content: '',
        ref_id: null,
      });
      setSubmission(savedSubmission);
      setSubmitMessage('Đã xóa file khỏi bài nộp.');
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Không thể xóa file. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const resultStatus = getResultStatusMeta(submission);
  const isLate = submission ? isLateSubmission(submission, exam.due_date) : false;
  const grade = typeof submission?.grade === 'number' ? submission.grade : null;
  const maxGrade = exam.max_grade || 10;
  const gradePercent = grade === null ? 0 : Math.min(100, Math.max(0, (grade / maxGrade) * 100));
  const hasFeedback = Boolean(submission?.feedback?.trim());
  const assignmentResource = exam.meta?.url || (exam.content_type !== 'markdown' ? exam.body : '');

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900 lg:pb-0">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/consumer/classroom/${uid}`)}
                className="shrink-0 rounded-xl hover:bg-slate-100"
              >
                <ArrowLeft size={20} />
              </Button>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">
                  {classroom?.name || 'Lớp học'} • {exam.exam_type === 'quiz' ? 'Thi trắc nghiệm' : 'Thi tự luận'}
                </p>
                <h1 className="truncate text-base font-black text-slate-900 sm:text-lg">{exam.title}</h1>
              </div>
            </div>
            <div className="ml-12 flex flex-wrap items-center gap-2 text-xs font-bold sm:ml-auto">
              <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${resultStatus.className}`}>{resultStatus.label}</span>
              {exam.due_date && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-slate-500">
                  <Calendar size={13} /> {formatDateTime(exam.due_date)}
                </span>
              )}
              <span className="rounded-lg bg-slate-50 px-3 py-2 text-slate-500">Tối đa: <strong className="text-slate-800">{maxGrade}</strong></span>
            </div>
          </div>
        </header>

        <main className="mx-auto grid w-full max-w-7xl items-start gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-5">
            {exam.exam_mode === 'online' && exam.camera_required && !submission && (
              <div className="flex items-center gap-4 rounded-2xl border border-rose-100 bg-rose-50 p-5 text-rose-900 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
                  <Camera size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black">Yêu cầu Camera</h3>
                  <p className="text-sm font-medium leading-relaxed opacity-90">
                    Đây là bài thi trực tuyến yêu cầu giám sát qua camera. Vui lòng đảm bảo camera của bạn đang hoạt động bình thường trong suốt thời gian làm bài.
                  </p>
                </div>
              </div>
            )}

            {exam.exam_type === 'quiz' && (
              <div className="space-y-6">
                {submission ? (
                  <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm shadow-emerald-100/40">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-emerald-50 px-5 py-6">
                      <div>
                        <h2 className="text-xl font-black text-emerald-900">Kết quả thi trắc nghiệm</h2>
                        <p className="text-sm font-medium text-emerald-700">Hệ thống đã tự động chấm điểm bài làm của bạn</p>
                        {submission.passed != null && (
                          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${submission.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {submission.passed ? 'Đạt' : 'Không đạt'}
                          </span>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-black text-emerald-600">{submission.grade ?? '--'}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500">/ {submission.max_grade ?? maxGrade} điểm</div>
                      </div>
                    </div>

                    {submission.quiz_result && (
                      <div className="px-5 pt-4">
                        <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-500">
                          <span>Số câu đúng: <strong className="text-slate-800">{submission.quiz_result.correct_count}/{submission.quiz_result.total}</strong></span>
                          <span className="text-emerald-600 font-black">{submission.quiz_result.score_pct}%</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                            style={{ width: `${submission.quiz_result.score_pct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0 mt-2">
                      <div className="p-5">
                        <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Thông tin nộp bài</div>
                        <p className="text-sm font-bold text-slate-700">Nộp lúc: {formatDateTime(submission.submitted_at)}</p>
                        <p className="text-xs font-medium text-slate-500">{isLate ? 'Nộp trễ hạn' : 'Nộp đúng hạn'}</p>
                      </div>
                      <div className="p-5">
                        <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Chấm điểm</div>
                        <p className="text-sm font-bold text-slate-700">
                          {submission.grading_method === 'auto' ? 'Tự động chấm điểm' : submission.grading_method === 'ai' ? 'AI chấm điểm' : 'Giáo viên chấm'}
                        </p>
                        {submission.feedback && (
                          <p className="text-xs font-medium text-slate-500 mt-1">{submission.feedback}</p>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* Per-question breakdown */}
                  {submission.quiz_result?.results && submission.quiz_result.results.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chi tiết từng câu</div>
                      {submission.quiz_result.results.map((item, idx) => (
                        <div
                          key={item.question_uid}
                          className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${item.is_correct ? 'border-emerald-100' : 'border-rose-100'}`}
                        >
                          <div className="flex items-start gap-3 p-4">
                            {item.is_correct
                              ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
                              : <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
                            }
                            <p className="text-sm font-bold leading-relaxed text-slate-900">
                              <span className="mr-1 font-black text-slate-400">{idx + 1}.</span>
                              {item.question_text}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3">
                            {item.chosen && (
                              <span className={`rounded-lg px-3 py-1 text-xs font-black uppercase ${item.is_correct ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                Bạn chọn: {item.chosen}
                              </span>
                            )}
                            {!item.is_correct && (
                              <span className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-black uppercase text-emerald-700">
                                Đáp án: {item.correct_answer}
                              </span>
                            )}
                          </div>
                          {item.explanation && (
                            <div className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-xs font-medium leading-5 text-slate-600">
                              <span className="font-black text-amber-600">Giải thích: </span>{item.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                ) : !quizData ? (
                  <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
                    <Loader2 className="mb-4 animate-spin text-indigo-500" size={32} />
                    <p className="text-sm font-bold text-slate-500">Đang tải câu hỏi...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                          <Timer size={20} />
                        </div>
                        <div>
                          <h2 className="text-base font-black text-indigo-900">Hướng dẫn làm bài trắc nghiệm</h2>
                          <p className="text-xs font-medium text-indigo-700">Vui lòng chọn đáp án đúng nhất. Bạn chỉ được nộp bài 1 lần duy nhất.</p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {quizData.questions.map((q: any, index: number) => (
                        <Card key={q.uid} className="overflow-hidden rounded-2xl border-slate-200 shadow-sm transition-all hover:border-indigo-200">
                          <CardHeader className="bg-slate-50/50 pb-3 pt-4">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-[10px] font-black text-indigo-600">
                                {index + 1}
                              </span>
                              <h3 className="text-sm font-bold text-slate-800 leading-relaxed">{q.question_text}</h3>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-2">
                            <div className="grid grid-cols-1 gap-2">
                              {['a', 'b', 'c', 'd'].map((letter) => {
                                const optionText = q[`option_${letter}`];
                                if (!optionText) return null;
                                const isSelected = quizAnswers[q.uid] === letter;

                                return (
                                  <button
                                    key={letter}
                                    type="button"
                                    onClick={() => setQuizAnswers(prev => ({ ...prev, [q.uid]: letter }))}
                                    className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50'}`}
                                  >
                                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black uppercase ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                      {letter}
                                    </span>
                                    <span className={`text-sm font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{optionText}</span>
                                    {isSelected && <Check size={16} className="ml-auto text-indigo-500" />}
                                  </button>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-center">
                        <p className="mb-4 text-sm font-medium text-slate-500">Kiểm tra kỹ các đáp án trước khi nộp bài. Bạn đã làm {Object.keys(quizAnswers).length}/{quizData.total_questions} câu.</p>
                        {submitError && <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm font-bold text-rose-600">{submitError}</div>}
                        <Button
                          type="submit"
                          disabled={submitActionDisabled}
                          className="h-12 w-full max-w-xs rounded-xl bg-indigo-600 font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700"
                        >
                          {submitting ? <Loader2 size={18} className="mr-2 animate-spin" /> : 'NỘP BÀI TRẮC NGHIỆM'}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {exam.exam_type === 'assignment' && (
              <>
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 text-slate-800">
                    <FileText size={18} className="text-indigo-500" />
                    <h2 className="text-base font-black">Đề bài tự luận</h2>
                  </div>
                  <div className="p-4 sm:p-5">
                    {exam.description && (
                      <p className="mb-4 text-sm font-medium leading-6 text-slate-600">{exam.description}</p>
                    )}
                    {exam.content_type === 'markdown' ? (
                      <div className="prose prose-slate max-w-none text-sm font-medium leading-relaxed">
                        {exam.body}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{exam.meta?.name || 'Đề bài đính kèm'}</p>
                            <p className="text-[10px] font-black uppercase text-slate-400">{exam.content_type}</p>
                          </div>
                        </div>
                        {assignmentResource && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewFile({ url: assignmentResource, name: exam.resource_name || exam.title, type: exam.content_type })}
                            className="rounded-lg text-indigo-600 hover:bg-indigo-50"
                          >
                            Xem đề bài
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm shadow-indigo-100/40">
                  <form id="exam-submission-form" onSubmit={handleSubmit}>
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                      <div>
                        <h2 className="text-lg font-black">Bài nộp của bạn</h2>
                        <p className="text-xs font-medium text-slate-500">Upload file bài làm (PDF, DOCX, ZIP, JPG, PNG)</p>
                      </div>
                    </div>

                    <div className="space-y-4 p-5">
                      <label
                        onDragEnter={event => {
                          event.preventDefault();
                          if (!submissionDisabled) setIsDraggingFile(true);
                        }}
                        onDragOver={event => event.preventDefault()}
                        onDragLeave={() => setIsDraggingFile(false)}
                        onDrop={handleFileDrop}
                        className={`group flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-all duration-200 ${
                          submissionDisabled
                            ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                            : isDraggingFile
                              ? '-translate-y-0.5 border-indigo-500 bg-indigo-50 shadow-sm'
                              : 'border-indigo-200 bg-indigo-50/30 hover:-translate-y-0.5 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-sm'
                        }`}
                      >
                        <span className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl transition-transform ${submissionDisabled ? 'bg-slate-100 text-slate-300' : 'bg-white text-indigo-600 shadow-sm group-hover:scale-105'}`}>
                          <UploadCloud size={23} />
                        </span>
                        <span className="text-sm font-black text-slate-800">{answerFile?.name || (submission?.resource_url ? 'Kéo thả file mới để thay đổi bài làm' : 'Kéo thả file bài làm vào đây')}</span>
                        <span className="mt-1 text-xs font-medium text-slate-500">{submissionDisabled ? 'Đã hết hạn nộp bài' : 'hoặc bấm để chọn file từ máy tính'}</span>
                        <input ref={fileInputRef} type="file" disabled={submissionDisabled} onChange={event => handleSelectFile(event.target.files?.[0] || null)} className="sr-only" />
                      </label>

                      {(selectedPreviewFile || submittedFile) ? (
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600">
                              <FileText size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-slate-700">{(selectedPreviewFile || submittedFile)?.name}</p>
                              {submission?.submitted_at && !selectedPreviewFile && <p className="text-xs text-slate-500">Đã nộp lúc {formatDateTime(submission.submitted_at)}</p>}
                            </div>
                            <button type="button" onClick={() => setPreviewFile(selectedPreviewFile || submittedFile)} className="rounded-lg px-2 py-1 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50">
                              Xem
                            </button>
                            {(answerFile || (submission?.resource_url && !deadline.expired)) && (
                              <button type="button" onClick={handleRemoveFile} className="rounded-lg p-1 text-rose-500 hover:bg-rose-50">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ) : null}

                      {submitError && <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm font-bold text-rose-600">{submitError}</div>}
                      {submitMessage && <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{submitMessage}</div>}
                    </div>
                    <div className="hidden border-t border-slate-100 bg-slate-50 px-5 py-4 sm:block">
                      <Button type="submit" disabled={submitActionDisabled} className="h-12 w-full rounded-xl bg-indigo-600 font-bold text-white shadow-sm hover:bg-indigo-700 disabled:bg-slate-300">
                        {submitting && <Loader2 size={16} className="mr-2 animate-spin" />}
                        {submission ? 'Cập nhật bài làm' : 'Nộp bài tự luận'}
                      </Button>
                    </div>
                  </form>
                </section>
              </>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-5">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-indigo-600 p-5 text-white">
                <p className="text-xs font-bold text-indigo-100">Điểm của bạn</p>
                <p className="mt-2 text-4xl font-black">{grade === null ? '--' : grade.toFixed(1)}<span className="ml-1 text-lg text-indigo-200">/ {maxGrade}</span></p>
                {grade !== null && (
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-indigo-400/40">
                    <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${gradePercent}%` }} />
                  </div>
                )}
                <p className="mt-2 text-xs text-indigo-100">{grade === null ? 'Chưa có điểm' : `Hoàn thành ${gradePercent.toFixed(0)}% mục tiêu`}</p>
              </div>
              <div className="divide-y divide-slate-100 px-5">
                <SidebarRow label="Trạng thái" value={<span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${resultStatus.className}`}>{resultStatus.label}</span>} />
                <SidebarRow label="Hạn chót" value={exam.due_date ? formatDateTime(exam.due_date) : 'Không có'} />
                {submission?.submitted_at && <SidebarRow label="Ngày nộp" value={formatDateTime(submission.submitted_at)} />}
                {submission?.returned_at && <SidebarRow label="Trả bài lúc" value={formatDateTime(submission.returned_at)} />}
              </div>
            </section>

            <CompactProgress submission={submission} isGraded={grade !== null} hasFeedback={hasFeedback} />

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquareText size={16} className="text-indigo-500" />
                <h2 className="text-sm font-black text-slate-800">Nhận xét của giáo viên</h2>
              </div>
              {hasFeedback ? (
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">{submission?.feedback}</p>
                  {submission?.graded_at && <p className="mt-3 text-xs font-medium text-slate-400">Đã chấm lúc {formatDateTime(submission.graded_at)}</p>}
                </div>
              ) : (
                <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 text-xs font-medium leading-5 text-slate-500">
                  <Clock3 size={15} className="mt-0.5 shrink-0 text-slate-400" />
                  <span>{grade !== null ? 'Giáo viên chưa để lại nhận xét.' : submission ? 'Đang chờ giáo viên chấm bài.' : 'Nộp bài để xem nhận xét.'}</span>
                </div>
              )}
            </section>
          </aside>
        </main>

        {exam.exam_type === 'assignment' && (
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] sm:hidden">
            <Button form="exam-submission-form" type="submit" disabled={submitActionDisabled} className="h-12 w-full rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700 disabled:bg-slate-300">
              {submitting && <Loader2 size={16} className="mr-2 animate-spin" />}
              {submission ? 'Cập nhật bài làm' : 'Nộp bài tự luận'}
            </Button>
          </div>
        )}

        {previewFile && (
          <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
        )}

        {exam.exam_mode === 'online' && <FaceMonitorWidget examUid={examUid} />}
      </div>
  );
}

function SidebarRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3.5 text-xs">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="text-right font-bold text-slate-800">{value}</span>
    </div>
  );
}

function CompactProgress({ submission, isGraded, hasFeedback }: { submission: ExamSubmission | null; isGraded: boolean; hasFeedback: boolean }) {
  const steps = [
    { label: 'Đề bài', done: true, current: !submission },
    { label: 'Đã nộp', done: Boolean(submission), current: Boolean(submission) && !isGraded },
    { label: 'Đã chấm', done: isGraded, current: isGraded && !hasFeedback },
    { label: 'Feedback', done: hasFeedback, current: false },
  ] as const;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-black text-slate-900">Tiến độ bài thi</h2>
      <div className="flex items-start">
        {steps.map((step, index) => (
          <div key={step.label} className="relative flex min-w-0 flex-1 flex-col items-center text-center">
            {index < steps.length - 1 && (
              <span className={`absolute left-1/2 top-3 h-0.5 w-full ${steps[index + 1].done ? 'bg-emerald-300' : 'bg-slate-200'}`} />
            )}
            <span className={`relative z-[1] flex h-6 w-6 items-center justify-center rounded-full ${
              step.done ? 'bg-emerald-100 text-emerald-600' : step.current ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'
            }`}>
              {step.done ? <CheckCircle2 size={14} /> : <span className="h-2 w-2 rounded-full bg-current" />}
            </span>
            <div className="relative z-[1] mt-2 bg-white px-1">
              <p className={`text-[10px] font-bold ${step.done || step.current ? 'text-slate-700' : 'text-slate-400'}`}>{step.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExamResultSkeleton() {
  return (
    <div className="min-h-screen animate-pulse bg-slate-50">
      <div className="h-16 border-b border-slate-200 bg-white" />
      <div className="mx-auto grid max-w-7xl gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="h-80 rounded-2xl border border-slate-100 bg-white p-5">
            <div className="h-full rounded-xl bg-slate-100" />
          </div>
          <div className="h-32 rounded-2xl bg-white p-5">
            <div className="h-full rounded-xl bg-slate-100" />
          </div>
        </div>
        <div className="h-72 rounded-2xl bg-white p-5">
          <div className="h-full rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

type PreviewFile = {
  url: string;
  name: string;
  type?: ExamContentType | string;
};

function FilePreviewModal({ file, onClose }: { file: PreviewFile; onClose: () => void }) {
  const normalizedType = file.type || 'file';
  const isImage = normalizedType === 'image';
  const isPdf = normalizedType === 'pdf' || file.name.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex h-14 items-center justify-between gap-3 border-b border-slate-100 px-4">
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-slate-900">{file.name}</div>
            <div className="text-[10px] font-black uppercase text-slate-400">Xem trước file</div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} className="shrink-0 rounded-full">
            <X size={18} />
          </Button>
        </div>

        <div className="min-h-[50vh] flex-1 overflow-auto bg-slate-50">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.url} alt={file.name} className="mx-auto block max-w-full" />
          ) : isPdf ? (
            <iframe src={file.url} title={file.name} className="h-full w-full border-none" />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-slate-400">
              <FileDown size={48} className="mb-4" />
              <p className="mb-4 text-sm font-bold">Không thể xem trước định dạng này</p>
              <Button asChild className="rounded-xl bg-indigo-600 font-bold">
                <a href={file.url} download={file.name}>TẢI XUỐNG</a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDateTime(isoString?: string | null) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getDeadlineMeta(due_date?: string | null, now = Date.now()) {
  if (!due_date) return { expired: false, label: '' };
  const d = new Date(due_date).getTime();
  const diff = d - now;
  if (diff < 0) return { expired: true, label: 'Đã hết hạn' };
  return { expired: false, label: 'Đang mở' };
}

function getResultStatusMeta(submission: ExamSubmission | null) {
  if (!submission) return { label: 'Chưa nộp', className: 'bg-slate-50 text-slate-500 border-slate-200' };
  if (submission.status === 'graded') return { label: 'Đã chấm', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
  if (submission.status === 'submitted') return { label: 'Đã nộp', className: 'bg-indigo-50 text-indigo-700 border-indigo-100' };
  return { label: 'Đang xử lý', className: 'bg-amber-50 text-amber-700 border-amber-100' };
}

function isLateSubmission(submission: ExamSubmission, due_date?: string | null) {
  if (!due_date || !submission.submitted_at) return false;
  return new Date(submission.submitted_at).getTime() > new Date(due_date).getTime();
}

function getSubmissionContentType(file: File): ExamContentType {
  const type = file.type.toLowerCase();
  if (type.includes('image')) return 'image';
  if (type.includes('pdf')) return 'pdf';
  return 'file';
}

async function saveSubmissionResource(file: File, examUid: string, existingRefId: string | null | undefined) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify({ context: 'exam_submission', exam_uid: examUid }));

  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${apiBase}/api/v1/resource/upload/`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error((error.message as string) || (error.detail as string) || 'Upload bài làm thất bại');
  }

  return response.json() as Promise<{ uid: string; url: string; name: string }>;
}
