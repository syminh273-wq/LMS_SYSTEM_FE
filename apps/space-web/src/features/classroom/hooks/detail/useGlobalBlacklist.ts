import { useState, useEffect, useCallback } from 'react';
import { spaceApi } from '@/lib/api';
import type { BlacklistEntry } from '@/lib/api/types';

export interface UseGlobalBlacklistResult {
  globalBlacklist: BlacklistEntry[];
  loadingGlobalBlacklist: boolean;
  refetchGlobalBlacklist: () => Promise<void>;
}

export function useGlobalBlacklist(): UseGlobalBlacklistResult {
  const [globalBlacklist, setGlobalBlacklist] = useState<BlacklistEntry[]>([]);
  const [loadingGlobalBlacklist, setLoadingGlobalBlacklist] = useState(false);

  const refetchGlobalBlacklist = useCallback(() => {
    setLoadingGlobalBlacklist(true);
    return spaceApi.classrooms.getGlobalBlacklist()
      .then(setGlobalBlacklist)
      .finally(() => setLoadingGlobalBlacklist(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetchGlobalBlacklist().catch(() => {
      // Load failures are surfaced by useMergedBlacklist, which wraps refetch() with a toast.
    });
  }, [refetchGlobalBlacklist]);

  return {
    globalBlacklist,
    loadingGlobalBlacklist,
    refetchGlobalBlacklist,
  };
}

export default useGlobalBlacklist;
