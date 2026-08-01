import { useState, useEffect, useCallback } from 'react';
import { usePendingRealtime } from '@/lib/hooks/use-pending-realtime';
import { spaceApi } from '@/lib/api';
import type { ClassroomMemberProps } from '@/lib/api/types';
import { toast } from 'sonner';

export interface UsePendingMembersArgs {
  uid: string;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

export interface UsePendingMembersResult {
  pendingMembers: ClassroomMemberProps[];
  setPendingMembers: React.Dispatch<React.SetStateAction<ClassroomMemberProps[]>>;
  loadingPending: boolean;
  loadPendingMembers: () => void;
}

// Pending-members (join requests) query lives at page level because Header's badge/button and
// PendingSheet can be opened from any tab, not just the Students tab.
export function usePendingMembers({
  uid,
  t,
}: UsePendingMembersArgs): UsePendingMembersResult {
  const [pendingMembers, setPendingMembers] = useState<ClassroomMemberProps[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

  const loadPendingMembers = useCallback(() => {
    setLoadingPending(true);
    spaceApi.classrooms.getPendingMembers(uid)
      .then(setPendingMembers)
      .catch(() => toast.error(t('classroom.ui.pending_load_error')))
      .finally(() => setLoadingPending(false));
  }, [uid, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPendingMembers();
  }, [loadPendingMembers]);

  // Realtime Firebase: khi học sinh join → badge tự cập nhật không cần refresh
  usePendingRealtime({ classroomUid: uid, onNewRequest: loadPendingMembers });

  return {
    pendingMembers,
    setPendingMembers,
    loadingPending,
    loadPendingMembers,
  };
}

export default usePendingMembers;
