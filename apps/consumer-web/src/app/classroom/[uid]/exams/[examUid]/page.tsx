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
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { classroomApi, Classroom, Exam, ExamContentType, ExamSubmission } from '@/lib/api';
import { useRequireAuth } from '@/lib/hooks/use-require-auth';

export default function ConsumerExamDetailPage({ params }: { params: Promise<{ uid: string; examUid: string }> }) {
  const { uid, examUid } = use(params);
  const router = useRouter();
  const { isAuthenticated, mounted } = useRequireAuth();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [submission, setSubmission] = useState<ExamSubmission | null>(null);
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
          <h2 className="text-xl font-bold text-slate-900">Không thể tải kết quả</h2>
          <p className="text-sm text-slate-500">{error || 'Không tìm thấy bài kiểm tra'}</p>
          <Button onClick={() => router.push(`/classroom/${uid}`)} className="w-full bg-indigo-600">
            Quay lại lớp học
          </Button>
        </div>
      </div>
    );
  }

  const deadline = getDeadlineMeta(exam.due_date, now);
  const submissionDisabled = deadline.expired || submitting;
  const submitActionDisabled = submissionDisabled || !answerFile;
  const submittedFile = submission?.resource_url
    ? {
        url: submission.resource_url,
        name: submission.resource_name || 'File đã nộp',
        type: submission.content_type || 'file',
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
    if (deadline.expired || submitting || !answerFile) return;

    if (!answerFile) {
      setSubmitError('Vui lòng upload file bài làm.');
      setSubmitMessage('');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');
      setSubmitMessage('');
      const selectedFile = answerFile;
      const uploadedResource = selectedFile
        ? await saveSubmissionResource(selectedFile, examUid, submission?.resource_uid || null)
        : null;
      const contentType = selectedFile ? getSubmissionContentType(selectedFile) : submission?.content_type || 'file';
      const savedSubmission = await classroomApi.submitExam(examUid, {
        content_type: contentType,
        content: '',
        resource_uid: uploadedResource?.uid || submission?.resource_uid || null,
      });
      setSubmission(savedSubmission);
      setAnswerFile(null);
      setSelectedPreviewFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSubmitMessage(submission ? 'Đã cập nhật bài nộp.' : 'Đã nộp bài thành công.');
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

    if (!submission?.resource_url || deadline.expired || submitting) return;

    try {
      setSubmitting(true);
      setSubmitError('');
      setSubmitMessage('');
      const savedSubmission = await classroomApi.submitExam(examUid, {
        content_type: 'markdown',
        content: '',
        resource_uid: null,
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
  const gradePercent = grade === null ? 0 : Math.min(100, Math.max(0, grade * 10));
  const hasFeedback = Boolean(submission?.feedback?.trim());
  const assignmentResource = exam.resource_url || (exam.content_type !== 'markdown' ? exam.content : '');

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900 lg:pb-0">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/classroom/${uid}`)}
              className="shrink-0 rounded-xl hover:bg-slate-100"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">
                {classroom?.name || 'Lớp học'}
              </p>
              <h1 className="truncate text-base font-black text-slate-900 sm:text-lg">{exam.title}</h1>
            </div>
          </div>
          <div className="ml-12 flex flex-wrap items-center gap-2 text-xs font-bold sm:ml-auto">
            <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${resultStatus.className}`}>{resultStatus.label}</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-slate-500">
              <Calendar size={13} /> {formatDateTime(exam.due_date)}
            </span>
            <span className="rounded-lg bg-slate-50 px-3 py-2 text-slate-500">Tối đa: <strong className="text-slate-800">10</strong></span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl items-start gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 text-slate-800">
              <ContentTypeIcon contentType={exam.content_type} />
              <h2 className="text-base font-black">Nội dung đề bài</h2>
            </div>
            <div className="p-4 sm:p-5">
              {exam.description && (
                <p className="mb-4 text-sm font-medium leading-6 text-slate-600">{exam.description}</p>
              )}
              <ExamContent
                exam={exam}
                compact
                onPreview={assignmentResource ? () => setPreviewFile({
                  url: assignmentResource,
                  name: exam.resource_name || exam.title,
                  type: exam.content_type,
                }) : undefined}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm shadow-indigo-100/40">
            <form id="exam-submission-form" onSubmit={handleSubmit}>
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-lg font-black">Bài nộp</h2>
                  <p className="text-xs font-medium text-slate-500">Upload và gửi bài làm của bạn</p>
                </div>
                {submission && (
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${isLate ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {isLate ? 'Trễ hạn' : 'Đúng hạn'}
                  </span>
                )}
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
                  <span className="text-sm font-black text-slate-800">{answerFile?.name || (submission?.resource_url ? 'Kéo thả file mới để cập nhật bài làm' : 'Kéo thả file bài làm vào đây')}</span>
                  <span className="mt-1 text-xs font-medium text-slate-500">{submissionDisabled ? 'Đã đóng nhận bài' : 'hoặc bấm để chọn file từ thiết bị'}</span>
                  <input ref={fileInputRef} type="file" disabled={submissionDisabled} onChange={event => handleSelectFile(event.target.files?.[0] || null)} className="sr-only" />
                </label>

                {(selectedPreviewFile || submittedFile) ? (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      {selectedPreviewFile ? 'File sắp nộp' : 'File đã nộp'}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-600">
                        <FileText size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-700">{(selectedPreviewFile || submittedFile)?.name}</p>
                        {submission?.submitted_at && !selectedPreviewFile && <p className="text-xs text-slate-500">Nộp lúc {formatDateTime(submission.submitted_at)}</p>}
                      </div>
                      <button type="button" onClick={() => setPreviewFile(selectedPreviewFile || submittedFile)} className="rounded-lg px-2 py-1 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50">
                        Xem
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-xl bg-slate-50 p-3 text-center text-xs font-medium text-slate-500">Chưa có file được upload.</p>
                )}

                {(answerFile || (submission?.resource_url && !deadline.expired)) && (
                  <Button type="button" variant="ghost" onClick={handleRemoveFile} disabled={submitting} className="h-9 gap-2 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                    <Trash2 size={14} /> Xóa file
                  </Button>
                )}
                {submitError && <div className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-sm font-bold text-rose-600">{submitError}</div>}
                {submitMessage && <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{submitMessage}</div>}
              </div>
              <div className="hidden border-t border-slate-100 bg-slate-50 px-5 py-4 sm:block">
                <Button type="submit" disabled={submitActionDisabled} className="h-12 w-full rounded-xl bg-indigo-600 font-bold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 disabled:bg-slate-300 disabled:shadow-none">
                  {submitting && <Loader2 size={16} className="mr-2 animate-spin" />}
                  {submission ? 'Cập nhật bài nộp' : 'Nộp bài'}
                </Button>
              </div>
            </form>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-5">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-indigo-600 p-5 text-white">
              <p className="text-xs font-bold text-indigo-100">Điểm số</p>
              <p className="mt-2 text-4xl font-black">{grade === null ? '--' : grade.toFixed(1)}<span className="ml-1 text-lg text-indigo-200">/ 10</span></p>
              {grade !== null && (
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-indigo-400/40">
                  <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${gradePercent}%` }} />
                </div>
              )}
              <p className="mt-2 text-xs text-indigo-100">{grade === null ? 'Chưa có điểm' : `${gradePercent.toFixed(0)}% tổng điểm`}</p>
            </div>
            <div className="divide-y divide-slate-100 px-5">
              <SidebarRow label="Trạng thái" value={<span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${resultStatus.className}`}>{resultStatus.label}</span>} />
              <SidebarRow label="Hạn nộp" value={formatDateTime(exam.due_date)} />
              {submission?.submitted_at && <SidebarRow label="Đã nộp lúc" value={formatDateTime(submission.submitted_at)} />}
            </div>
          </section>

          <CompactProgress submission={submission} />

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <MessageSquareText size={16} className="text-indigo-500" />
              <h2 className="text-sm font-black">Feedback giáo viên</h2>
            </div>
            {hasFeedback ? (
              <div className="rounded-xl bg-slate-50 p-3.5">
                <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">{submission?.feedback}</p>
                {submission?.graded_at && <p className="mt-3 text-xs font-medium text-slate-400">Phản hồi lúc {formatDateTime(submission.graded_at)}</p>}
              </div>
            ) : (
              <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 text-xs font-medium leading-5 text-slate-500">
                <Clock3 size={15} className="mt-0.5 shrink-0 text-slate-400" />
                <span>{grade !== null ? 'Chưa có nhận xét bằng văn bản.' : submission ? 'Feedback sẽ hiển thị sau khi bài được chấm.' : 'Nộp bài để nhận feedback.'}</span>
              </div>
            )}
          </section>
        </aside>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] sm:hidden">
        <Button form="exam-submission-form" type="submit" disabled={submitActionDisabled} className="h-12 w-full rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700 disabled:bg-slate-300">
          {submitting && <Loader2 size={16} className="mr-2 animate-spin" />}
          {submission ? 'Cập nhật bài nộp' : 'Nộp bài'}
        </Button>
      </div>

      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
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

function CompactProgress({ submission }: { submission: ExamSubmission | null }) {
  const isGraded = typeof submission?.grade === 'number' || Boolean(submission?.graded_at);
  const hasFeedback = Boolean(submission?.feedback?.trim());
  const steps = [
    { label: 'Đề bài', done: true, current: !submission },
    { label: 'Đã nộp', done: Boolean(submission), current: Boolean(submission) && !isGraded },
    { label: 'Đã chấm', done: isGraded, current: isGraded && !hasFeedback },
    { label: 'Feedback', done: hasFeedback, current: false },
  ] as const;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-black text-slate-900">Tiến độ</h2>
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
            <div className="text-[10px] font-black uppercase text-slate-400">Preview</div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} className="shrink-0 rounded-full">
            <X size={18} />
          </Button>
        </div>

        <div className="min-h-[50vh] flex-1 overflow-auto bg-slate-50">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.url} alt={file.name} className="mx-auto max-h-[78vh] w-full object-contain" />
          ) : isPdf ? (
            <iframe title={file.name} src={file.url} className="h-[78vh] w-full bg-white" />
          ) : (
            <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
              <File size={36} className="mb-3 text-slate-300" />
              <p className="max-w-md text-sm font-bold text-slate-600">
                Trình duyệt không hỗ trợ preview trực tiếp cho loại file này.
              </p>
              <a href={file.url} target="_blank" rel="noopener noreferrer" className="mt-4">
                <Button variant="outline" className="gap-2 rounded-xl text-xs font-black uppercase">
                  <FileDown size={15} />
                  Mở file
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExamContent({ exam, compact = false, onPreview }: { exam: Exam; compact?: boolean; onPreview?: () => void }) {
  const resourceUrl = exam.resource_url || (exam.content_type !== 'markdown' ? exam.content : '');

  if (exam.content_type === 'markdown') {
    return (
      <div className={`${compact ? 'max-h-72 overflow-y-auto' : 'min-h-40'} whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm font-medium leading-relaxed text-slate-700`}>
        {exam.content || 'Chưa có nội dung.'}
      </div>
    );
  }

  if (!resourceUrl) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-slate-400">
        <File size={28} className="mb-2 opacity-40" />
        <p className="text-sm font-medium">Chưa có tài nguyên đính kèm.</p>
      </div>
    );
  }

  if (exam.content_type === 'image') {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
        <button type="button" onClick={onPreview} className="group relative block w-full text-left" aria-label="Xem toàn bộ hình ảnh đề bài">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resourceUrl} alt={exam.resource_name || exam.title} className={`${compact ? 'h-72 sm:h-[400px]' : 'max-h-[640px]'} w-full object-contain`} />
          {compact && (
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/60 to-transparent px-4 pb-3 pt-10 text-xs font-bold text-white opacity-100 transition group-hover:bg-slate-900/45">
              Xem toàn bộ hình ảnh
            </span>
          )}
        </button>
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-white p-3">
          <p className="min-w-0 truncate text-xs font-medium text-slate-500">{exam.resource_name || 'Hình ảnh đề bài'}</p>
          <DownloadButton url={resourceUrl} label={exam.resource_name || 'Tải file'} />
        </div>
      </div>
    );
  }

  if (exam.content_type === 'pdf') {
    if (compact) {
      return (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600"><FileDown size={19} /></span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-700">{exam.resource_name || 'Tài liệu PDF'}</p>
              <p className="text-xs font-medium text-slate-500">Nhấn để xem nội dung đầy đủ</p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={onPreview} className="shrink-0 rounded-lg text-xs font-bold">Xem</Button>
        </div>
      );
    }
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
        <iframe title={exam.title} src={resourceUrl} className="h-[640px] w-full" />
        <div className="border-t border-slate-100 bg-white p-3">
          <DownloadButton url={resourceUrl} label={exam.resource_name || 'Tải PDF'} />
        </div>
      </div>
    );
  }

  return <DownloadButton url={resourceUrl} label={exam.resource_name || 'Tải file'} />;
}

function DownloadButton({ url, label }: { url: string; label: string }) {
  return (
    <a href={url} download target="_blank" rel="noopener noreferrer" aria-label={`Download ${label}`}>
      <Button variant="outline" className="gap-2 rounded-xl text-xs font-bold">
        <FileDown size={15} />
        Download file
      </Button>
    </a>
  );
}

async function uploadSubmissionResource(file: File, examUid: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify({ context: 'exam_submission', exam_uid: examUid }));

  return classroomApi.uploadSubmissionResource(formData);
}

async function reuploadSubmissionResource(file: File, examUid: string, resourceUid: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify({ context: 'exam_submission', exam_uid: examUid }));

  return classroomApi.reuploadSubmissionResource(resourceUid, formData);
}

async function saveSubmissionResource(file: File, examUid: string, resourceUid: string | null) {
  if (resourceUid) {
    return reuploadSubmissionResource(file, examUid, resourceUid);
  }

  return uploadSubmissionResource(file, examUid);
}

function getSubmissionContentType(file: File): ExamContentType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf') return 'pdf';
  return 'file';
}

function getResultStatusMeta(submission: ExamSubmission | null) {
  if (!submission) {
    return {
      label: 'Chưa nộp',
      className: 'border-slate-200 bg-slate-100 text-slate-600',
    };
  }

  if (typeof submission.grade === 'number' || submission.graded_at) {
    return {
      label: 'Đã chấm',
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    };
  }

  if (['grading', 'reviewing', 'in_review', 'pending_review'].includes(submission.status.toLowerCase())) {
    return {
      label: 'Đang chấm',
      className: 'border-amber-100 bg-amber-50 text-amber-700',
    };
  }

  return {
    label: 'Đã nộp',
    className: 'border-indigo-100 bg-indigo-50 text-indigo-700',
  };
}

function isLateSubmission(submission: ExamSubmission, dueDate: string | null) {
  if (submission.status.toLowerCase() === 'late') return true;
  if (!submission.submitted_at || !dueDate) return false;

  const submittedAt = new Date(submission.submitted_at).getTime();
  const deadline = new Date(dueDate).getTime();
  return Number.isFinite(submittedAt) && Number.isFinite(deadline) && submittedAt > deadline;
}

function ContentTypeIcon({ contentType }: { contentType: ExamContentType }) {
  if (contentType === 'image') return <ImageIcon size={17} />;
  if (contentType === 'pdf') return <FileDown size={17} />;
  if (contentType === 'file') return <File size={17} />;
  return <FileText size={17} />;
}

function getDeadlineMeta(value: string | null, now: number) {
  if (!value) {
    return {
      expired: false,
      label: 'Chưa có hạn nộp',
      badgeClassName: 'border-emerald-100 bg-emerald-50 text-emerald-600',
    };
  }

  const due = new Date(value).getTime();
  if (Number.isNaN(due)) {
    return {
      expired: false,
      label: 'Hạn nộp không hợp lệ',
      badgeClassName: 'border-slate-200 bg-slate-100 text-slate-600',
    };
  }

  const msLeft = due - now;
  const hoursLeft = msLeft / (1000 * 60 * 60);

  if (msLeft <= 0) {
    return {
      expired: true,
      label: 'Đã hết hạn nộp bài',
      badgeClassName: 'border-rose-100 bg-rose-50 text-rose-600',
    };
  }

  if (hoursLeft <= 72) {
    return {
      expired: false,
      label: `Sắp hết hạn: còn ${formatTimeLeft(msLeft)}`,
      badgeClassName: 'border-amber-100 bg-amber-50 text-amber-600',
    };
  }

  return {
    expired: false,
    label: `Còn ${formatTimeLeft(msLeft)}`,
    badgeClassName: 'border-emerald-100 bg-emerald-50 text-emerald-600',
  };
}

function formatTimeLeft(msLeft: number) {
  const totalMinutes = Math.max(1, Math.ceil(msLeft / (1000 * 60)));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes - days * 60 * 24) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `${days} ngày ${hours} giờ` : `${days} ngày`;
  }

  if (hours > 0) {
    return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
  }

  return `${minutes} phút`;
}

function formatDateTime(value: string | null) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
}
