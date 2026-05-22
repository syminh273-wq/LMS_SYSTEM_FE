'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { notificationApi, type Notification } from '@/lib/api/notification';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import firebaseApp from '@/lib/firebase';

const POLL_INTERVAL = 30_000;

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationApi.list();
      setNotifications(data);
    } catch (err) {
      console.error('[NotificationBell] fetch failed:', err);
    }
  }, []);

  // Poll định kỳ làm fallback
  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  // Lắng nghe Firebase signal — fetch ngay khi consumer join lớp
  useEffect(() => {
    const db = getDatabase(firebaseApp);
    const signalRef = ref(db, 'signals/new_notification');
    onValue(signalRef, () => { void fetchNotifications(); });
    return () => off(signalRef);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkRead = async (uid: string, targetUid: string) => {
    try {
      await notificationApi.markRead(uid, targetUid);
      setNotifications(prev =>
        prev.map(n => n.uid === uid ? { ...n, is_read: true } : n)
      );
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      const uniqueTargets = [...new Set(notifications.filter(n => !n.is_read).map(n => n.target_uid))];
      await Promise.all(uniqueTargets.map(uid => notificationApi.markAllRead(uid)));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch { /* ignore */ }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors"
        aria-label="Thông báo"
      >
        <Bell size={20} className="text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-800">Thông báo</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <CheckCheck size={13} />
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <ul className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <li className="py-10 text-center text-sm text-slate-400">
                Chưa có thông báo nào
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.uid}
                  onClick={() => !n.is_read && handleMarkRead(n.uid, n.target_uid)}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer ${
                    n.is_read ? 'hover:bg-slate-50' : 'bg-indigo-50/60 hover:bg-indigo-50'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    n.is_read ? 'bg-slate-100 text-slate-500' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    {n.title?.[0]?.toUpperCase() ?? '🔔'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`text-sm truncate ${n.is_read ? 'text-slate-600' : 'text-slate-800 font-medium'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.content}</p>
                    <p className="text-xs text-slate-400 mt-1">{formatTime(n.created_at)}</p>
                  </div>

                  {!n.is_read && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}
