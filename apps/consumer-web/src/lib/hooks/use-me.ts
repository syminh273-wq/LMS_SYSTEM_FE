'use client';

import { useCallback, useEffect, useState } from 'react';
import { accountService, type UserProfile } from '@/lib/api/account';

type MeStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type UseMeResult = {
  status: MeStatus;
  me: UserProfile | null;
  reload: () => Promise<void>;
};

/**
 * Fetch the current consumer profile from `/api/v1/consumer/account/consumers/me/`.
 * The endpoint is consumer-only — a space (teacher) token will be rejected
 * with 401/403, leaving `me` as null. Callers can use this to detect
 * "wrong role" or compare `me.uid` against a classroom's `teacher_id` to
 * determine whether the visitor is the class owner.
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
    void load();
  }, [load]);

  return { status, me, reload: load };
}
