import type { Exam } from '@/lib/api';

export type ExamKind = 'midterm' | 'final' | 'regular';

export const EXAM_KIND_KEYWORDS: Record<ExamKind, string[]> = {
  midterm: ['kiem tra giua ki', 'kiểm tra giữa kì', 'kiểm tra giữa kỳ', 'giua ki', 'giữa kì', 'giữa kỳ'],
  final: ['kiem tra cuoi ki', 'kiểm tra cuối kì', 'kiểm tra cuối kỳ', 'cuoi ki', 'cuối kì', 'cuối kỳ'],
  regular: ['kiem tra thuong xuyen', 'kiểm tra thường xuyên', 'thuong xuyen', 'thường xuyên'],
};

export function getSubmissionStatusClass(status: string) {
  if (status === 'graded') return 'bg-emerald-50 text-emerald-600';
  if (status === 'submitted') return 'bg-primary-brand-light text-primary-brand';
  if (status === 'late') return 'bg-amber-50 text-amber-600';
  return 'bg-muted text-muted-foreground';
}

export function getSubmissionStatusLabel(status: string, t: (key: string) => string) {
  if (status.toLowerCase() === 'graded') return t('classroom.ui.score_status_graded');
  return t('classroom.ui.score_status_submitted');
}

export function getExamStatusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === 'active' || normalized === 'published' || normalized === 'open') {
    return 'bg-emerald-50 text-emerald-600';
  }
  if (normalized === 'draft') {
    return 'bg-amber-50 text-amber-600';
  }
  if (normalized === 'closed' || normalized === 'expired') {
    return 'bg-rose-50 text-rose-600';
  }
  return 'bg-muted text-muted-foreground';
}

export function getExamStatusLabel(status: string, t: (key: string) => string) {
  const normalized = status.toLowerCase();
  if (normalized === 'active' || normalized === 'published' || normalized === 'open') return t('classroom.ui.exam_status_open');
  if (normalized === 'draft') return t('classroom.ui.draft_label');
  if (normalized === 'closed' || normalized === 'expired') return t('classroom.ui.exam_status_closed');
  return status;
}

export function isExamInKind(exam: Exam, kind: ExamKind) {
  const title = normalizeText(exam.title);
  return EXAM_KIND_KEYWORDS[kind].some(keyword => title.includes(normalizeText(keyword)));
}

export function isExamKind(value: string | null): value is ExamKind {
  return value === 'midterm' || value === 'final' || value === 'regular';
}

export function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getCanManageExams() {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem('userProfile');
    if (!raw) return true;
    const profile = JSON.parse(raw) as { role?: string; user_type?: string; is_admin?: boolean; is_staff?: boolean };
    const role = (profile.role || profile.user_type || '').toLowerCase();
    return profile.is_admin === true || profile.is_staff === true || role === 'admin' || role === 'teacher' || role === 'space' || !role;
  } catch {
    return true;
  }
}
