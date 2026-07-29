import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { spaceApi, Exam } from '@/lib/api';
import { toast } from 'sonner';

function getCanManageExams() {
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

export interface UseClassroomExamsArgs {
  uid: string;
  canManageExams: boolean;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

export interface UseClassroomExamsResult {
  exams: Exam[];
  setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
  loadingExams: boolean;
  fetchExams: () => Promise<void>;
}

export function useClassroomExams({
  uid,
  t,
}: UseClassroomExamsArgs): UseClassroomExamsResult {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);

  const fetchExams = useCallback(async () => {
    setLoadingExams(true);
    try {
      const data = await spaceApi.exams.listByClassroom(uid);
      setExams(getCanManageExams() ? data : data.filter(exam => exam.status === 'published'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.exams_load_error'));
    } finally {
      setLoadingExams(false);
    }
  }, [uid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Mounting the tab initiates its request.
    void fetchExams();
  }, [fetchExams]);

  return {
    exams,
    setExams,
    loadingExams,
    fetchExams,
  };
}

export default useClassroomExams;
