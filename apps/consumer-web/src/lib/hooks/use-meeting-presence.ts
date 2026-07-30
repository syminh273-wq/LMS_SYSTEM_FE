import { useEffect, useState } from 'react';
import { ref, onValue, off } from 'firebase/database';
import firebaseApp, { getRealtimeDatabase } from '@/lib/firebase';
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

    let firebaseRef: ReturnType<typeof ref> | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    // REST fallback — used when Firebase isn't configured, fails to subscribe,
    // or errors out at runtime (e.g. RTDB rules deny read access).
    const startPolling = () => {
      if (pollInterval) return;
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
      pollInterval = setInterval(poll, 5000);
    };

    if (firebaseApp) {
      try {
        const db = getRealtimeDatabase();
        if (!db) throw new Error('No db');
        firebaseRef = ref(db, `classrooms/${classroomUid}/live_room`);

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
            // Khi Firebase báo "không có live room", vẫn poll REST định kỳ
            // để bắt được khi giáo viên mở lớp mà Firebase chưa cập nhật kịp
            // (RTDB rules deny write, hoặc write bị lỗi mạng).
            if (!pollInterval) startPolling();
          }
          setLoading(false);
        };

        // onValue's error callback fires asynchronously (permission-denied, disconnect, etc.)
        // — a try/catch around the subscribe call can't see it, so it must be handled here
        // to still fall back to REST polling instead of hanging silently.
        const errorHandler = (err: Error) => {
          if (cancelled) return;
          console.warn('[useMeetingPresence] Firebase onValue error, falling back to REST:', err);
          if (firebaseRef) off(firebaseRef);
          startPolling();
        };

        onValue(firebaseRef, handler, errorHandler);
      } catch (err) {
        console.warn('[useMeetingPresence] Firebase subscribe failed, falling back to REST:', err);
        startPolling();
      }
    } else {
      startPolling();
    }

    return () => {
      cancelled = true;
      if (firebaseRef) off(firebaseRef);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [classroomUid, enabled]);

  return { marker, room, loading };
}
