'use client';

import * as React from 'react';
import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  Paperclip,
  SendHorizontal,
  FileText,
  Download,
  X,
  Loader2,
  Users,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { toast } from 'sonner';
import { chatApi } from '@/lib/api/chat';
import { useChatWebSocket } from '@/lib/hooks/use-chat-websocket';
import { formatTime } from '@shared/lib/datetime';
import type { ChatMessage, ChatAttachment, MsgType } from '@/lib/api/types';

interface Props {
  conversationUid: string;
  classroomUid: string;
  active: boolean;
}

interface UserProfile {
  uid: string;
  full_name: string;
  email: string;
}

function getUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('userProfile');
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getAcceptedTypes(): string {
  return 'image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip';
}

function detectMsgType(file: File): MsgType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type === 'application/pdf') return 'pdf';
  return 'file';
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'connected') {
    return (
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-[10px] font-bold text-muted-foreground uppercase">Trực tuyến</span>
      </div>
    );
  }
  if (status === 'connecting') {
    return (
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-[10px] font-bold text-amber-500 uppercase">Đang kết nối...</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
      <span className="text-[10px] font-bold text-rose-400 uppercase">Mất kết nối</span>
    </div>
  );
}

function AttachmentView({
  attachment,
  isMe,
}: {
  attachment: ChatAttachment;
  isMe: boolean;
}) {
  if (attachment.type === 'image') {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-w-[280px] max-h-[200px] object-cover w-full"
        />
      </a>
    );
  }
  if (attachment.type === 'video') {
    return (
      <video controls className="max-w-[280px] w-full" preload="metadata">
        <source src={attachment.url} />
      </video>
    );
  }
  if (attachment.type === 'audio') {
    return (
      <div className="px-4 py-3">
        <audio controls className="w-full max-w-[240px]">
          <source src={attachment.url} />
        </audio>
      </div>
    );
  }
  // pdf | file
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 px-4 py-3 ${
        isMe ? 'hover:bg-primary-brand' : 'hover:bg-muted'
      } transition-colors`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          isMe ? 'bg-primary-brand' : 'bg-muted'
        }`}
      >
        <FileText
          size={20}
          className={isMe ? 'text-primary-brand-muted' : 'text-muted-foreground'}
        />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-bold truncate max-w-[160px]">
          {attachment.name}
        </div>
        <div
          className={`text-[10px] font-bold uppercase ${
            isMe ? 'text-primary-brand-muted' : 'text-muted-foreground'
          }`}
        >
          {attachment.size ? formatFileSize(attachment.size) : ''}
        </div>
      </div>
      <Download
        size={16}
        className={`shrink-0 ${isMe ? 'text-primary-brand-muted' : 'text-muted-foreground'}`}
      />
    </a>
  );
}

function MessageBubble({
  msg,
  currentUserId,
}: {
  msg: ChatMessage;
  currentUserId: string | null;
}) {
  const isMe = !!currentUserId && msg.sender_id === currentUserId;
  const timeStr = msg.created_at ? formatTime(msg.created_at) : '';

  const initials = msg.sender_name
    ? msg.sender_name.slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
      {!isMe && (
        <div className="flex items-center gap-2 mb-1 ml-1">
          <div className="w-5 h-5 rounded-full bg-muted text-[8px] font-bold flex items-center justify-center">
            {initials}
          </div>
          <span className="text-[10px] font-bold text-muted-foreground">
            {msg.sender_name}
          </span>
        </div>
      )}
      <div
        className={`max-w-[70%] rounded-2xl text-sm font-medium shadow-sm overflow-hidden ${
          isMe
            ? 'bg-primary-brand text-white rounded-br-none'
            : 'bg-card border border-border text-foreground rounded-bl-none'
        }`}
      >
        {msg.attachment && (
          <AttachmentView attachment={msg.attachment} isMe={isMe} />
        )}
        {msg.content ? (
          <div className="px-4 py-3">{msg.content}</div>
        ) : null}
      </div>
      <div className="text-[9px] font-bold text-muted-foreground mt-1.5 px-1 uppercase">
        {timeStr}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export default function ClassroomChatPanel({
  conversationUid,
  active,
}: Props) {
  const profile = getUserProfile();
  const currentUserId = profile?.uid ?? null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [pendingFile, setPendingFile] = useState<{
    file: File;
    preview: string | null;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSendingRef = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);

  // ── Load history ──────────────────────────
  useEffect(() => {
    if (!conversationUid || historyLoaded) return;
    chatApi
      .getMessages(conversationUid, 30)
      .then((res) => {
        setMessages(res.results);
        setHasMore(res.has_more);
        setHistoryLoaded(true);
      })
      .catch(() => {
        toast.error('Không thể tải lịch sử tin nhắn');
        setHistoryLoaded(true);
      });
  }, [conversationUid, historyLoaded]);

  // ── Auto-scroll to bottom ─────────────────
  useEffect(() => {
    if (!active || !messagesAreaRef.current) return;
    const el = messagesAreaRef.current;
    el.scrollTop = el.scrollHeight;
  }, [messages, active]);

  // ── WS callbacks ─────────────────────────
  const handleIncomingMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.uid === msg.uid)) return prev;
      return [...prev, msg];
    });
  }, []);

  const handleTyping = useCallback(
    (senderName: string, isTyping: boolean) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.includes(senderName) ? prev : [...prev, senderName];
        }
        return prev.filter((n) => n !== senderName);
      });
    },
    []
  );

  const handleReconnect = useCallback(() => {
    toast.info('Đang kết nối lại...');
  }, []);

  const { status, sendMessage } = useChatWebSocket({
    conversationUid,
    enabled: active,
    onMessage: handleIncomingMessage,
    onTyping: handleTyping,
    onReconnect: handleReconnect,
  });

  // ── Typing indicator ──────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    sendMessage({ type: 'typing_start' });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      sendMessage({ type: 'typing_stop' });
    }, 2000);
  };

  // ── Load more (scroll to top) ─────────────
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    const oldestUid = messages[0].uid;
    try {
      const res = await chatApi.getMessagesBefore(conversationUid, oldestUid, 30);
      setMessages((prev) => [...res.results, ...prev]);
      setHasMore(res.has_more);
    } catch {
      toast.error('Không thể tải thêm tin nhắn');
    } finally {
      setLoadingMore(false);
    }
  }, [conversationUid, hasMore, loadingMore, messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0 && hasMore && !loadingMore) {
      loadMoreMessages();
    }
  };

  // ── File select ───────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const preview = isImage ? URL.createObjectURL(file) : null;
    setPendingFile({ file, preview });
    e.target.value = '';
  };

  const handleRemovePendingFile = () => {
    if (pendingFile?.preview) URL.revokeObjectURL(pendingFile.preview);
    setPendingFile(null);
  };

  // ── Upload helper ─────────────────────────
  const uploadFile = async (
    file: File
  ): Promise<{
    uid: string;
    url: string;
    name: string;
    size: number;
    type: MsgType;
  }> => {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const formData = new FormData();
    formData.append('file', file);
    formData.append(
      'metadata',
      JSON.stringify({ context: 'chat', conversation_uid: conversationUid })
    );
    formData.append('owner_id', conversationUid);
    formData.append('owner_type', 'conversation');

    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${apiBase}/api/v1/resource/upload/`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as Record<string, unknown>;
      throw new Error(
        (err.message as string) || (err.detail as string) || 'Upload thất bại'
      );
    }
    const data = await res.json() as {
      uid: string;
      url: string;
      name: string;
      size: number;
      file_type: string;
    };
    return {
      uid: data.uid,
      url: data.url,
      name: data.name,
      size: data.size,
      type: detectMsgType(file),
    };
  };

  // ── Send ──────────────────────────────────
  const handleSend = async () => {
    if (isSendingRef.current) return;
    if (!newMessage.trim() && !pendingFile) return;
    if (status !== 'connected') {
      toast.error('Chưa kết nối. Vui lòng thử lại.');
      return;
    }
    isSendingRef.current = true;
    setUploading(true);
    try {
      let attachment: ChatAttachment | undefined;

      if (pendingFile) {
        try {
          const uploaded = await uploadFile(pendingFile.file);
          attachment = {
            uid: uploaded.uid,
            url: uploaded.url,
            name: uploaded.name,
            size: uploaded.size,
            type: uploaded.type,
          };
        } catch (err: unknown) {
          toast.error(
            `Lỗi tải file: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
          return;
        } finally {
          if (pendingFile.preview) URL.revokeObjectURL(pendingFile.preview);
          setPendingFile(null);
        }
      }

      // Stop typing before send
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      sendMessage({ type: 'typing_stop' });

      sendMessage({
        type: 'chat_message',
        content: newMessage,
        attachment: attachment ?? null,
      });

      setNewMessage('');
    } finally {
      setUploading(false);
      isSendingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Render ────────────────────────────────
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 relative">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-brand-light flex items-center justify-center text-primary-brand">
            <Users size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">
              Kênh thảo luận chung
            </div>
            <StatusBadge status={status} />
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <MoreVertical size={20} />
        </Button>
      </div>

      {/* Messages area */}
      <div
        ref={messagesAreaRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/30"
      >
        {/* Load more indicator */}
        {loadingMore && (
          <div className="flex justify-center">
            <Loader2 size={18} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {/* History loading placeholder */}
        {!historyLoaded && (
          <div className="flex justify-center py-8">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        )}

        {historyLoaded && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm font-medium">
            Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
          </div>
        )}

        {messages.map((msg: ChatMessage) => (
          <MessageBubble
            key={msg.uid}
            msg={msg}
            currentUserId={currentUserId}
          />
        ))}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium italic">
            <div className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
            {typingUsers.join(', ')} đang nhập...
          </div>
        )}

      </div>

      {/* Input area */}
      <div className="p-4 bg-card border-t border-border">
        {/* Pending file preview */}
        {pendingFile && (
          <div className="mb-2 flex items-center gap-3 bg-muted border border-border rounded-xl px-3 py-2">
            {pendingFile.preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pendingFile.preview}
                alt="preview"
                className="w-12 h-12 rounded-lg object-cover border border-border"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                <FileText size={20} className="text-primary-brand" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-foreground truncate">
                {pendingFile.file.name}
              </div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase">
                {formatFileSize(pendingFile.file.size)}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemovePendingFile}
              className="h-7 w-7 text-muted-foreground hover:text-rose-500 rounded-lg"
            >
              <X size={14} />
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptedTypes()}
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="flex items-center gap-2 bg-muted p-2 rounded-2xl border border-border transition-all focus-within:border-primary-brand focus-within:ring-4 focus-within:ring-primary-brand/5 focus-within:bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className={`h-10 w-10 ${
              pendingFile
                ? 'text-primary-brand bg-primary-brand-light'
                : 'text-muted-foreground hover:text-primary-brand'
            }`}
            title="Đính kèm file"
          >
            <Paperclip size={20} />
          </Button>
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn thảo luận..."
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium px-2 h-10 text-foreground"
            disabled={uploading}
          />
          <Button
            onClick={handleSend}
            size="icon"
            disabled={(!newMessage.trim() && !pendingFile) || uploading}
            className="bg-primary-brand hover:bg-primary-brand-dark text-white rounded-xl h-10 w-10 shrink-0 shadow-lg shadow-primary-brand-light disabled:opacity-50 disabled:shadow-none"
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <SendHorizontal size={20} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
