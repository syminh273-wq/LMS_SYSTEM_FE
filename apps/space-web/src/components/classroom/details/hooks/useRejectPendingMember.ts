import { useState } from 'react';
import { spaceApi } from '@/lib/api';
import type { ClassroomMember } from '@/lib/api/types';
import { toast } from 'sonner';

export interface UseRejectPendingMemberArgs {
  uid: string;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

export interface UseRejectPendingMemberResult {
  rejectMember: (member: ClassroomMember) => Promise<boolean>;
  rejectingId: string | null;
}

export function useRejectPendingMember({
  uid,
  t,
}: UseRejectPendingMemberArgs): UseRejectPendingMemberResult {
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const rejectMember = async (member: ClassroomMember) => {
    setRejectingId(member.member_id);
    try {
      await spaceApi.classrooms.rejectMember(uid, member.member_id);
      toast.success(t('classroom.ui.pending_reject_success', undefined, { name: member.member_name }));
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.pending_reject_error'));
      return false;
    } finally {
      setRejectingId(null);
    }
  };

  return { rejectMember, rejectingId };
}

export default useRejectPendingMember;
