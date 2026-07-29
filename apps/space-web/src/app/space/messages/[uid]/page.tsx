'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@shared/components/ui/button';
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
  const [workspaceOwnerId, setWorkspaceOwnerId] = useState<string | null>(null);

  const [conv, setConv] = useState<DirectConversation | null>(null);
  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    communityApi
      .getMyProfile()
      .then((p) => {
        if (mounted) setWorkspaceOwnerId(p?.owner_id ?? null);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!targetUid) return;
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const lookup = await communityApi.lookupDirectByTarget(targetUid).catch(() => null);
        if (lookup?.conversation_uid) {
          if (mounted) {
            router.replace(`/space/messages/c/${lookup.conversation_uid}`);
          }
          return;
        }

        const { conversation_uid } = await communityApi.getOrCreateDirect(targetUid);
        if (!mounted) return;
        router.replace(`/space/messages/c/${conversation_uid}`);
      } catch {
        toast.error('Không thể mở cuộc trò chuyện');
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [targetUid, router]);

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
            <Button
              onClick={() => router.push('/space/messages')}
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
            >
              <ArrowLeft size={18} />
            </Button>
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
                currentUserId={currentUser?.uid ?? workspaceOwnerId}
                currentUserPid={(currentUser as any)?.pid ?? workspaceOwnerId}
                status={status}
              />
              <MessageInput onSend={handleSend} disabled={!conv} conversationUid={conv?.conversation_uid} />
            </>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
