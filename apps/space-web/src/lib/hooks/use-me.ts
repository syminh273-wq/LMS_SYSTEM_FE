import { useCallback, useEffect, useState } from 'react';
import { accountService, type UserProfile } from '@/lib/api/account';

type MeStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type UseMeResult = {
  status: MeStatus;
  me: UserProfile | null;
  reload: () => Promise<void>;
};

/**
 * Fetch the current space (teacher) profile from
 * `/api/v1/space/account/spaces/mine/`. A consumer (student) token will be
 * rejected, leaving `me` as null. Callers can use this to detect "wrong
 * role" or compare `me.uid` against a classroom's `teacher_id` to determine
 * whether the visitor is the class owner.
 */
export function useMe(): UseMeResult {
  const [status, setStatus] = useState<MeStatus>('loading');
  const [me, setMe] = useState<UserProfile | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const profile = await accountService.getProfile();
      setMe(profile);
      setStatus('authenticated');
    } catch {
      setMe(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect --
       Initial mount triggers the same loader that updates state; this
       mirrors the consumer-web useMe hook and is safe because load only
       fires once on mount (load is stable via useCallback([])). */
    void load();
  }, [load]);

  return { status, me, reload: load };
}
