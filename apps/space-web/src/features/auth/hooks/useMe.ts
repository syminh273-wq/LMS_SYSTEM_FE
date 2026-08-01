import { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { fetchAccountProfile } from '@/features/auth/store';
import type { Consumer } from '@/lib/api';
import { accountService } from '@/lib/api/account';
import { RootState, useAppDispatch } from '@/lib/redux/store';

type MeStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type UseMeResult = {
  status: MeStatus;
  me: Consumer | null;
  reload: () => Promise<void>;
};

/**
 * Reads the current space (teacher) profile from the shared Redux cache
 * (populated once by `AppInitializer` from
 * `/api/v1/space/account/spaces/mine/`). A consumer (student) token will be
 * rejected, leaving `me` as null. Callers can use this to detect "wrong
 * role" or compare `me.uid` against a classroom's `teacher_id` to determine
 * whether the visitor is the class owner.
 */
export function useMe(): UseMeResult {
  const dispatch = useAppDispatch();
  const me = useSelector((s: RootState) => s.user.profile);
  const fetchStatus = useSelector((s: RootState) => s.user.status);

  const reload = useCallback(async () => {
    await dispatch(fetchAccountProfile({ force: true }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchAccountProfile());
  }, [dispatch]);

  const status = useMemo<MeStatus>(() => {
    if (fetchStatus === 'failed') return 'unauthenticated';
    if (fetchStatus === 'succeeded') return me ? 'authenticated' : 'unauthenticated';
    return 'loading';
  }, [fetchStatus, me]);

  return { status, me, reload };
}
