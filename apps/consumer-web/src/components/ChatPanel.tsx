'use client';

import { Check, Image as ImageIcon, Loader2, Wifi, WifiOff } from 'lucide-react';
import type { WorkspaceMessage } from '@/lib/api/community';
import { useEffect, useMemo, useRef } from 'react';

type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type Props = {
  conversationUid: string;
  messages: WorkspaceMessage[];
  currentUserId: string | null;
  currentUserPid?: string | null;
  currentUserName?: string | null;
  currentUserUsername?: string | null;
  status: WsStatus;
};

function formatTime(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function formatDayLabel(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (sameDay(d, today)) return 'Hôm nay';
    if (sameDay(d, yesterday)) return 'Hôm qua';
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return ''; }
}

function StatusIcon({ status }: { status: WsStatus }) {
  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Online
      </span>
    );
  }
  if (status === 'connecting') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
        <Loader2 size={10} className="animate-spin" /> Đang kết nối
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500">
      <WifiOff size={10} /> Mất kết nối
    </span>
  );
}

function MessageStatus() {
  return (
    <span className="inline-flex items-center text-indigo-200/80">
      <Check size={12} strokeWidth={2.5} />
    </span>
  );
}

function Avatar({ name, url, side }: { name: string; url?: string; side: 'left' | 'right' }) {
  const initials = (name || '?').trim().slice(0, 1).toUpperCase();
  const palette = [
    'from-indigo-500 to-violet-500',
    'from-emerald-500 to-teal-500',
    'from-rose-500 to-pink-500',
    'from-amber-500 to-orange-500',
    'from-sky-500 to-cyan-500',
    'from-fuchsia-500 to-purple-500',
  ];
  const grad = palette[(name?.charCodeAt(0) ?? 0) % palette.length];

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="w-7 h-7 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0"
      />
    );
  }
  return (
    <div
      className={`w-7 h-7 rounded-full bg-gradient-to-br ${grad} text-white text-xs font-bold flex items-center justify-center ring-2 ring-white shadow-sm shrink-0`}
    >
      {initials}
    </div>
  );
}

export function ChatPanel({
  conversationUid,
  messages,
  currentUserId,
  currentUserPid,
  currentUserName,
  currentUserUsername,
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

  const isMine = (m: WorkspaceMessage): boolean => {
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
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white/80 backdrop-blur">
        <StatusIcon status={status} />
        <span className="font-mono text-[10px] text-slate-400">#{conversationUid.slice(0, 8)}</span>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-slate-50/60 to-white"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm gap-2">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
              <ImageIcon size={22} className="text-indigo-400" />
            </div>
            <p className="font-medium text-slate-500">Chưa có tin nhắn nào</p>
            <p className="text-xs">Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện</p>
          </div>
        ) : (
          grouped.map((group, gi) => (
            <div key={gi} className="space-y-2">
              <div className="flex items-center justify-center">
                <span className="px-3 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 rounded-full uppercase tracking-wide">
                  {group.day}
                </span>
              </div>
              {group.items.map((m, i) => {
                const me = isMine(m);
                const prev = group.items[i - 1];
                const next = group.items[i + 1];
                const isFirstInGroup = !prev || isMine(prev) !== me;
                const isLastInGroup = !next || isMine(next) !== me;

                const bubbleRadius = me
                  ? `rounded-2xl ${isLastInGroup ? 'rounded-bl-md' : 'rounded-bl-2xl'} ${isFirstInGroup ? 'rounded-tl-md' : 'rounded-tl-2xl'}`
                  : `rounded-2xl ${isLastInGroup ? 'rounded-br-md' : 'rounded-br-2xl'} ${isFirstInGroup ? 'rounded-tr-md' : 'rounded-tr-2xl'}`;

                return (
                  <div
                    key={m.uid}
                    className={`flex items-end gap-2 ${me ? 'justify-start' : 'justify-end'}`}
                  >
                    {me && (
                      <div className="w-7 shrink-0">
                        {isLastInGroup && <Avatar name="Bạn" side="left" />}
                      </div>
                    )}

                    <div className={`max-w-[75%] sm:max-w-[65%] flex flex-col ${me ? 'items-start' : 'items-end'}`}>
                      {!me && isFirstInGroup && m.sender_name && (
                        <span className="text-[11px] font-semibold text-slate-600 mb-0.5 px-1">
                          {m.sender_name}
                        </span>
                      )}

                      <div
                        className={
                          me
                            ? `bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 ${bubbleRadius} px-3.5 py-2`
                            : `bg-white border border-slate-200 text-slate-900 shadow-sm ${bubbleRadius} px-3.5 py-2`
                        }
                      >
                        {m.attachment?.url && (
                          <a
                            href={m.attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block mb-1.5 -mx-1 -mt-1"
                          >
                            <img
                              src={m.attachment.url}
                              alt={m.attachment.name}
                              className="max-w-[260px] max-h-[220px] object-cover rounded-lg"
                              loading="lazy"
                            />
                          </a>
                        )}
                        {m.content && (
                          <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                            {m.content}
                          </p>
                        )}
                      </div>

                      <div className={`flex items-center gap-1 mt-0.5 px-1 ${me ? '' : 'flex-row-reverse'}`}>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatTime(m.created_at)}
                        </span>
                        {me && <MessageStatus />}
                      </div>
                    </div>

                    {!me && (
                      <div className="w-7 shrink-0">
                        {isLastInGroup && <Avatar name={m.sender_name || '?'} side="right" />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
