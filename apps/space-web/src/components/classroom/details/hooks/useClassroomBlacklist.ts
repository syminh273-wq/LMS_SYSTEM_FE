'use client';

import { useState, useEffect, useCallback } from 'react';
import { spaceApi } from '@/lib/api';
import type { BlacklistEntry } from '@/lib/api/types';
import { toast } from 'sonner';

export interface UseClassroomBlacklistArgs {
  uid: string;
  activeTab: string;
  t: (key: string) => string;
}

export interface UseClassroomBlacklistResult {
  blacklist: BlacklistEntry[];
  setBlacklist: React.Dispatch<React.SetStateAction<BlacklistEntry[]>>;
  loadingBlacklist: boolean;
  unblockingId: string | null;
  setUnblockingId: React.Dispatch<React.SetStateAction<string | null>>;
  refetch: () => void;
}

export function useClassroomBlacklist({
  uid,
  activeTab,
  t,
}: UseClassroomBlacklistArgs): UseClassroomBlacklistResult {
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [loadingBlacklist, setLoadingBlacklist] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const refetch = useCallback(() => {
    if (activeTab !== 'blacklist') return;
     
    setLoadingBlacklist(true);
    Promise.all([
      spaceApi.classrooms.listClassroomBlacklist(uid),
      spaceApi.classrooms.listGlobalBlacklist(),
    ])
      .then(([classroomEntries, globalEntries]) => {
        // Merge: nếu cùng consumer_uid xuất hiện ở cả 2, global ưu tiên
        const map = new Map<string, typeof classroomEntries[0]>();
        for (const e of classroomEntries) map.set(e.consumer_uid, e);
        for (const e of globalEntries)    map.set(e.consumer_uid, e); // global ghi đè
        setBlacklist(Array.from(map.values()));
      })
      .catch(() => toast.error(t('classroom.ui.blacklist_load_error')))
      .finally(() => setLoadingBlacklist(false));
  }, [uid, activeTab, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch();
  }, [refetch]);

  return {
    blacklist,
    setBlacklist,
    loadingBlacklist,
    unblockingId,
    setUnblockingId,
    refetch,
  };
}

export default useClassroomBlacklist;
