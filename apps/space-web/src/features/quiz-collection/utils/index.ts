import type { QuizCollection, QuizCollectionDetail, QuizCollectionItem } from '../types';

export function getCollectionStatusColor(status: string): string {
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

export function getCollectionStatusText(status: string, t: (key: string) => string): string {
  switch (status) {
    case 'draft':
      return t('quizCollection.status.draft');
    case 'published':
      return t('quizCollection.status.published');
    case 'archived':
      return t('quizCollection.status.archived');
    default:
      return status;
  }
}

export function sortCollectionItems(items: QuizCollectionItem[]): QuizCollectionItem[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export function getCollectionProgress(
  collection: QuizCollectionDetail,
  completedQuizIds: string[]
): { completed: number; total: number; percent: number } {
  const total = collection.items.length;
  const completed = collection.items.filter((item) =>
    completedQuizIds.includes(item.quiz_id)
  ).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percent };
}

export function isCollectionCompleted(
  collection: QuizCollectionDetail,
  completedQuizIds: string[]
): boolean {
  const { completed, total } = getCollectionProgress(collection, completedQuizIds);
  return completed === total && total > 0;
}

export function getMissingQuizIds(
  collection: QuizCollectionDetail,
  completedQuizIds: string[]
): string[] {
  return collection.items
    .filter((item) => !completedQuizIds.includes(item.quiz_id))
    .map((item) => item.quiz_id);
}

export function sortCollectionsByDate(
  collections: QuizCollection[],
  order: 'asc' | 'desc' = 'desc'
): QuizCollection[] {
  return [...collections].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function filterCollectionsByStatus(
  collections: QuizCollection[],
  status: string | 'all'
): QuizCollection[] {
  if (status === 'all') return collections;
  return collections.filter((collection) => collection.status === status);
}
