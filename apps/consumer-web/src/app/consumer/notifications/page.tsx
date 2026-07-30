'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, BellRing, Check, Inbox } from 'lucide-react';
import { useSelector } from 'react-redux';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';

import { useNotifications } from '@/lib/hooks/use-notifications';
import type { NotificationItem, NotificationMetadata } from '@/lib/api';
import type { RootState } from '@/lib/redux/store';

type FilterType = 'unread' | 'all';

function parseNotificationMetadata(
  raw: string | NotificationMetadata | undefined | null,
): NotificationMetadata {
  if (!raw) return {};
  if (typeof raw !== 'string') return raw as NotificationMetadata;
  try {
    return (JSON.parse(raw) as NotificationMetadata) ?? {};
  } catch {
    return {};
  }
}

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Vừa xong';
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = React.useState<FilterType>('all');
  const userProfile = useSelector((state: RootState) => state.user.profile);
  const userId = userProfile?.uid ?? null;
  const { items, unreadCount, loading, markRead, markAllRead } = useNotifications({ userId });

  const filteredItems = filter === 'unread' ? items.filter((n) => !n.is_read) : items;

  const handleClickItem = (item: NotificationItem) => {
    void markRead(item.uid);
    const meta = parseNotificationMetadata(item.metadata);
    if (meta.classroom_uid) {
      router.push(`/consumer/classroom/${meta.classroom_uid}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.back()}
              aria-label="Quay lại"
              className="rounded-full"
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Thông báo</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {unreadCount > 0
                  ? `${unreadCount} chưa đọc`
                  : 'Đã đọc tất cả'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void markAllRead()}
              className="gap-1.5"
            >
              <Check size={14} />
              Đọc tất cả
            </Button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-semibold transition-all',
              filter === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/70',
            )}
          >
            Tất cả
            {items.length > 0 && (
              <span className="ml-1.5 text-xs opacity-80">({items.length})</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-semibold transition-all',
              filter === 'unread'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/70',
            )}
          >
            Chưa đọc
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-1.5 h-4 min-w-4 px-1 text-[10px] font-bold"
              >
                {unreadCount}
              </Badge>
            )}
          </button>
        </div>

        {/* List */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {loading && items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Đang tải...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Inbox size={22} className="text-muted-foreground/60" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {filter === 'unread'
                  ? 'Không có thông báo chưa đọc'
                  : 'Chưa có thông báo nào'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredItems.map((item) => {
                const meta = parseNotificationMetadata(item.metadata);
                const hasLink = !!meta.classroom_uid;
                const isUnread = !item.is_read;
                return (
                  <button
                    type="button"
                    key={item.uid}
                    onClick={() => handleClickItem(item)}
                    className={cn(
                      'relative flex items-start gap-3 w-full text-left px-4 py-4 cursor-pointer transition-colors',
                      isUnread ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted',
                    )}
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                        isUnread ? 'bg-primary/15' : 'bg-muted',
                      )}
                    >
                      {isUnread ? (
                        <BellRing size={18} className="text-primary" />
                      ) : (
                        <Bell size={18} className="text-muted-foreground/60" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <p
                          className={cn(
                            'text-sm flex-1',
                            isUnread
                              ? 'font-semibold text-foreground'
                              : 'font-medium text-muted-foreground',
                          )}
                        >
                          {item.title}
                        </p>
                        {isUnread && (
                          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                      <p
                        className={cn(
                          'mt-1 text-sm line-clamp-2',
                          isUnread ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {item.content}
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground font-medium">
                        {relativeTime(item.created_at)}
                        {hasLink && (
                          <span className="ml-2 text-primary font-semibold">
                            · Xem lớp →
                          </span>
                        )}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
