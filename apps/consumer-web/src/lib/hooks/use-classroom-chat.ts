import { useEffect, useRef, useState, useCallback } from 'react';
import { classroomApi } from '@/lib/api';
import { getWebSocketBaseUrl } from '@/lib/api/runtime-url';
import type { Conversation, Message } from '@/lib/api/types';

const PAGE_SIZE = 10;

export function useClassroomChat(classroomUid: string | null) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  // Ref for the scrollable container — used to preserve scroll position on prepend
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Sentinel div at the very top of the message list — triggers loadMore on enter
  const topSentinelRef = useRef<HTMLDivElement>(null);
  // Keep conversation uid stable for WS without re-running the WS effect
  const convUidRef = useRef<string | null>(null);

  // Initial load
  useEffect(() => {
    if (!classroomUid) return;
    let cancelled = false;

    const init = async () => {
      try {
        setLoading(true);
        const conv = await classroomApi.getConversation(classroomUid);
        if (cancelled) return;
        convUidRef.current = conv.uid;
        setConversation(conv);

        const { results, has_more } = await classroomApi.getMessages(conv.uid, PAGE_SIZE);
        if (cancelled) return;
        setMessages(results);
        setHasMore(has_more);
      } catch {
        // page-level error handles this
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void init();
    return () => { cancelled = true; };
  }, [classroomUid]);

  // Load older messages — preserve scroll position
  const loadMore = useCallback(async () => {
    if (!convUidRef.current || !hasMore || loadingMore || messages.length === 0) return;
    const oldestUid = messages[0].uid;
    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    setLoadingMore(true);
    try {
      const { results, has_more } = await classroomApi.getMessages(convUidRef.current, PAGE_SIZE, oldestUid);
      setMessages((prev) => [...results, ...prev]);
      setHasMore(has_more);

      // After React re-renders with prepended messages, restore scroll position
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      });
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, messages]);

  // IntersectionObserver on the top sentinel → auto-trigger loadMore on scroll up
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void loadMore();
        }
      },
      { root: scrollContainerRef.current, threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // WebSocket
  useEffect(() => {
    if (!conversation) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;

    const wsBase = getWebSocketBaseUrl();
    const ws = new WebSocket(`${wsBase}/ws/chat/${conversation.uid}/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_message') {
          const msg: Message = {
            uid: data.uid,
            conversation_uid: data.conversation_uid,
            msg_type: data.msg_type,
            content: data.content ?? '',
            sender_id: data.sender_id ?? null,
            sender_type: data.sender_type ?? '',
            sender_name: data.sender_name ?? '',
            attachment: data.attachment ?? null,
            created_at: data.created_at,
          };
          setMessages((prev) => [...prev, msg]);
        }
      } catch {
        // ignore malformed frames
      }
    };

    return () => { ws.close(); wsRef.current = null; };
  }, [conversation?.uid]);

  const sendMessage = useCallback((content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'chat_message', content }));
  }, []);

  return {
    conversation,
    messages,
    hasMore,
    loadingMore,
    connected,
    loading,
    sendMessage,
    loadMore,
    scrollContainerRef,
    topSentinelRef,
  };
}
