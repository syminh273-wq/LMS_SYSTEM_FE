'use client';

import { Check, Image as ImageIcon, Loader2, WifiOff } from 'lucide-react';
import type { WorkspaceMessage } from '@/lib/api/community';
import { useEffect, useMemo, useRef } from 'react';
import {
  Message,
  MessageAvatarImage,
  MessageContent,
  Bubble,
  BubbleContent,
  BubbleMeta,
} from '@shared/components/ui/message';

type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type Props = {
  conversationUid: string;
  messages: WorkspaceMessage[];
  currentUserId: string | null;
  currentUserPid?: string | null;
  status: WsStatus;
};

function formatTime(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatDayLabel(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    if (sameDay(d, today)) return 'Hôm nay';
    if (sameDay(d, yesterday)) return 'Hôm qua';
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '';
  }
}

function StatusBadge({ status }: { status: WsStatus }) {
  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success">
        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
        Online
      </span>
    );
  }
  if (status === 'connecting') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-warning">
        <Loader2 size={10} className="animate-spin" /> Đang kết nối
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-destructive">
      <WifiOff size={10} /> Mất kết nối
    </span>
  );
}

export function ChatPanel({
  conversationUid,
  messages,
  currentUserId,
  currentUserPid,
  status,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(messages.length);

  useEffect(() => {
    if (scrollRef.current && messages.length !== lastCountRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      lastCountRef.current = messages.length;
    }
  }, [messages.length]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [conversationUid]);

  const isMine = (m: WorkspaceMessage) => {
    if (m.is_mine === true) return true;
    if (m.is_mine === false) return false;
    if (!m.sender_id) return false;
    if (currentUserId && m.sender_id === currentUserId) return true;
    if (currentUserPid && m.sender_id === currentUserPid) return true;
    if (currentUserId && m.sender_id.includes(currentUserId)) return true;
    if (currentUserPid && m.sender_id.includes(currentUserPid)) return true;
    return false;
  };

  const grouped = useMemo(() => {
    const out: Array<{ day: string; items: WorkspaceMessage[] }> = [];
    let currentDay = '';
    for (const m of messages) {
      const day = formatDayLabel(m.created_at);
      if (day !== currentDay) {
        out.push({ day, items: [m] });
        currentDay = day;
      } else {
        out[out.length - 1].items.push(m);
      }
    }
    return out;
  }, [messages]);

  return (
    <div className="flex flex-1 min-h-0 flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border bg-background/80 px-4 py-2 text-xs text-muted-foreground backdrop-blur">
        <StatusBadge status={status} />
        <span className="font-mono text-[10px] text-muted-foreground">#{conversationUid.slice(0, 8)}</span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-6 overflow-y-auto bg-muted/30 px-4 py-6"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ImageIcon size={22} />
            </div>
            <p className="font-medium text-foreground">Chưa có tin nhắn nào</p>
            <p className="text-xs">Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện</p>
          </div>
        ) : (
          grouped.map((group, gi) => (
            <div key={gi} className="space-y-3">
              <div className="flex items-center justify-center">
                <span className="rounded-full bg-muted px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.day}
                </span>
              </div>
              {group.items.map((m) => {
                const me = isMine(m);
                const senderLabel = me ? 'Bạn' : m.sender_name || 'Ẩn danh';

                return (
                  <Message key={m.uid} from={me ? 'user' : 'assistant'} align={me ? 'left' : 'right'}>
                    <MessageAvatarImage
                      src={m.sender_avatar ?? undefined}
                      alt={senderLabel}
                      fallback={senderLabel}
                    />
                    <MessageContent>
                      {!me && m.sender_name && (
                        <span className="px-1 text-[11px] font-semibold text-muted-foreground">
                          {m.sender_name}
                        </span>
                      )}
                      <Bubble
                        variant={me ? 'primary' : 'card'}
                        size="md"
                        className={me ? 'rounded-bl-md' : 'rounded-br-md'}
                      >
                        <BubbleContent>
                          {m.attachment?.url && (
                            <a
                              href={m.attachment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="block"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={m.attachment.url}
                                alt={m.attachment.name}
                                className="max-h-[220px] max-w-[260px] rounded-lg object-cover"
                                loading="lazy"
                              />
                            </a>
                          )}
                          {m.content && <p className="leading-relaxed">{m.content}</p>}
                        </BubbleContent>
                      </Bubble>
                      <BubbleMeta className={me ? 'justify-start' : 'justify-end'}>
                        <span>{formatTime(m.created_at)}</span>
                        {me && (
                          <span className="inline-flex items-center text-primary/80">
                            <Check size={12} strokeWidth={2.5} />
                          </span>
                        )}
                      </BubbleMeta>
                    </MessageContent>
                  </Message>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
