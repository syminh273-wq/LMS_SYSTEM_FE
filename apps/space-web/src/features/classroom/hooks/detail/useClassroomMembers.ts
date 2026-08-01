import { useState, useEffect } from 'react';
import { spaceApi } from '@/lib/api';
import type { ClassroomMember } from '@/lib/api/types';
import { toast } from 'sonner';

export interface UseClassroomMembersArgs {
  uid: string;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

export interface UseClassroomMembersResult {
  members: ClassroomMember[];
  setMembers: React.Dispatch<React.SetStateAction<ClassroomMember[]>>;
  loadingMembers: boolean;
}

export function useClassroomMembers({
  uid,
  t,
}: UseClassroomMembersArgs): UseClassroomMembersResult {
  const [members, setMembers] = useState<ClassroomMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Mounting the tab initiates its request.
    setLoadingMembers(true);
    spaceApi.classrooms.getClassroomMembers(uid)
      .then(setMembers)
      .catch(() => toast.error(t('classroom.ui.students_load_error')))
      .finally(() => setLoadingMembers(false));
  }, [uid]);

  return {
    members,
    setMembers,
    loadingMembers,
  };
}

export default useClassroomMembers;
