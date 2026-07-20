import type { Quiz, QuizStatus, QuizQuestion, QuizAttemptRecord } from '../types';

export function getQuizStatusColor(status: QuizStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-50 text-gray-600 border-gray-100';
    case 'published':
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'archived':
      return 'bg-amber-50 text-amber-600 border-amber-100';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-100';
  }
}

export function getQuizStatusText(status: QuizStatus, t: (key: string) => string): string {
  switch (status) {
    case 'draft':
      return t('quiz.status.draft');
    case 'published':
      return t('quiz.status.published');
    case 'archived':
      return t('quiz.status.archived');
    default:
      return status;
  }
}

export function getCorrectAnswerLetter(question: QuizQuestion): string {
  return question.correct_answer.toUpperCase();
}

export function getOptionText(question: QuizQuestion, option: 'a' | 'b' | 'c' | 'd'): string {
  return question[`option_${option}`];
}

export function calculateQuizScore(
  questions: QuizQuestion[],
  answers: Record<string, string>
): { correct: number; total: number; percent: number } {
  let correct = 0;
  const total = questions.length;

  questions.forEach((question) => {
    const userAnswer = answers[question.uid];
    if (userAnswer && userAnswer.toLowerCase() === question.correct_answer) {
      correct++;
    }
  });

  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

  return { correct, total, percent };
}

export function isQuizPassing(scorePercent: number, passingScore: number = 50): boolean {
  return scorePercent >= passingScore;
}

export function formatAttemptTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export function sortAttemptsByDate(attempts: QuizAttemptRecord[], order: 'asc' | 'desc' = 'desc'): QuizAttemptRecord[] {
  return [...attempts].sort((a, b) => {
    const dateA = new Date(a.submitted_at).getTime();
    const dateB = new Date(b.submitted_at).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function getBestAttempt(attempts: QuizAttemptRecord[]): QuizAttemptRecord | null {
  if (attempts.length === 0) return null;
  return attempts.reduce((best, attempt) => (attempt.score > best.score ? attempt : best));
}

export function getLatestAttempt(attempts: QuizAttemptRecord[]): QuizAttemptRecord | null {
  if (attempts.length === 0) return null;
  return sortAttemptsByDate(attempts, 'desc')[0];
}

export function filterQuizzesByStatus(quizzes: Quiz[], status: QuizStatus | 'all'): Quiz[] {
  if (status === 'all') return quizzes;
  return quizzes.filter((quiz) => quiz.status === status);
}

export function sortQuizzesByDate(quizzes: Quiz[], order: 'asc' | 'desc' = 'desc'): Quiz[] {
  return [...quizzes].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}
