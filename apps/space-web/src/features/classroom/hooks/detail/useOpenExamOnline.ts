import { useState } from 'react';
import { spaceApi, Exam } from '@/lib/api';
import { toast } from 'sonner';

export interface UseOpenExamOnlineArgs {
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

export interface OpenExamOnlineResult {
  exam: Exam;
  sessions: unknown[];
}

export interface UseOpenExamOnlineResult {
  openExamOnline: (exam: Exam) => Promise<OpenExamOnlineResult | null>;
  opening: boolean;
}

export function useOpenExamOnline({ t }: UseOpenExamOnlineArgs): UseOpenExamOnlineResult {
  const [opening, setOpening] = useState(false);

  const openExamOnline = async (exam: Exam): Promise<OpenExamOnlineResult | null> => {
    setOpening(true);
    try {
      const opened = await spaceApi.exams.openOnline(exam.uid, {
        late_threshold_seconds: 15 * 60,
        duration_seconds: (exam.duration_seconds || 45 * 60),
        camera_required: exam.camera_required ?? false,
        max_tab_leaves: exam.max_tab_leaves ?? 3,
        max_face_warnings: exam.max_face_warnings ?? 0,
      });
      toast.success(t('classroom.ui.exams_open_success', undefined, { count: opened.sessions.length }));
      return opened;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.exams_open_error'));
      return null;
    } finally {
      setOpening(false);
    }
  };

  return {
    openExamOnline,
    opening,
  };
}

export default useOpenExamOnline;
