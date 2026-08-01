import { useState } from 'react';
import { spaceApi } from '@/lib/api';
import type { ClassroomMember } from '@/lib/api/types';
import { toast } from 'sonner';

export interface UseBlockMemberArgs {
  uid: string;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

export interface UseBlockMemberResult {
  blockMember: (member: ClassroomMember, scope: 'classroom' | 'global') => Promise<boolean>;
  blockingMemberId: string | null;
}

export function useBlockMember({
  uid,
  t,
}: UseBlockMemberArgs): UseBlockMemberResult {
  const [blockingMemberId, setBlockingMemberId] = useState<string | null>(null);

  const blockMember = async (member: ClassroomMember, scope: 'classroom' | 'global'): Promise<boolean> => {
    setBlockingMemberId(member.member_id);
    try {
      if (scope === 'global') {
        await spaceApi.classrooms.addGlobalBlacklist(member.member_id);
        toast.success(t('classroom.ui.block_global_success', undefined, { name: member.member_name }));
      } else {
        await spaceApi.classrooms.addClassroomBlacklist(uid, member.member_id);
        toast.success(t('classroom.ui.block_classroom_success', undefined, { name: member.member_name }));
      }
      return true;
    } catch {
      toast.error(t('classroom.ui.block_error'));
      return false;
    } finally {
      setBlockingMemberId(null);
    }
  };

  return {
    blockMember,
    blockingMemberId,
  };
}

export default useBlockMember;
