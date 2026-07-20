import type { Exam, ExamSubmission, ExamStatus, ExamContentType } from '../types';

export function getExamStatusColor(status: ExamStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-50 text-gray-600 border-gray-100';
    case 'published':
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'ongoing':
      return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'closed':
      return 'bg-red-50 text-red-600 border-red-100';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-100';
  }
}

export function getExamStatusText(status: ExamStatus, t: (key: string) => string): string {
  switch (status) {
    case 'draft':
      return t('exam.status.draft');
    case 'published':
      return t('exam.status.published');
    case 'ongoing':
      return t('exam.status.ongoing');
    case 'closed':
      return t('exam.status.closed');
    default:
      return status;
  }
}

export function getContentTypeIcon(contentType: ExamContentType): string {
  switch (contentType) {
    case 'markdown':
      return 'FileText';
    case 'file':
      return 'File';
    case 'pdf':
      return 'FileType';
    case 'image':
      return 'Image';
    case 'quiz':
      return 'HelpCircle';
    default:
      return 'File';
  }
}


export function isExamOverdue(exam: Exam): boolean {
  if (!exam.due_date) return false;
  return new Date(exam.due_date) < new Date();
}

export function getSubmissionStatusColor(status: string): string {
  switch (status) {
    case 'submitted':
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'graded':
      return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'returned':
      return 'bg-purple-50 text-purple-600 border-purple-100';
    case 'late':
      return 'bg-amber-50 text-amber-600 border-amber-100';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-100';
  }
}

export function calculateScorePercent(submission: ExamSubmission): number | null {
  if (!submission.grade || !submission.max_grade) return null;
  return Math.round((submission.grade / submission.max_grade) * 100);
}

export function isPassing(submission: ExamSubmission, passingScore: number = 50): boolean {
  const percent = calculateScorePercent(submission);
  return percent !== null && percent >= passingScore;
}


export function sortExamsByDueDate(exams: Exam[], order: 'asc' | 'desc' = 'asc'): Exam[] {
  return [...exams].sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    const dateA = new Date(a.due_date).getTime();
    const dateB = new Date(b.due_date).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function filterExamsByStatus(exams: Exam[], status: ExamStatus | 'all'): Exam[] {
  if (status === 'all') return exams;
  return exams.filter((exam) => exam.status === status);
}
