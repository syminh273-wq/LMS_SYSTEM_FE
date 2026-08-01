import { useState } from 'react';
import { spaceApi, Exam } from '@/lib/api';
import { toast } from 'sonner';

export interface UseDeleteExamArgs {
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

export interface UseDeleteExamResult {
  deleteExam: (exam: Exam) => Promise<boolean>;
  deletingExamUid: string | null;
}

export function useDeleteExam({ t }: UseDeleteExamArgs): UseDeleteExamResult {
  const [deletingExamUid, setDeletingExamUid] = useState<string | null>(null);

  const deleteExam = async (exam: Exam): Promise<boolean> => {
    if (deletingExamUid) return false;
    const confirmed = window.confirm(t('classroom.ui.exams_delete_confirm', undefined, { title: exam.title }));
    if (!confirmed) return false;

    setDeletingExamUid(exam.uid);
    try {
      await spaceApi.exams.deleteExam(exam.uid);
      toast.success(t('classroom.ui.exams_deleted'));
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.exams_delete_error'));
      return false;
    } finally {
      setDeletingExamUid(null);
    }
  };

  return {
    deleteExam,
    deletingExamUid,
  };
}

export default useDeleteExam;
