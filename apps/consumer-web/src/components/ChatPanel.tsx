'use client';

import { Loader2, Wifi, WifiOff } from 'lucide-react';
import type { WorkspaceMessage } from '@/lib/api/community';
import { useEffect, useRef } from 'react';

type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type Props = {
  conversationUid: string;
  messages: WorkspaceMessage[];
  currentUserId: string | null;
  status: WsStatus;
};

function formatTime(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

function StatusIcon({ status }: { status: WsStatus }) {
  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
        <Wifi size={10} /> Online
      </span>
    );
  }
  if (status === 'connecting') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
        <Loader2 size={10} className="animate-spin" /> Connecting
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500">
      <WifiOff size={10} /> Offline
    </span>
  );
}

export function ChatPanel({ conversationUid, messages, currentUserId, status }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-card">
      <div className="px-4 py-2 border-b border-border flex items-center justify-between text-xs text-muted-foreground">
        <StatusIcon status={status} />
        <span className="font-mono text-[10px]">{conversationUid.slice(0, 8)}</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
            Hãy gửi tin nhắn đầu tiên
          </div>
        ) : (
          messages.map((m) => {
            const isMe = !!currentUserId && m.sender_id === currentUserId;
            return (
              <div key={m.uid} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && m.sender_name && (
                    <span className="text-[10px] font-bold text-muted-foreground mb-0.5 px-1">
                      {m.sender_name}
                    </span>
                  )}
                  <div
                    className={
                      isMe
                        ? 'bg-indigo-600 text-white rounded-2xl rounded-br-md px-3.5 py-2 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-md px-3.5 py-2 shadow-sm'
                    }
                  >
                    {m.attachment?.url && (
                      <a href={m.attachment.url} target="_blank" rel="noreferrer" className="block mb-1">
                        <img src={m.attachment.url} alt={m.attachment.name} className="max-w-[240px] max-h-[200px] object-cover rounded-lg" />
                      </a>
                    )}
                    {m.content && (
                      <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-0.5 px-1">
                    {formatTime(m.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
