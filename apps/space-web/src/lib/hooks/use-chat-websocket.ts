import { useEffect, useRef, useCallback, useState } from 'react';
import { getWebSocketBaseUrl } from '@/lib/api/runtime-url';
import type { ChatMessage } from '@/lib/api/types';

export type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface Options {
  conversationUid: string;
  enabled: boolean;
  onMessage: (msg: ChatMessage) => void;
  onTyping: (senderName: string, isTyping: boolean) => void;
  onReconnect: () => void;
}

export function useChatWebSocket({
  conversationUid,
  enabled,
  onMessage,
  onTyping,
  onReconnect,
}: Options) {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<WsStatus>('disconnected');
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCountRef = useRef(0);
  const MAX_RECONNECT = 5;

  // Keep latest callbacks in refs to avoid stale closures
  const onMessageRef = useRef(onMessage);
  const onTypingRef = useRef(onTyping);
  const onReconnectRef = useRef(onReconnect);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onTypingRef.current = onTyping; }, [onTyping]);
  useEffect(() => { onReconnectRef.current = onReconnect; }, [onReconnect]);

  const connect = useCallback(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token || !conversationUid) return;

    setStatus('connecting');
    const wsBase = getWebSocketBaseUrl();
    const ws = new WebSocket(
      `${wsBase}/ws/chat/${conversationUid}/?token=${token}`
    );
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      reconnectCountRef.current = 0;
    };

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as Record<string, unknown>;
        if (data.type === 'chat_message') {
          onMessageRef.current(data as unknown as ChatMessage);
        } else if (data.type === 'typing') {
          onTypingRef.current(
            data.sender_name as string,
            data.is_typing as boolean
          );
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => setStatus('error');

    ws.onclose = (e) => {
      setStatus('disconnected');
      wsRef.current = null;
      if (e.code === 4001) return; // unauthorized — do not retry
      if (e.code === 1000) return; // normal close
      const count = reconnectCountRef.current;
      if (count < MAX_RECONNECT) {
        const delay = Math.min(1000 * Math.pow(2, count), 30000);
        reconnectTimerRef.current = setTimeout(() => {
          reconnectCountRef.current += 1;
          connect();
          onReconnectRef.current();
        }, delay);
      }
    };
  }, [conversationUid]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (wsRef.current) {
      wsRef.current.close(1000, 'Tab switched');
      wsRef.current = null;
    }
    setStatus('disconnected');
    reconnectCountRef.current = 0;
  }, []);

  const sendMessage = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  useEffect(() => {
    if (enabled) connect();
    else disconnect();
    return () => disconnect();
  }, [enabled, connect, disconnect]);

  return { status, sendMessage };
}
