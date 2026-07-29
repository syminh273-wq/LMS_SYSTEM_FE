import { useState, useEffect, useCallback, type Dispatch, type SetStateAction } from 'react';
import { quizApi } from '@/lib/api/quiz';
import type { Quiz } from '@/lib/api/types';
import { toast } from 'sonner';

export interface UseAssignedQuizzesArgs {
  uid: string;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

export interface UseAssignedQuizzesResult {
  assignedQuizzes: Quiz[];
  setAssignedQuizzes: Dispatch<SetStateAction<Quiz[]>>;
  loadingQuizzes: boolean;
  fetchAssignedQuizzes: () => Promise<void>;
}

export function useAssignedQuizzes({ uid, t }: UseAssignedQuizzesArgs): UseAssignedQuizzesResult {
  const [assignedQuizzes, setAssignedQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  const fetchAssignedQuizzes = useCallback(async () => {
    setLoadingQuizzes(true);
    try {
      const data = await quizApi.list(uid);
      setAssignedQuizzes(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.quiz_load_error'));
    } finally {
      setLoadingQuizzes(false);
    }
  }, [uid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Mounting the tab initiates its request.
    void fetchAssignedQuizzes();
  }, [fetchAssignedQuizzes]);

  return {
    assignedQuizzes,
    setAssignedQuizzes,
    loadingQuizzes,
    fetchAssignedQuizzes,
  };
}

export default useAssignedQuizzes;
