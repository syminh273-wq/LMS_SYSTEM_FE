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
import { Input } from '@shared/components/ui/input';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
import { Label } from '@shared/components/ui/label';
import { classroomApi, Classroom, Exam, ExamContentType, ExamSubmission, ExamSubmissionType } from '@/lib/api';
import { useRequireAuth } from '@/features/auth/hooks/useRequireAuth';
import { FaceMonitorWidget } from '@/components/face/face-monitor-widget';

export default function ConsumerExamDetailPage({ params }: { params: Promise<{ uid: string; examUid: string }> }) {
  const { uid, examUid } = use(params);
  const router = useRouter();
  const { isAuthenticated, isMounted } = useRequireAuth();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [submission, setSubmission] = useState<ExamSubmission | null>(null);
  const [quizData, setQuizData] = useState<any>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number[]>>({});
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
        const [classroomData, examData] = await Promise.all([
          classroomApi.retrieve(uid),
          classroomApi.retrieveExam(examUid),
        ]);

        setClassroom(classroomData);
        setExam(examData);
        setSubmission(examData.submission ?? null);

        if (examData.exam_type === 'quiz') {
          try {
            const questions = await classroomApi.examQuestions(examUid);
            setQuizData(questions);
            quizStartedAtRef.current = Date.now();
          } catch (err) {
            console.error('Failed to load exam questions', err);
          }
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

  if (!isMounted) return null;

  if (loading) {
    return <ExamResultSkeleton />;
  }

  if (error || !exam) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
        <div className="w-full max-w-md space-y-4 rounded-3xl border border-destructive/20 bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-foreground">Không thể tải bài kiểm tra</h2>
          <p className="text-sm text-muted-foreground">{error || 'Không tìm thấy bài kiểm tra'}</p>
          <Button onClick={() => router.push(`/consumer/classroom/${uid}`)} className="w-full">
            Quay lại lớp học
          </Button>
        </div>
      </div>
    );
  }

  const deadline = getDeadlineMeta(exam.due_date, now);
  const submissionDisabled = deadline.expired || submitting || (exam.exam_type === 'quiz' && submission !== null);
  const answeredQuizCount = Object.values(quizAnswers).filter(a => a.length > 0).length;
  const submitActionDisabled = submissionDisabled || (exam.exam_type === 'assignment' && !answerFile) || (exam.exam_type === 'quiz' && answeredQuizCount === 0);
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
    <div className="min-h-screen bg-muted pb-20 text-foreground lg:pb-0">
        <header className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/consumer/classroom/${uid}`)}
                className="shrink-0"
              >
                <ArrowLeft size={20} />
              </Button>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                  {classroom?.name || 'Lớp học'} • {exam.exam_type === 'quiz' ? 'Thi trắc nghiệm' : 'Thi tự luận'}
                </p>
                <h1 className="truncate text-base font-black text-foreground sm:text-lg">{exam.title}</h1>
              </div>
            </div>
            <div className="ml-12 flex flex-wrap items-center gap-2 text-xs font-bold sm:ml-auto">
              <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${resultStatus.className}`}>{resultStatus.label}</span>
              {exam.due_date && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-muted-foreground">
                  <Calendar size={13} /> {formatDateTime(exam.due_date)}
                </span>
              )}
              <span className="rounded-lg bg-muted px-3 py-2 text-muted-foreground">Tối đa: <strong className="text-foreground">{maxGrade}</strong></span>
            </div>
          </div>
        </header>

        <main className="mx-auto grid w-full max-w-7xl items-start gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-5">
            {exam.exam_mode === 'online' && exam.camera_required && !submission && (
              <div className="flex items-center gap-4 rounded-2xl border border-destructive/20 bg-destructive/10 p-5 text-destructive shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-destructive text-white">
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
                  <>
                    <section className="overflow-hidden rounded-2xl border border-success/20 bg-card shadow-sm shadow-success/10">
                      <div className="flex items-center justify-between gap-3 border-b border-border bg-success/10 px-5 py-6">
                        <div>
                          <h2 className="text-xl font-black text-success">Kết quả thi trắc nghiệm</h2>
                          <p className="text-sm font-medium text-success">Hệ thống đã tự động chấm điểm bài làm của bạn</p>
                          {submission.passed != null && (
                            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${submission.passed ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                              {submission.passed ? 'Đạt' : 'Không đạt'}
                            </span>
                          )}
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-black text-success">{submission.grade ?? '--'}</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-success">/ {submission.max_grade ?? maxGrade} điểm</div>
                        </div>
                      </div>

                      {submission.quiz_result && (
                        <div className="px-5 pt-4">
                          <div className="mb-1 flex items-center justify-between text-xs font-bold text-muted-foreground">
                            <span>Số câu đúng: <strong className="text-foreground">{submission.quiz_result.correct_count}/{submission.quiz_result.total}</strong></span>
                            <span className="text-success font-black">{submission.quiz_result.score_pct}%</span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-success transition-all duration-700"
                              style={{ width: `${submission.quiz_result.score_pct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 mt-2">
                        <div className="p-5">
                          <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Thông tin nộp bài</div>
                          <p className="text-sm font-bold text-foreground">Nộp lúc: {formatDateTime(submission.submitted_at)}</p>
                          <p className="text-xs font-medium text-muted-foreground">{isLate ? 'Nộp trễ hạn' : 'Nộp đúng hạn'}</p>
                        </div>
                        <div className="p-5">
                          <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chấm điểm</div>
                          <p className="text-sm font-bold text-foreground">
                            {submission.grading_method === 'auto' ? 'Tự động chấm điểm' : submission.grading_method === 'ai' ? 'AI chấm điểm' : 'Giáo viên chấm'}
                          </p>
                          {submission.feedback && (
                            <p className="text-xs font-medium text-muted-foreground mt-1">{submission.feedback}</p>
                          )}
                        </div>
                      </div>
                    </section>

                    {submission.quiz_result?.results && submission.quiz_result.results.length > 0 && (
                      <div className="space-y-3">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Chi tiết từng câu</div>
                        {submission.quiz_result.results.map((item, idx) => (
                          <div
                            key={item.question_uid}
                            className={`overflow-hidden rounded-2xl border bg-card shadow-sm ${item.is_correct ? 'border-success/20' : 'border-destructive/20'}`}
                          >
                            <div className="flex items-start gap-3 p-4">
                              {item.is_correct
                                ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" />
                                : <AlertCircle size={18} className="mt-0.5 shrink-0 text-destructive" />
                              }
                              <p className="text-sm font-bold leading-relaxed text-foreground">
                                <span className="mr-1 font-black text-muted-foreground">{idx + 1}.</span>
                                {item.question_text}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 border-t border-border bg-muted px-4 py-3">
                              {item.chosen?.length > 0 && (
                                <span className={`rounded-lg px-3 py-1 text-xs font-black uppercase ${item.is_correct ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                                  Bạn chọn: {item.chosen.map(i => String.fromCharCode(65 + i)).join(', ')}
                                </span>
                              )}
                              {!item.is_correct && (
                                <span className="rounded-lg bg-success/10 px-3 py-1 text-xs font-black uppercase text-success">
                                  Đáp án: {item.correct_answers.map(i => String.fromCharCode(65 + i)).join(', ')}
                                </span>
                              )}
                            </div>
                            {item.explanation && (
                              <div className="border-t border-warning/20 bg-warning/10 px-4 py-2 text-xs font-medium leading-5 text-muted-foreground">
                                <span className="font-black text-warning">Giải thích: </span>{item.explanation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : !quizData ? (
                  <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card">
                    <Loader2 className="mb-4 animate-spin text-primary" size={32} />
                    <p className="text-sm font-bold text-muted-foreground">Đang tải câu hỏi...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                          <Timer size={20} />
                        </div>
                        <div>
                          <h2 className="text-base font-black text-primary">Hướng dẫn làm bài trắc nghiệm</h2>
                          <p className="text-xs font-medium text-primary">Vui lòng chọn đáp án đúng nhất. Bạn chỉ được nộp bài 1 lần duy nhất.</p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      {quizData.questions.map((q: any, index: number) => {
                        const isMultiType = q.question_type === 'multi_answer';
                        return (
                        <Card key={q.uid} className="overflow-hidden">
                          <CardHeader className="pb-3 pt-4">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-black text-primary">
                                {index + 1}
                              </span>
                              <h3 className="text-sm font-bold text-foreground leading-relaxed">{q.question_text}</h3>
                              {isMultiType && (
                                <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase text-primary">
                                  Nhiều đáp án
                                </span>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-2">
                            <div className="grid grid-cols-1 gap-2">
                              {(q.options as string[]).map((optionText: string, idx: number) => {
                                const chosenList = quizAnswers[q.uid] || [];
                                const isSelected = chosenList.includes(idx);

                                return (
                                  <Button
                                    key={idx}
                                    type="button"
                                    variant="outline"
                                    onClick={() => setQuizAnswers(prev => {
                                      const current = prev[q.uid] || [];
                                      const next = isMultiType
                                        ? (current.includes(idx) ? current.filter(i => i !== idx) : [...current, idx])
                                        : [idx];
                                      return { ...prev, [q.uid]: next };
                                    })}
                                    className={`flex h-auto items-center gap-3 rounded-xl p-3 text-left ${isSelected ? 'border-primary bg-primary/5' : ''}`}
                                  >
                                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black uppercase ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                      {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>{optionText}</span>
                                    {isSelected && <Check size={16} className="ml-auto text-primary" />}
                                  </Button>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                        );
                      })}

                      <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-center">
                        <p className="mb-4 text-sm font-medium text-muted-foreground">Kiểm tra kỹ các đáp án trước khi nộp bài. Bạn đã làm {answeredQuizCount}/{quizData.total_questions} câu.</p>
                        {submitError && <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm font-bold text-destructive">{submitError}</div>}
                        <Button
                          type="submit"
                          disabled={submitActionDisabled}
                          className="h-12 w-full max-w-xs"
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
                <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="flex items-center gap-2 border-b border-border px-5 py-4 text-foreground">
                    <FileText size={18} className="text-primary" />
                    <h2 className="text-base font-black">Đề bài tự luận</h2>
                  </div>
                  <div className="p-4 sm:p-5">
                    {exam.description && (
                      <p className="mb-4 text-sm font-medium leading-6 text-muted-foreground">{exam.description}</p>
                    )}
                    {exam.content_type === 'markdown' ? (
                      <div className="prose prose-slate max-w-none text-sm font-medium leading-relaxed">
                        {exam.body}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl bg-muted p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-card text-primary shadow-sm">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{exam.meta?.name || 'Đề bài đính kèm'}</p>
                            <p className="text-[10px] font-black uppercase text-muted-foreground">{exam.content_type}</p>
                          </div>
                        </div>
                        {assignmentResource && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewFile({ url: assignmentResource, name: exam.resource_name || exam.title, type: exam.content_type })}
                          >
                            Xem đề bài
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-sm shadow-primary/10">
                  <form id="exam-submission-form" onSubmit={handleSubmit}>
                    <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                      <div>
                        <h2 className="text-lg font-black">Bài nộp của bạn</h2>
                        <p className="text-xs font-medium text-muted-foreground">Upload file bài làm (PDF, DOCX, ZIP, JPG, PNG)</p>
                      </div>
                    </div>

                    <div className="space-y-4 p-5">
                      <Label
                        onDragEnter={event => {
                          event.preventDefault();
                          if (!submissionDisabled) setIsDraggingFile(true);
                        }}
                        onDragOver={event => event.preventDefault()}
                        onDragLeave={() => setIsDraggingFile(false)}
                        onDrop={handleFileDrop}
                        className={`group flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-all duration-200 ${
                          submissionDisabled
                            ? 'cursor-not-allowed border-border bg-muted text-muted-foreground'
                            : isDraggingFile
                              ? '-translate-y-0.5 border-primary bg-primary/5 shadow-sm'
                              : 'border-primary/20 bg-primary/5 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/10 hover:shadow-sm'
                        }`}
                      >
                        <span className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl transition-transform ${submissionDisabled ? 'bg-muted text-muted-foreground' : 'bg-card text-primary shadow-sm group-hover:scale-105'}`}>
                          <UploadCloud size={23} />
                        </span>
                        <span className="text-sm font-black text-foreground">{answerFile?.name || (submission?.resource_url ? 'Kéo thả file mới để thay đổi bài làm' : 'Kéo thả file bài làm vào đây')}</span>
                        <span className="mt-1 text-xs font-medium text-muted-foreground">{submissionDisabled ? 'Đã hết hạn nộp bài' : 'hoặc bấm để chọn file từ máy tính'}</span>
                        <Input ref={fileInputRef} type="file" disabled={submissionDisabled} onChange={event => handleSelectFile(event.target.files?.[0] || null)} className="sr-only" />
                      </Label>

                      {(selectedPreviewFile || submittedFile) ? (
                        <div className="rounded-xl border border-border bg-muted p-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card text-primary">
                              <FileText size={18} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-foreground">{(selectedPreviewFile || submittedFile)?.name}</p>
                              {submission?.submitted_at && !selectedPreviewFile && <p className="text-xs text-muted-foreground">Đã nộp lúc {formatDateTime(submission.submitted_at)}</p>}
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setPreviewFile(selectedPreviewFile || submittedFile)}>
                              Xem
                            </Button>
                            {(answerFile || (submission?.resource_url && !deadline.expired)) && (
                              <Button type="button" variant="ghost" size="icon" onClick={handleRemoveFile} className="text-destructive">
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : null}

                      {submitError && <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm font-bold text-destructive">{submitError}</div>}
                      {submitMessage && <div className="rounded-xl border border-success/20 bg-success/10 p-3 text-sm font-bold text-success">{submitMessage}</div>}
                    </div>
                    <div className="hidden border-t border-border bg-muted px-5 py-4 sm:block">
                      <Button type="submit" disabled={submitActionDisabled} className="h-12 w-full">
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
            <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="bg-primary p-5 text-primary-foreground">
                <p className="text-xs font-bold text-primary-foreground/80">Điểm của bạn</p>
                <p className="mt-2 text-4xl font-black">{grade === null ? '--' : grade.toFixed(1)}<span className="ml-1 text-lg text-primary-foreground/80">/ {maxGrade}</span></p>
                {grade !== null && (
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary-foreground/20">
                    <div className="h-full rounded-full bg-primary-foreground transition-all duration-700" style={{ width: `${gradePercent}%` }} />
                  </div>
                )}
                <p className="mt-2 text-xs text-primary-foreground/80">{grade === null ? 'Chưa có điểm' : `Hoàn thành ${gradePercent.toFixed(0)}% mục tiêu`}</p>
              </div>
              <div className="divide-y divide-border px-5">
                <SidebarRow label="Trạng thái" value={<span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${resultStatus.className}`}>{resultStatus.label}</span>} />
                <SidebarRow label="Hạn chót" value={exam.due_date ? formatDateTime(exam.due_date) : 'Không có'} />
                {submission?.submitted_at && <SidebarRow label="Ngày nộp" value={formatDateTime(submission.submitted_at)} />}
                {submission?.returned_at && <SidebarRow label="Trả bài lúc" value={formatDateTime(submission.returned_at)} />}
              </div>
            </section>

            <CompactProgress submission={submission} isGraded={grade !== null} hasFeedback={hasFeedback} />

            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquareText size={16} className="text-primary" />
                <h2 className="text-sm font-black text-foreground">Nhận xét của giáo viên</h2>
              </div>
              {hasFeedback ? (
                <div className="rounded-xl bg-muted p-3.5">
                  <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-foreground">{submission?.feedback}</p>
                  {submission?.graded_at && <p className="mt-3 text-xs font-medium text-muted-foreground">Đã chấm lúc {formatDateTime(submission.graded_at)}</p>}
                </div>
              ) : (
                <div className="flex items-start gap-2.5 rounded-xl bg-muted p-3 text-xs font-medium leading-5 text-muted-foreground">
                  <Clock3 size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <span>{grade !== null ? 'Giáo viên chưa để lại nhận xét.' : submission ? 'Đang chờ giáo viên chấm bài.' : 'Nộp bài để xem nhận xét.'}</span>
                </div>
              )}
            </section>
          </aside>
        </main>

        {exam.exam_type === 'assignment' && (
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] sm:hidden">
            <Button form="exam-submission-form" type="submit" disabled={submitActionDisabled} className="h-12 w-full">
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
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="text-right font-bold text-foreground">{value}</span>
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
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-black text-foreground">Tiến độ bài thi</h2>
      <div className="flex items-start">
        {steps.map((step, index) => (
          <div key={step.label} className="relative flex min-w-0 flex-1 flex-col items-center text-center">
            {index < steps.length - 1 && (
              <span className={`absolute left-1/2 top-3 h-0.5 w-full ${steps[index + 1].done ? 'bg-success/40' : 'bg-border'}`} />
            )}
            <span className={`relative z-[1] flex h-6 w-6 items-center justify-center rounded-full ${
              step.done ? 'bg-success/10 text-success' : step.current ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {step.done ? <CheckCircle2 size={14} /> : <span className="h-2 w-2 rounded-full bg-current" />}
            </span>
            <div className="relative z-[1] mt-2 bg-card px-1">
              <p className={`text-[10px] font-bold ${step.done || step.current ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExamResultSkeleton() {
  return (
    <div className="min-h-screen animate-pulse bg-muted">
      <div className="h-16 border-b border-border bg-card" />
      <div className="mx-auto grid max-w-7xl gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <div className="h-80 rounded-2xl border border-border bg-card p-5">
            <div className="h-full rounded-xl bg-muted" />
          </div>
          <div className="h-32 rounded-2xl bg-card p-5">
            <div className="h-full rounded-xl bg-muted" />
          </div>
        </div>
        <div className="h-72 rounded-2xl bg-card p-5">
          <div className="h-full rounded-xl bg-muted" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-2 sm:p-4">
      <div className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4">
          <div className="min-w-0">
            <div className="truncate text-sm font-black text-foreground">{file.name}</div>
            <div className="text-[10px] font-black uppercase text-muted-foreground">Xem trước file</div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X size={18} />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-muted">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.url} alt={file.name} className="mx-auto block max-w-full" />
          ) : isPdf ? (
            <iframe src={file.url} title={file.name} className="h-full min-h-[70vh] w-full border-none" />
          ) : (
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
              <FileDown size={48} className="mb-4" />
              <p className="mb-4 text-sm font-bold">Không thể xem trước định dạng này</p>
              <Button asChild className="font-bold">
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
  if (!submission) return { label: 'Chưa nộp', className: 'bg-muted text-muted-foreground border-border' };
  if (submission.status === 'graded') return { label: 'Đã chấm', className: 'bg-success/10 text-success border-success/20' };
  if (submission.status === 'submitted') return { label: 'Đã nộp', className: 'bg-primary/10 text-primary border-primary/20' };
  return { label: 'Đang xử lý', className: 'bg-warning/10 text-warning border-warning/20' };
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
