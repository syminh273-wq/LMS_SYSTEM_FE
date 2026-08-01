import { useState } from 'react';
import { spaceApi } from '@/lib/api';
import type { ClassroomMemberProps } from '@/lib/api/types';
import { toast } from 'sonner';

export interface UseKickMemberArgs {
  uid: string;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

export interface UseKickMemberResult {
  kickMember: (member: ClassroomMemberProps) => Promise<boolean>;
  kickingId: string | null;
}

export function useKickMember({
  uid,
  t,
}: UseKickMemberArgs): UseKickMemberResult {
  const [kickingId, setKickingId] = useState<string | null>(null);

  const kickMember = async (member: ClassroomMemberProps): Promise<boolean> => {
    setKickingId(member.member_id);
    try {
      await spaceApi.classrooms.kickClassroomMember(uid, member.member_id);
      toast.success(t('classroom.ui.kick_success', undefined, { name: member.member_name }));
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.kick_error'));
      return false;
    } finally {
      setKickingId(null);
    }
  };

  return {
    kickMember,
    kickingId,
  };
}

export default useKickMember;
