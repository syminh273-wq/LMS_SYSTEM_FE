import { useState, useEffect, useCallback } from 'react';
import { spaceApi } from '@/lib/api';
import type { BlacklistEntry } from '@/lib/api/types';

export interface UseClassroomBlacklistArgs {
  uid: string;
}

export interface UseClassroomBlacklistResult {
  classroomBlacklist: BlacklistEntry[];
  loadingClassroomBlacklist: boolean;
  refetchClassroomBlacklist: () => Promise<void>;
}

export function useClassroomBlacklist({
  uid,
}: UseClassroomBlacklistArgs): UseClassroomBlacklistResult {
  const [classroomBlacklist, setClassroomBlacklist] = useState<BlacklistEntry[]>([]);
  const [loadingClassroomBlacklist, setLoadingClassroomBlacklist] = useState(false);

  const refetchClassroomBlacklist = useCallback(() => {
    setLoadingClassroomBlacklist(true);
    return spaceApi.classrooms.listClassroomBlacklist(uid)
      .then(setClassroomBlacklist)
      .finally(() => setLoadingClassroomBlacklist(false));
  }, [uid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetchClassroomBlacklist().catch(() => {
      // Load failures are surfaced by useMergedBlacklist, which wraps refetch() with a toast.
    });
  }, [refetchClassroomBlacklist]);

  return {
    classroomBlacklist,
    loadingClassroomBlacklist,
    refetchClassroomBlacklist,
  };
}

export default useClassroomBlacklist;
