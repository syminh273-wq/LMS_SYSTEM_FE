'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellRing, Inbox } from 'lucide-react';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { cn } from '@shared/lib/utils';

import { useNotifications } from '@/lib/hooks/use-notifications';
import type { NotificationItem, NotificationMetadata } from '@/lib/api';

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

interface NotificationBellProps {
  userId: string | null | undefined;
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<FilterType>('unread');
  const { items, unreadCount, markRead, markAllRead } = useNotifications({ userId });

  const handleClickItem = (item: NotificationItem) => {
    void markRead(item.uid);
    const meta = parseNotificationMetadata(item.metadata);
    if (meta.classroom_uid) {
      setOpen(false);
      router.push(`/consumer/classroom/${meta.classroom_uid}`);
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    router.push('/consumer/notifications');
  };

  const filteredItems = filter === 'unread' ? items.filter((n) => !n.is_read) : items;
  const list = filteredItems.slice(0, 10);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label="Thông báo"
        >
          {unreadCount > 0 ? <BellRing size={18} strokeWidth={2.2} /> : <Bell size={18} strokeWidth={2.2} />}
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="z-[100] w-[400px] p-0 overflow-hidden rounded-2xl border border-border shadow-2xl"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-foreground">Thông báo</span>
            {unreadCount > 0 && (
              <Badge
                variant="default"
                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[11px] font-bold text-primary"
              >
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 px-5 pb-3">
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
              filter === 'unread'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/70',
            )}
          >
            Chưa đọc {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
              filter === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/70',
            )}
          >
            Tất cả
          </button>
        </div>

        <div className="h-px bg-border" />

        {/* List */}
        <div className="max-h-[420px] overflow-y-auto">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 px-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Inbox size={22} className="text-muted-foreground/60" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {list.map((item, index) => {
                const meta = parseNotificationMetadata(item.metadata);
                const hasLink = !!meta.classroom_uid;
                return (
                  <button
                    type="button"
                    key={`${item.uid}-${index}`}
                    onClick={() => handleClickItem(item)}
                    className={cn(
                      'relative flex items-start gap-3 mx-2 px-3 py-3 rounded-xl cursor-pointer transition-colors w-full text-left',
                      !item.is_read
                        ? 'bg-primary/5 hover:bg-primary/10'
                        : 'hover:bg-muted',
                    )}
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                        !item.is_read ? 'bg-primary/15' : 'bg-muted',
                      )}
                    >
                      <Bell
                        size={16}
                        className={!item.is_read ? 'text-primary' : 'text-muted-foreground/60'}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-[13px] leading-snug line-clamp-1',
                          !item.is_read ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground',
                        )}
                      >
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {item.content}
                      </p>
                      {item.created_at && (
                        <p
                          className={cn(
                            'mt-1 text-[11px] font-medium',
                            !item.is_read ? 'text-primary' : 'text-muted-foreground/60',
                          )}
                        >
                          {relativeTime(item.created_at)}
                          {hasLink && (
                            <span className="ml-2 text-primary font-semibold">· Xem lớp →</span>
                          )}
                        </p>
                      )}
                    </div>
                    {!item.is_read && (
                      <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <>
            <div className="h-px bg-border" />
            <button
              type="button"
              onClick={handleViewAll}
              className="w-full py-3 text-xs font-semibold text-primary hover:text-primary/80 hover:bg-muted transition-colors"
            >
              Xem tất cả thông báo →
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
