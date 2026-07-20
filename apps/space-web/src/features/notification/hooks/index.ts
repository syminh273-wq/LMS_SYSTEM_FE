import { useState, useEffect, useCallback } from 'react';
import type { NotificationItem } from '../types';
import { notificationApi } from '../api';

export function useNotificationList() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await notificationApi.list();
      setNotifications(res);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    refresh: fetchNotifications,
  };
}

export function useMarkNotificationRead() {
  const [loading, setLoading] = useState(false);

  const markRead = useCallback(async (uid: string) => {
    try {
      setLoading(true);
      await notificationApi.markRead(uid);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { markRead, loading };
}

export function useMarkAllNotificationsRead() {
  const [loading, setLoading] = useState(false);

  const markAllRead = useCallback(async () => {
    try {
      setLoading(true);
      await notificationApi.markAllRead();
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { markAllRead, loading };
}
