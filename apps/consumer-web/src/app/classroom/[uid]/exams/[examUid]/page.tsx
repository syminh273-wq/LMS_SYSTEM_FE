'use client';

import { use, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  File,
  FileDown,
  FileText,
  Trash2,
  X,
  Image as ImageIcon,
  Info,
  Loader2,
  UploadCloud,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { classroomApi } from '@/lib/api';
import type { Classroom, Exam, ExamContentType, ExamSubmission } from '@/lib/api/types';
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
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
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
          const currentSubmission = await classroomApi.examSubmission(uid, examUid);
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

  useEffect(() => {
    if (!answerFile) {
      setSelectedFileUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(answerFile);
    setSelectedFileUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [answerFile]);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-indigo-600" />
        <p className="text-sm font-medium text-slate-500">Đang tải bài kiểm tra...</p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <Info size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Lỗi tải dữ liệu</h2>
          <p className="text-sm text-slate-500">{error || 'Không tìm thấy bài kiểm tra'}</p>
          <Button onClick={() => router.push(`/classroom/${uid}`)} className="w-full bg-indigo-600">
            Quay lại lớp học
          </Button>
        </div>
      </div>
    );
  }

  const ContentIcon = getContentTypeIcon(exam.content_type);
  const deadline = getDeadlineMeta(exam.due_date, now);
  const submissionDisabled = deadline.expired || submitting;
  const submittedFile = submission?.resource_url
    ? {
        url: submission.resource_url,
        name: submission.resource_name || 'File đã nộp',
        type: submission.content_type || 'file',
      }
    : null;
  const selectedPreviewFile = answerFile && selectedFileUrl
    ? {
        url: selectedFileUrl,
        name: answerFile.name,
        type: getSubmissionContentType(answerFile),
      }
    : null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (deadline.expired || submitting) return;

    if (!answerFile && !submission?.resource_url) {
      setSubmitError('Vui lòng upload file bài làm.');
      setSubmitMessage('');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');
      setSubmitMessage('');
      const selectedFile = answerFile;
      const contentType = selectedFile ? getSubmissionContentType(selectedFile) : submission?.content_type || 'file';
      const savedSubmission = selectedFile
        ? await submitExamFile(uid, examUid, selectedFile, contentType)
        : await classroomApi.submitExam(uid, examUid, {
            content_type: contentType,
            content: '',
            resource_uid: submission?.resource_uid || null,
          });
      setSubmission(savedSubmission);
      setAnswerFile(null);
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
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (!submission?.resource_url || deadline.expired || submitting) return;

    try {
      setSubmitting(true);
      setSubmitError('');
      setSubmitMessage('');
      const savedSubmission = await classroomApi.submitExam(uid, examUid, {
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/classroom/${uid}`)}
            className="shrink-0 rounded-full hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="mx-1 hidden h-8 w-[1px] bg-slate-200 sm:block" />
          <div className="min-w-0">
            <p className="truncate text-[10px] font-black uppercase tracking-widest text-indigo-500">
              {classroom?.name || 'Lớp học'}
            </p>
            <h1 className="truncate text-lg font-bold text-slate-900">{exam.title}</h1>
          </div>
        </div>

      </header>

      <main className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="inline-flex items-center rounded bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                Bài kiểm tra
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${getExamStatusClass(exam.status)}`}>
                {exam.status}
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">{exam.title}</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500">
              {exam.description || 'Không có mô tả'}
            </p>
          </div>

          <div className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <ContentIcon size={17} className="text-indigo-600" />
              <span className="text-sm font-black uppercase tracking-tighter text-slate-900">Nội dung</span>
            </div>
            <ExamContent exam={exam} />
          </div>
        </div>

        <aside className="h-fit overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-24">
          <form onSubmit={handleSubmit}>
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-black tracking-tight text-slate-900">Bài làm của bạn</h3>
                  <span className={`mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-black uppercase leading-none ${deadline.badgeClassName}`}>
                    <Calendar size={11} />
                    <span className="truncate">{deadline.label}</span>
                  </span>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-[10px] font-black uppercase text-slate-400">Due date</div>
                  <div className="mt-1 max-w-32 text-xs font-black leading-snug text-slate-800">
                    {formatDateTime(exam.due_date)}
                  </div>
                </div>
              </div>

              {deadline.expired && (
                <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-600">
                  Đã hết hạn nộp bài
                </div>
              )}
            </div>

            <div className="space-y-5 p-6">
              <div className="space-y-2">
                <span className="px-1 text-sm font-bold text-slate-700">File bài làm</span>
                <label className={`flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-5 text-center transition-all ${
                  submissionDisabled
                    ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50/40'
                }`}>
                  <UploadCloud size={28} className={submissionDisabled ? 'mb-2 text-slate-300' : 'mb-2 text-indigo-500'} />
                  <span className="text-sm font-black text-slate-700">
                    {answerFile?.name || submission?.resource_name || 'Chọn file bài làm'}
                  </span>
                  <span className="mt-1 text-xs font-medium text-slate-400">
                    {submissionDisabled ? 'Upload đã bị khóa' : submission?.resource_url ? 'Bấm để upload file mới' : 'Bấm để upload file'}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    disabled={submissionDisabled}
                    onChange={event => setAnswerFile(event.target.files?.[0] || null)}
                    className="sr-only"
                  />
                </label>
                {(selectedPreviewFile || submittedFile) && (
                  <button
                    type="button"
                    onClick={() => setPreviewFile(selectedPreviewFile || submittedFile)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/40"
                  >
                    <FileText size={18} className="shrink-0 text-indigo-500" />
                    <span className="min-w-0 flex-1 truncate text-xs font-black text-slate-700">
                      {(selectedPreviewFile || submittedFile)?.name}
                    </span>
                    <span className="text-[10px] font-black uppercase text-indigo-500">Preview</span>
                  </button>
                )}
                {(answerFile || (submission?.resource_url && !deadline.expired)) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveFile}
                    disabled={submitting}
                    className="h-9 w-full gap-2 rounded-xl border-rose-100 text-xs font-black uppercase text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={14} />
                    Xóa file
                  </Button>
                )}
              </div>

              {submitError && (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-600">
                  {submitError}
                </div>
              )}

              {submitMessage && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-600">
                  {submitMessage}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="submit"
                disabled={submissionDisabled}
                className="h-11 w-full rounded-xl bg-indigo-600 px-6 text-xs font-black uppercase tracking-widest hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting && <Loader2 size={16} className="mr-2 animate-spin" />}
                {submission ? 'Cập nhật bài nộp' : 'Nộp bài'}
              </Button>
            </div>
          </form>
        </aside>
      </main>

      {previewFile && (
        <FilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
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

function ExamContent({ exam }: { exam: Exam }) {
  const resourceUrl = exam.resource_url || (exam.content_type !== 'markdown' ? exam.content : '');

  if (exam.content_type === 'markdown') {
    return (
      <div className="min-h-40 whitespace-pre-wrap rounded-2xl border border-slate-100 bg-slate-50 p-5 text-sm font-medium leading-relaxed text-slate-700">
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
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
        <a href={resourceUrl} target="_blank" rel="noopener noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resourceUrl} alt={exam.resource_name || exam.title} className="max-h-[640px] w-full object-contain" />
        </a>
        <div className="border-t border-slate-100 bg-white p-3">
          <DownloadButton url={resourceUrl} label={exam.resource_name || 'Tải file'} />
        </div>
      </div>
    );
  }

  if (exam.content_type === 'pdf') {
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

async function submitExamFile(classroomUid: string, examUid: string, file: File, contentType: ExamContentType) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('content_type', contentType);
  formData.append('content', '');
  formData.append('metadata', JSON.stringify({ context: 'exam_submission', exam_uid: examUid }));

  return classroomApi.submitExam(classroomUid, examUid, formData);
}

function getSubmissionContentType(file: File): ExamContentType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf') return 'pdf';
  return 'file';
}

function getExamStatusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'published' || normalized === 'active' || normalized === 'open') {
    return 'border border-emerald-100 bg-emerald-50 text-emerald-600';
  }
  if (normalized === 'draft') {
    return 'border border-amber-100 bg-amber-50 text-amber-600';
  }
  if (normalized === 'closed' || normalized === 'expired') {
    return 'border border-rose-100 bg-rose-50 text-rose-600';
  }
  return 'border border-slate-200 bg-slate-100 text-slate-600';
}

function getContentTypeIcon(contentType: string) {
  if (contentType === 'image') return ImageIcon;
  if (contentType === 'pdf') return FileDown;
  if (contentType === 'file') return File;
  return FileText;
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
