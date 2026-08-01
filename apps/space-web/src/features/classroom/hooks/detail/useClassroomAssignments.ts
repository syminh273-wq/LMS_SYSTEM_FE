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

export interface UseClassroomAssignmentsArgs {
  uid: string;
  canManageExams: boolean;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

export interface UseClassroomAssignmentsResult {
  assignments: Exam[];
  setAssignments: React.Dispatch<React.SetStateAction<Exam[]>>;
  loadingAssignments: boolean;
  fetchAssignments: () => Promise<void>;
}

export function useClassroomAssignments({
  uid,
  t,
}: UseClassroomAssignmentsArgs): UseClassroomAssignmentsResult {
  const [assignments, setAssignments] = useState<Exam[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const fetchAssignments = useCallback(async () => {
    setLoadingAssignments(true);
    try {
      const data = await spaceApi.assignments.listByClassroom(uid);
      setAssignments(getCanManageExams() ? data : data.filter(item => item.status === 'published'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.assignments_load_error', 'Không thể tải danh sách bài tập'));
    } finally {
      setLoadingAssignments(false);
    }
  }, [uid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Mounting the tab initiates its request.
    void fetchAssignments();
  }, [fetchAssignments]);

  return {
    assignments,
    setAssignments,
    loadingAssignments,
    fetchAssignments,
  };
}

export default useClassroomAssignments;
