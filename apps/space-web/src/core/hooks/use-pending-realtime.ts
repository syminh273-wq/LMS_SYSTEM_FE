import { useEffect, useRef } from 'react';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import firebaseApp from '@/lib/firebase';

type Options = {
  classroomUid: string | null | undefined;
  onNewRequest: () => void;
};

/**
 * Listens to Firebase `pending_requests/{classroomUid}`.
 * Calls onNewRequest() whenever the node changes (student joined → backend wrote signal).
 * Skips the initial snapshot on mount.
 */
export function usePendingRealtime({ classroomUid, onNewRequest }: Options) {
  const initializedRef = useRef(false);
  const onNewRequestRef = useRef(onNewRequest);
  onNewRequestRef.current = onNewRequest;

  useEffect(() => {
    if (!firebaseApp || !classroomUid) return;

    initializedRef.current = false;
    const db = getDatabase(firebaseApp);
    const pendingRef = ref(db, `pending_requests/${classroomUid}`);

    const handler = onValue(pendingRef, () => {
      if (!initializedRef.current) {
        initializedRef.current = true;
        return; // skip initial snapshot
      }
      onNewRequestRef.current();
    });

    return () => off(pendingRef, 'value', handler as never);
  }, [classroomUid]);
}
