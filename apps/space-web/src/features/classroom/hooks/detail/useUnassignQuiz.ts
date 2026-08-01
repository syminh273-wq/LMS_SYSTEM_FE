import { useState } from 'react';
import { quizApi } from '@/lib/api/quiz';
import type { Quiz } from '@/lib/api/types';
import { toast } from 'sonner';

export interface UseUnassignQuizArgs {
  uid: string;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

export interface UseUnassignQuizResult {
  unassignQuiz: (quiz: Quiz) => Promise<boolean>;
  unassigningUid: string | null;
}

export function useUnassignQuiz({ uid, t }: UseUnassignQuizArgs): UseUnassignQuizResult {
  const [unassigningUid, setUnassigningUid] = useState<string | null>(null);

  const unassignQuiz = async (quiz: Quiz): Promise<boolean> => {
    if (!window.confirm(t('classroom.ui.quiz_unassign_confirm', undefined, { title: quiz.title }))) return false;
    setUnassigningUid(quiz.uid);
    try {
      await quizApi.unassignFromClassroom(quiz.uid, uid);
      toast.success(t('classroom.ui.quiz_unassign_success'));
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.quiz_unassign_error'));
      return false;
    } finally {
      setUnassigningUid(null);
    }
  };

  return {
    unassignQuiz,
    unassigningUid,
  };
}

export default useUnassignQuiz;
