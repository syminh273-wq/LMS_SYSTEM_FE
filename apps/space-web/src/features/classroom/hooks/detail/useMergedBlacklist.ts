import { useState, useCallback, useMemo } from 'react';
import type { BlacklistEntry } from '@/lib/api/types';
import { toast } from 'sonner';
import { useClassroomBlacklist } from './useClassroomBlacklist';
import { useGlobalBlacklist } from './useGlobalBlacklist';

export interface UseMergedBlacklistArgs {
  uid: string;
  t: (key: string) => string;
}

export interface UseMergedBlacklistResult {
  blacklist: BlacklistEntry[];
  loadingBlacklist: boolean;
  unblockingId: string | null;
  setUnblockingId: React.Dispatch<React.SetStateAction<string | null>>;
  refetch: () => void;
}

/**
 * Composes the classroom-scoped and global-scoped blacklist queries into a single
 * merged list, keyed by consumer_uid. Global entries override classroom entries
 * for the same consumer_uid (global ghi đè).
 */
export function useMergedBlacklist({
  uid,
  t,
}: UseMergedBlacklistArgs): UseMergedBlacklistResult {
  const { classroomBlacklist, loadingClassroomBlacklist, refetchClassroomBlacklist } =
    useClassroomBlacklist({ uid });
  const { globalBlacklist, loadingGlobalBlacklist, refetchGlobalBlacklist } =
    useGlobalBlacklist();
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const blacklist = useMemo(() => {
    // Merge: nếu cùng consumer_uid xuất hiện ở cả 2, global ưu tiên
    const map = new Map<string, BlacklistEntry>();
    for (const e of classroomBlacklist) map.set(e.consumer_uid, e);
    for (const e of globalBlacklist) map.set(e.consumer_uid, e); // global ghi đè
    return Array.from(map.values());
  }, [classroomBlacklist, globalBlacklist]);

  const loadingBlacklist = loadingClassroomBlacklist || loadingGlobalBlacklist;

  const refetch = useCallback(() => {
    Promise.all([refetchClassroomBlacklist(), refetchGlobalBlacklist()])
      .catch(() => toast.error(t('classroom.ui.blacklist_load_error')));
  }, [refetchClassroomBlacklist, refetchGlobalBlacklist, t]);

  return {
    blacklist,
    loadingBlacklist,
    unblockingId,
    setUnblockingId,
    refetch,
  };
}

export default useMergedBlacklist;
