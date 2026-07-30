import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { off, onValue, ref, type Database } from 'firebase/database';
import { notificationApi, type NotificationItem } from '@/lib/api';
import firebaseApp, { getRealtimeDatabase } from '@/lib/firebase';

type RealtimeNotification = {
  uid: string;
  type: string;
  title: string;
  content: string;
  metadata: string;
  is_read: string;
  created_at: string;
};

function normalizeRealtime(item: RealtimeNotification): NotificationItem {
  return {
    uid: item.uid,
    target_uid: '',
    notify_type: item.type,
    title: item.title,
    content: item.content,
    metadata: item.metadata,
    is_read: item.is_read === 'true',
    created_at: item.created_at,
  };
}

type Options = {
  userId: string | null | undefined;
};

/**
 * Merge realtime Firebase snapshot into the current items list.
 * Never REPLACES the list — only adds new items or updates existing ones.
 * Trusts local is_read (optimistic) to avoid flicker after markRead.
 */
function mergeRealtime(prev: NotificationItem[], realtime: NotificationItem[]): NotificationItem[] {
  if (realtime.length === 0) return prev;
  const prevByUid = new Map(prev.map(n => [n.uid, n]));
  const merged: NotificationItem[] = [...prev];
  for (const incoming of realtime) {
    const existing = prevByUid.get(incoming.uid);
    if (!existing) {
      merged.unshift(incoming);
      continue;
    }
    if (existing.is_read && !incoming.is_read) {
      const idx = merged.indexOf(existing);
      if (idx >= 0) merged[idx] = { ...incoming, is_read: true };
    }
  }
  merged.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return merged;
}

/**
 * Global notifications hook.
 * - Loads the initial list from REST API.
 * - Subscribes to Firebase `notifications/{userId}` for realtime push.
 * - Tracks unread count + exposes markRead / markAllRead.
 */
export function useNotifications({ userId }: Options) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const initializedRef = useRef(false);
  const realtimeBufferRef = useRef<NotificationItem[] | null>(null);

  const fetchList = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await notificationApi.list();
      const restList = Array.isArray(data) ? data : [];
      setItems(prev => {
        // If a realtime snapshot arrived before REST resolved, merge it in
        // instead of letting the REST response overwrite the realtime items.
        // Also merge into whatever the current state already shows so we
        // never drop items that were rendered from an earlier realtime push.
        const buffered = realtimeBufferRef.current;
        realtimeBufferRef.current = null;
        const safePrev = Array.isArray(prev) ? prev : [];
        const fromRealtime = buffered && buffered.length > 0 ? buffered : [];
        // Start with REST list (the source of truth for history), then
        // merge in any items we already have on screen (from realtime)
        // and the buffered snapshot. mergeRealtime only adds/updates by uid.
        let merged = mergeRealtime(restList, safePrev);
        if (fromRealtime.length > 0) {
          merged = mergeRealtime(merged, fromRealtime);
        }
        return merged;
      });
    } catch (err) {
      console.error('[useNotifications] fetchList failed', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    initializedRef.current = false;
    realtimeBufferRef.current = null;
    const handle = window.setTimeout(() => { void fetchList(); }, 0);
    return () => window.clearTimeout(handle);
  }, [userId, fetchList]);

  useEffect(() => {
    if (!firebaseApp || !userId) return;
    const databaseURL = firebaseApp.options.databaseURL;
    if (!databaseURL) {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[useNotifications] Realtime DB not configured; skipping live subscription');
      }
      return;
    }

    let db: Database;
    try {
      const realtimeDb = getRealtimeDatabase();
      if (!realtimeDb) throw new Error('No db');
      db = realtimeDb;
    } catch (err) {
      console.error('[useNotifications] getDatabase failed, realtime disabled', err);
      return;
    }
    const notifRef = ref(db, `notifications/${userId}`);

    const unsubscribe = onValue(notifRef, snapshot => {
      const data = snapshot.val() as Record<string, RealtimeNotification> | null;
      if (!data) {
        initializedRef.current = true;
        return;
      }
      const realtimeList: NotificationItem[] = Object.values(data).map(normalizeRealtime);
      realtimeList.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

      setItems(prev => {
        initializedRef.current = true;
        const safePrev = Array.isArray(prev) ? prev : [];
        // Always merge into the current list — never replace. If the REST
        // list hasn't loaded yet we still want the realtime items visible
        // immediately, and any later REST response will be merged in via
        // the buffer so we never lose items on either side.
        if (safePrev.length === 0) {
          realtimeBufferRef.current = realtimeList;
          return realtimeList;
        }
        return mergeRealtime(safePrev, realtimeList);
      });
    });

    return () => off(notifRef, 'value', unsubscribe as never);
  }, [userId]);

  const markRead = useCallback(async (uid: string) => {
    let prevSnapshot: NotificationItem[] = [];
    setItems(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      prevSnapshot = safePrev;
      return safePrev.map(n => (n.uid === uid ? { ...n, is_read: true } : n));
    });
    try {
      await notificationApi.markRead(uid);
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[useNotifications] markRead OK', uid);
      }
    } catch (err) {
      console.error('[useNotifications] markRead failed, reverting', uid, err);
      setItems(prevSnapshot);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    let prevSnapshot: NotificationItem[] = [];
    setItems(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      prevSnapshot = safePrev;
      return safePrev.map(n => ({ ...n, is_read: true }));
    });
    try {
      await notificationApi.markAllRead();
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[useNotifications] markAllRead OK');
      }
    } catch (err) {
      console.error('[useNotifications] markAllRead failed, reverting', err);
      setItems(prevSnapshot);
    }
  }, []);

  const unreadCount = useMemo(
    () => (Array.isArray(items) ? items.reduce((sum, n) => (n.is_read ? sum : sum + 1), 0) : 0),
    [items],
  );

  return { items, loading, unreadCount, markRead, markAllRead, refresh: fetchList };
}
