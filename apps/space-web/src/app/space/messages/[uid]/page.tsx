'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { WorkspaceShell } from '@/components/WorkspaceShell';
import { ChatPanel } from '@/components/ChatPanel';
import { MessageInput } from '@/components/MessageInput';
import { communityApi, type WorkspaceMessage, type DirectConversation } from '@/lib/api/community';
import { getWebSocketBaseUrl } from '@/lib/api/runtime-url';
import type { RootState } from '@/lib/redux/store';

export default function DirectChatPage() {
  const params = useParams();
  const router = useRouter();
  const targetUid = String(params?.uid ?? '');
  const currentUser = useSelector((s: RootState) => s.user.profile);

  const [conv, setConv] = useState<DirectConversation | null>(null);
  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef(0);

  useEffect(() => {
    if (!targetUid) return;
    let mounted = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    (async () => {
      try {
        const { conversation_uid } = await communityApi.getOrCreateDirect(targetUid);
        if (!mounted) return;
        setConv({
          conversation_uid,
          other_user: { uid: targetUid, name: '', avatar: '', last_seen_at: null },
          last_msg: null,
          unread_count: 0,
          created_at: null,
        });
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/chat/messages/?conversation_uid=${conversation_uid}&limit=50`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
            },
          }
        );
        const data = await res.json();
        if (mounted && Array.isArray(data.results)) {
          setMessages(data.results);
          if (data.results.length > 0) {
            communityApi.markConversationSeen(conversation_uid, data.results[data.results.length - 1].uid).catch(() => {});
          }
        }
      } catch {
        toast.error('Không thể mở cuộc trò chuyện');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [targetUid]);

  useEffect(() => {
    if (!conv?.conversation_uid) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const connect = () => {
      setStatus('connecting');
      const wsBase = getWebSocketBaseUrl();
      const ws = new WebSocket(`${wsBase}/ws/chat/${conv.conversation_uid}/?token=${token}`);
      wsRef.current = ws;
      ws.onopen = () => { setStatus('connected'); reconnectRef.current = 0; };
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'chat_message') {
            setMessages((prev) => prev.some((m) => m.uid === data.uid) ? prev : [...prev, data]);
            if (data.sender_id !== currentUser?.uid) {
              communityApi.markConversationSeen(conv.conversation_uid, data.uid).catch(() => {});
            }
          }
        } catch {}
      };
      ws.onerror = () => setStatus('error');
      ws.onclose = (e) => {
        setStatus('disconnected');
        if (e.code === 4001 || e.code === 1000) return;
        if (reconnectRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectRef.current), 30000);
          setTimeout(() => { reconnectRef.current++; connect(); }, delay);
        }
      };
    };
    connect();
    return () => { wsRef.current?.close(1000); };
  }, [conv?.conversation_uid, currentUser?.uid]);

  const handleSend = async (payload: { content: string; attachment_url?: string }) => {
    if (!conv?.conversation_uid) return;
    try {
      const msg = await communityApi.sendMessageHTTP({
        conversation_uid: conv.conversation_uid,
        content: payload.content,
        msg_type: payload.attachment_url ? 'image' : 'text',
        resource_url: payload.attachment_url,
        resource_name: '',
        resource_size: 0,
      });
      setMessages((prev) => prev.some((m) => m.uid === msg.uid) ? prev : [...prev, msg]);
    } catch {
      toast.error('Gửi tin nhắn thất bại');
    }
  };

  return (
    <WorkspaceShell>
      <div className="max-w-[75vw] mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[calc(100vh-160px)]">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3">
            <button
              onClick={() => router.push('/space/messages')}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[14px] text-slate-900 truncate">
                {conv?.other_user.name || 'Đang tải...'}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Đang tải cuộc trò chuyện...
            </div>
          ) : (
            <>
              <ChatPanel
                conversationUid={conv?.conversation_uid || ''}
                messages={messages}
                currentUserId={currentUser?.uid ?? null}
                status={status}
              />
              <MessageInput onSend={handleSend} disabled={!conv} />
            </>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
