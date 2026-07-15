'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import firebaseApp from '@/lib/firebase';
import { notificationApi } from '@/lib/api/notification';
import { useTranslation } from '@shared/components/LocaleProvider';

type FbNotification = {
  uid: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
  is_read?: string;
  metadata: Record<string, string>;
};

export default function NotificationBell() {
  const { t, formatDate } = useTranslation();
  const [notifications, setNotifications] = useState<FbNotification[]>([]);
  const [readUids, setReadUids] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let uid = null;
    if (typeof window !== 'undefined') {
      const profileStr = localStorage.getItem('userProfile');
      if (profileStr) {
        try {
          const profile = JSON.parse(profileStr);
          uid = profile.uid;
        } catch (e) {
          console.error('[NotificationBell] Failed to parse userProfile', e);
        }
      }
    }
    
    if (!firebaseApp || !uid) return;

    const db = getDatabase(firebaseApp);
    const signalRef = ref(db, `notifications/${uid}`);

    onValue(
      signalRef,
      (snapshot) => {
        const raw = snapshot.val() as Record<string, FbNotification> | null;
        if (!raw) { 
          setNotifications([]); 
          setReadUids(new Set());
          return; 
        }

        const list = Object.values(raw).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setNotifications(list);
        
        // Clear readUids that are now confirmed as read in Firebase to keep state lean
        setReadUids(prev => {
          const next = new Set(prev);
          list.forEach(n => {
            if (n.is_read === 'true') next.delete(n.uid);
          });
          return next;
        });
      },
      (error) => {
        console.error('[NotificationBell] Firebase error:', error);
      }
    );

    return () => off(signalRef);
  }, []);

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

  const unreadCount = notifications.filter(n => n.is_read !== 'true' && !readUids.has(n.uid)).length;

  const handleMarkRead = async (uid: string) => {
    setReadUids(prev => new Set(prev).add(uid));
    try {
      await notificationApi.markRead(uid);
    } catch (error) {
      console.error('[NotificationBell] Failed to mark as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    setReadUids(new Set(notifications.filter(n => n.is_read !== 'true').map(n => n.uid)));
    try {
      await notificationApi.markAllRead();
    } catch (error) {
      console.error('[NotificationBell] Failed to mark all as read:', error);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 rounded-full hover:bg-muted transition-colors"
        aria-label={t('layout.notifications.aria_label')}
      >
        <Bell size={20} className="text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">{t('layout.notifications.title')}</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-primary-brand hover:text-primary-brand-dark font-medium"
              >
                <CheckCheck size={13} />
                {t('layout.notifications.mark_all_read')}
              </button>
            )}
          </div>

          <ul className="max-h-96 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <li className="py-10 text-center text-sm text-muted-foreground">
                {t('layout.notifications.empty')}
              </li>
            ) : (
              notifications.map((n) => {
                const isRead = n.is_read === 'true' || readUids.has(n.uid);
                return (
                  <li
                    key={n.uid}
                    onClick={() => !isRead && handleMarkRead(n.uid)}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer ${
                      isRead ? 'hover:bg-muted/50' : 'bg-primary-brand-light/60 hover:bg-primary-brand-light'
                    }`}
                  >
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      isRead ? 'bg-muted text-muted-foreground' : 'bg-primary-brand-light text-primary-brand'
                    }`}>
                      {n.title?.[0]?.toUpperCase() ?? '🔔'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${isRead ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatTime(n.created_at, t, formatDate)}</p>
                    </div>

                    {!isRead && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-brand" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatTime(
  iso: string,
  t: (key: string, fallback?: string, values?: Record<string, string | number>) => string,
  formatDate: (value: string | number | Date) => string,
) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return t('layout.notifications.just_now');
  if (diff < 3600) return t('layout.notifications.minutes_ago', undefined, { count: Math.floor(diff / 60) });
  if (diff < 86400) return t('layout.notifications.hours_ago', undefined, { count: Math.floor(diff / 3600) });
  const days = Math.floor(diff / 86400);
  if (days < 7) return t('layout.notifications.days_ago', undefined, { count: days });
  return formatDate(iso);
}
