import { useState } from 'react';
import { spaceApi, Exam } from '@/lib/api';
import { toast } from 'sonner';

export interface UseCloseExamOnlineArgs {
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

export interface UseCloseExamOnlineResult {
  closeExamOnline: (exam: Exam) => Promise<boolean>;
  closing: boolean;
}

export function useCloseExamOnline({ t }: UseCloseExamOnlineArgs): UseCloseExamOnlineResult {
  const [closing, setClosing] = useState(false);

  const closeExamOnline = async (exam: Exam): Promise<boolean> => {
    setClosing(true);
    try {
      await spaceApi.exams.closeOnline(exam.uid);
      toast.success(t('classroom.ui.exams_close_success'));
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.exams_close_error'));
      return false;
    } finally {
      setClosing(false);
    }
  };

  return {
    closeExamOnline,
    closing,
  };
}

export default useCloseExamOnline;
