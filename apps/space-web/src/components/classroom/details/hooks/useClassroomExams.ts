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
  activeTab: string;
  canManageExams: boolean;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

export interface UseClassroomExamsResult {
  exams: Exam[];
  loadingExams: boolean;
  examSubTab: 'ongoing' | 'closed';
  setExamSubTab: React.Dispatch<React.SetStateAction<'ongoing' | 'closed'>>;
  deletingExamUid: string | null;
  fetchExams: () => Promise<void>;
  handleDeleteExam: (exam: Exam) => Promise<void>;
  handleOpenOnlineForExam: (exam: Exam) => Promise<void>;
  handleCloseOnline: (exam: Exam) => Promise<void>;
}

export function useClassroomExams({
  uid,
  activeTab,
  canManageExams,
  t,
}: UseClassroomExamsArgs): UseClassroomExamsResult {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [examSubTab, setExamSubTab] = useState<'ongoing' | 'closed'>('ongoing');
  const [deletingExamUid, setDeletingExamUid] = useState<string | null>(null);

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
    if (activeTab === 'exams' || activeTab === 'final_exams') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Entering the tab initiates its request.
      void fetchExams();
    }
  }, [activeTab, fetchExams]);

  const handleDeleteExam = async (exam: Exam) => {
    if (!canManageExams || deletingExamUid) return;
    const confirmed = window.confirm(t('classroom.ui.exams_delete_confirm', undefined, { title: exam.title }));
    if (!confirmed) return;

    setDeletingExamUid(exam.uid);
    try {
      await spaceApi.exams.deleteExam(exam.uid);
      setExams(prev => prev.filter(item => item.uid !== exam.uid));
      toast.success(t('classroom.ui.exams_deleted'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.exams_delete_error'));
    } finally {
      setDeletingExamUid(null);
    }
  };

  const handleOpenOnlineForExam = async (exam: Exam) => {
    try {
      const opened = await spaceApi.exams.openOnline(exam.uid, {
        late_threshold_seconds: 15 * 60,
        duration_seconds: (exam.duration_seconds || 45 * 60),
        camera_required: exam.camera_required ?? false,
        max_tab_leaves: exam.max_tab_leaves ?? 3,
        max_face_warnings: exam.max_face_warnings ?? 0,
      });
      setExams(prev => prev.map(e => e.uid === exam.uid ? opened.exam : e));
      toast.success(t('classroom.ui.exams_open_success', undefined, { count: opened.sessions.length }));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.exams_open_error'));
    }
  };

  const handleCloseOnline = async (exam: Exam) => {
    try {
      await spaceApi.exams.closeOnline(exam.uid);
      setExams(prev => prev.map(e =>
        e.uid === exam.uid ? { ...e, is_online_active: false, status: 'closed' } : e
      ));
      toast.success(t('classroom.ui.exams_close_success'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.exams_close_error'));
    }
  };

  return {
    exams,
    loadingExams,
    examSubTab,
    setExamSubTab,
    deletingExamUid,
    fetchExams,
    handleDeleteExam,
    handleOpenOnlineForExam,
    handleCloseOnline,
  };
}

export default useClassroomExams;
