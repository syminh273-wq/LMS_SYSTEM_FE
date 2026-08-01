import { useState } from 'react';
import { spaceApi } from '@/lib/api';
import type { ClassroomMember } from '@/lib/api/types';
import { toast } from 'sonner';

export interface UseApprovePendingMemberArgs {
  uid: string;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

export interface UseApprovePendingMemberResult {
  approveMember: (member: ClassroomMember) => Promise<boolean>;
  approvingId: string | null;
}

export function useApprovePendingMember({
  uid,
  t,
}: UseApprovePendingMemberArgs): UseApprovePendingMemberResult {
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const approveMember = async (member: ClassroomMember) => {
    setApprovingId(member.member_id);
    try {
      await spaceApi.classrooms.approveMember(uid, member.member_id);
      toast.success(t('classroom.ui.pending_approve_success', undefined, { name: member.member_name }));
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.pending_approve_error'));
      return false;
    } finally {
      setApprovingId(null);
    }
  };

  return { approveMember, approvingId };
}

export default useApprovePendingMember;
