import { useState } from 'react';
import { spaceApi, Exam } from '@/lib/api';
import { toast } from 'sonner';

export interface UseDeleteAssignmentArgs {
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

export interface UseDeleteAssignmentResult {
  deleteAssignment: (assignment: Exam) => Promise<boolean>;
  deletingAssignmentUid: string | null;
}

export function useDeleteAssignment({ t }: UseDeleteAssignmentArgs): UseDeleteAssignmentResult {
  const [deletingAssignmentUid, setDeletingAssignmentUid] = useState<string | null>(null);

  const deleteAssignment = async (assignment: Exam): Promise<boolean> => {
    if (deletingAssignmentUid) return false;
    const confirmed = window.confirm(
      t('classroom.ui.assignments_delete_confirm', 'Xoá bài tập "{title}"?', { title: assignment.title })
    );
    if (!confirmed) return false;

    setDeletingAssignmentUid(assignment.uid);
    try {
      await spaceApi.assignments.deleteAssignment(assignment.uid);
      toast.success(t('classroom.ui.assignments_deleted', 'Đã xoá bài tập'));
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.assignments_delete_error', 'Không thể xoá bài tập'));
      return false;
    } finally {
      setDeletingAssignmentUid(null);
    }
  };

  return {
    deleteAssignment,
    deletingAssignmentUid,
  };
}

export default useDeleteAssignment;
