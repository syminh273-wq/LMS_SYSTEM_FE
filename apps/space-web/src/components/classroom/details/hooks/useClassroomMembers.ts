import { useState, useEffect, useCallback } from 'react';
import { usePendingRealtime } from '@/lib/hooks/use-pending-realtime';
import { spaceApi } from '@/lib/api';
import type { ClassroomMember } from '@/lib/api/types';
import { toast } from 'sonner';

export interface UseClassroomMembersArgs {
  uid: string;
  activeTab: string;
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string;
}

export interface UseClassroomMembersResult {
  members: ClassroomMember[];
  setMembers: React.Dispatch<React.SetStateAction<ClassroomMember[]>>;
  pendingMembers: ClassroomMember[];
  setPendingMembers: React.Dispatch<React.SetStateAction<ClassroomMember[]>>;
  loadingMembers: boolean;
  loadingPending: boolean;
  kickingId: string | null;
  setKickingId: React.Dispatch<React.SetStateAction<string | null>>;
  blockingMemberId: string | null;
  setBlockingMemberId: React.Dispatch<React.SetStateAction<string | null>>;
  memberToBlock: { member: ClassroomMember; scope: 'classroom' | 'global' } | null;
  setMemberToBlock: React.Dispatch<React.SetStateAction<{ member: ClassroomMember; scope: 'classroom' | 'global' } | null>>;
  approvingId: string | null;
  setApprovingId: React.Dispatch<React.SetStateAction<string | null>>;
  rejectingId: string | null;
  setRejectingId: React.Dispatch<React.SetStateAction<string | null>>;
  memberToKick: ClassroomMember | null;
  setMemberToKick: React.Dispatch<React.SetStateAction<ClassroomMember | null>>;
  showPendingSheet: boolean;
  setShowPendingSheet: React.Dispatch<React.SetStateAction<boolean>>;
  detailsMember: ClassroomMember | null;
  setDetailsMember: React.Dispatch<React.SetStateAction<ClassroomMember | null>>;
  analyzeMember: ClassroomMember | null;
  setAnalyzeMember: React.Dispatch<React.SetStateAction<ClassroomMember | null>>;
  loadPendingMembers: () => void;
  handleApproveMember: (member: ClassroomMember) => Promise<void>;
  handleRejectMember: (member: ClassroomMember) => Promise<void>;
  handleApproveAll: () => Promise<void>;
  handleKickConfirm: () => Promise<void>;
  handleBlockConfirm: () => Promise<void>;
}

export function useClassroomMembers({
  uid,
  activeTab,
  t,
}: UseClassroomMembersArgs): UseClassroomMembersResult {
  const [members, setMembers] = useState<ClassroomMember[]>([]);
  const [pendingMembers, setPendingMembers] = useState<ClassroomMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [kickingId, setKickingId] = useState<string | null>(null);
  const [blockingMemberId, setBlockingMemberId] = useState<string | null>(null);
  const [memberToBlock, setMemberToBlock] = useState<{ member: ClassroomMember; scope: 'classroom' | 'global' } | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [memberToKick, setMemberToKick] = useState<ClassroomMember | null>(null);
  const [showPendingSheet, setShowPendingSheet] = useState(false);
  const [detailsMember, setDetailsMember] = useState<ClassroomMember | null>(null);
  const [analyzeMember, setAnalyzeMember] = useState<ClassroomMember | null>(null);

  useEffect(() => {
    // Load members on mount for sidebar count, then reload when tab is opened for full list.
    spaceApi.classrooms.members(uid)
      .then(setMembers)
      .catch(() => {/* silently fail for sidebar count */});
  }, [uid]);

  useEffect(() => {
    if (activeTab !== 'students') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Entering the tab initiates its request.
    setLoadingMembers(true);
    spaceApi.classrooms.members(uid)
      .then(setMembers)
      .catch(() => toast.error(t('classroom.ui.students_load_error')))
      .finally(() => setLoadingMembers(false));
  }, [activeTab, uid]);

  const loadPendingMembers = useCallback(() => {
    setLoadingPending(true);
    spaceApi.classrooms.pendingMembers(uid)
      .then(setPendingMembers)
      .catch(() => toast.error(t('classroom.ui.pending_load_error')))
      .finally(() => setLoadingPending(false));
  }, [uid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPendingMembers();
  }, [loadPendingMembers]);

  // Realtime Firebase: khi học sinh join → badge tự cập nhật không cần refresh
  usePendingRealtime({ classroomUid: uid, onNewRequest: loadPendingMembers });

  const handleApproveMember = async (member: ClassroomMember) => {
    setApprovingId(member.member_id);
    try {
      const approved = await spaceApi.classrooms.approveMember(uid, member.member_id);
      setPendingMembers(prev => prev.filter(m => m.member_id !== member.member_id));
      setMembers(prev => [...prev, approved]);
      toast.success(t('classroom.ui.pending_approve_success', undefined, { name: member.member_name }));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.pending_approve_error'));
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectMember = async (member: ClassroomMember) => {
    setRejectingId(member.member_id);
    try {
      await spaceApi.classrooms.rejectMember(uid, member.member_id);
      setPendingMembers(prev => prev.filter(m => m.member_id !== member.member_id));
      toast.success(t('classroom.ui.pending_reject_success', undefined, { name: member.member_name }));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.pending_reject_error'));
    } finally {
      setRejectingId(null);
    }
  };

  const handleApproveAll = async () => {
    for (const member of pendingMembers) {
      await handleApproveMember(member);
    }
  };

  const handleKickConfirm = async () => {
    if (!memberToKick) return;
    setKickingId(memberToKick.member_id);
    try {
      await spaceApi.classrooms.kickMember(uid, memberToKick.member_id);
      setMembers(prev => prev.filter(m => m.member_id !== memberToKick.member_id));
      toast.success(t('classroom.ui.kick_success', undefined, { name: memberToKick.member_name }));
      setMemberToKick(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('classroom.ui.kick_error'));
    } finally {
      setKickingId(null);
    }
  };

  const handleBlockConfirm = async () => {
    if (!memberToBlock) return;
    const { member, scope } = memberToBlock;
    setBlockingMemberId(member.member_id);
    try {
      if (scope === 'global') {
        await spaceApi.classrooms.addGlobalBlacklist(member.member_id);
        toast.success(t('classroom.ui.block_global_success', undefined, { name: member.member_name }));
      } else {
        await spaceApi.classrooms.addClassroomBlacklist(uid, member.member_id);
        toast.success(t('classroom.ui.block_classroom_success', undefined, { name: member.member_name }));
      }
      try { await spaceApi.classrooms.kickMember(uid, member.member_id); } catch { /* already kicked */ }
      setMembers(prev => prev.filter(m => m.member_id !== member.member_id));
      setMemberToBlock(null);
    } catch {
      toast.error(t('classroom.ui.block_error'));
    } finally {
      setBlockingMemberId(null);
    }
  };

  return {
    members,
    setMembers,
    pendingMembers,
    setPendingMembers,
    loadingMembers,
    loadingPending,
    kickingId,
    setKickingId,
    blockingMemberId,
    setBlockingMemberId,
    memberToBlock,
    setMemberToBlock,
    approvingId,
    setApprovingId,
    rejectingId,
    setRejectingId,
    memberToKick,
    setMemberToKick,
    showPendingSheet,
    setShowPendingSheet,
    detailsMember,
    setDetailsMember,
    analyzeMember,
    setAnalyzeMember,
    loadPendingMembers,
    handleApproveMember,
    handleRejectMember,
    handleApproveAll,
    handleKickConfirm,
    handleBlockConfirm,
  };
}

export default useClassroomMembers;
