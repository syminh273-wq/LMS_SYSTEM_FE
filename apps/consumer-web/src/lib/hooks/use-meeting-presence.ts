import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, off, type Database } from 'firebase/database';
import firebaseApp from '@/lib/firebase';
import { meetingRoomApi, type LiveRoomMarker, type MeetingRoom } from '@/lib/api/meeting-room';

export type UseMeetingPresenceResult = {
  marker: LiveRoomMarker | null;
  room: MeetingRoom | null;
  loading: boolean;
};

type Options = {
  classroomUid: string | null | undefined;
  enabled?: boolean;
};

let cachedDb: Database | null = null;
function getCachedDb(app: typeof firebaseApp): Database | null {
  if (!app) return null;
  if (!cachedDb) {
    cachedDb = getDatabase(app);
  }
  return cachedDb;
}

/**
 * Subscribes to `classrooms/{classroomUid}/live_room` on Firebase Realtime DB
 * to detect when the teacher opens a live meeting.
 * Falls back to REST polling via `meetingRoomApi.getLiveRoom` if Firebase RTDB
 * is not configured on this client.
 */
export function useMeetingPresence({ classroomUid, enabled = true }: Options): UseMeetingPresenceResult {
  const [marker, setMarker] = useState<LiveRoomMarker | null>(null);
  const [room, setRoom] = useState<MeetingRoom | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !classroomUid) {
      setMarker(null);
      setRoom(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    if (firebaseApp) {
      try {
        const db = getCachedDb(firebaseApp);
        if (!db) throw new Error('No db');
        const r = ref(db, `classrooms/${classroomUid}/live_room`);

        const handler = (snap: { val: () => unknown }) => {
          if (cancelled) return;
          const val = snap.val() as LiveRoomMarker | null;
          if (val && val.room_uid) {
            setMarker(val);
            void meetingRoomApi
              .getLiveRoom(classroomUid)
              .then((res) => {
                if (!cancelled) setRoom(res.room);
              })
              .catch(() => {
                if (!cancelled) setRoom(null);
              });
          } else {
            setMarker(null);
            setRoom(null);
          }
          setLoading(false);
        };

        onValue(r, handler);
        return () => {
          cancelled = true;
          off(r);
        };
      } catch (err) {
        console.warn('[useMeetingPresence] Firebase subscribe failed, falling back to REST:', err);
      }
    }

    const poll = async () => {
      try {
        const res = await meetingRoomApi.getLiveRoom(classroomUid);
        if (cancelled) return;
        setMarker(res.live_room);
        setRoom(res.room);
      } catch {
        if (!cancelled) {
          setMarker(null);
          setRoom(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void poll();
    const interval = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [classroomUid, enabled]);

  return { marker, room, loading };
}
