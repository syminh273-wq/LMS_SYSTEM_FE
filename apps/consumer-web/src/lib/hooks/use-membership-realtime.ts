import { useEffect, useRef } from 'react';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { toast } from 'sonner';
import firebaseApp from '@/lib/firebase';

type MembershipEvent = {
  status: 'approved' | 'rejected';
  classroom_uid: string;
  classroom_name: string;
  updated_at: string;
};

type Options = {
  userId: string | null | undefined;
  onApproved?: (event: MembershipEvent) => void;
};

/**
 * Listens to Firebase path `membership_events/{userId}`.
 * Fires onApproved callback + toast when a classroom status changes to 'approved'.
 * Shows error toast when status is 'rejected'.
 * Skips the initial snapshot on mount (only reacts to new changes).
 */
export function useMembershipRealtime({ userId, onApproved }: Options) {
  const initializedRef = useRef(false);
  const seenRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!firebaseApp || !userId) return;

    const databaseURL = firebaseApp.options.databaseURL;
    if (!databaseURL) return;

    const db = getDatabase(firebaseApp, databaseURL);
    const membershipRef = ref(db, `membership_events/${userId}`);
    initializedRef.current = false;

    const unsubscribe = onValue(membershipRef, snapshot => {
      const data = snapshot.val() as Record<string, MembershipEvent> | null;

      // First call: record current state as "already seen", don't toast
      if (!initializedRef.current) {
        initializedRef.current = true;
        if (data) {
          Object.entries(data).forEach(([classroomUid, event]) => {
            seenRef.current[classroomUid] = event.updated_at;
          });
        }
        return;
      }

      if (!data) return;

      Object.entries(data).forEach(([classroomUid, event]) => {
        const lastSeen = seenRef.current[classroomUid];
        if (lastSeen === event.updated_at) return; // already processed
        seenRef.current[classroomUid] = event.updated_at;

        if (event.status === 'approved') {
          toast.success(`Bạn đã được phê duyệt vào lớp "${event.classroom_name}"!`, {
            duration: 6000,
          });
          onApproved?.(event);
        } else if (event.status === 'rejected') {
          toast.error(`Yêu cầu tham gia lớp "${event.classroom_name}" đã bị từ chối.`, {
            duration: 6000,
          });
        }
      });
    });

    return () => off(membershipRef, 'value', unsubscribe as never);
  }, [userId, onApproved]);
}
