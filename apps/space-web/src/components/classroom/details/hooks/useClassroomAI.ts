import * as React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, Users, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

type AiMode = 'doc' | 'manage' | 'free';
type AiToolCall = { tool: string; args: Record<string, unknown>; result: string };
type AiMessage = { role: 'user' | 'assistant'; text: string; loading?: boolean; sources?: Array<{ document: string; metadata: Record<string, string>; score: number }>; tool_calls?: AiToolCall[] };

export interface UseClassroomAIArgs {
  uid: string;
  activeTab: string;
  t: (key: string) => string;
}

export interface UseClassroomAIResult {
  aiMessages: AiMessage[];
  setAiMessages: React.Dispatch<React.SetStateAction<AiMessage[]>>;
  aiQuestion: string;
  setAiQuestion: React.Dispatch<React.SetStateAction<string>>;
  aiMode: AiMode;
  setAiMode: React.Dispatch<React.SetStateAction<AiMode>>;
  aiLoading: boolean;
  aiSessionId: string | null;
  setAiSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aiSessions: any[];
  aiScrollRef: React.RefObject<HTMLDivElement | null>;
  isRecording: boolean;
  AI_MODES: { key: AiMode; label: string; icon: React.ElementType; placeholder: string; description: string }[];
  createNewAiSession: () => Promise<void>;
  clearAiSession: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  handleAiAsk: (audioBlob?: Blob) => Promise<void>;
}

export function useClassroomAI({
  uid,
  activeTab,
  t,
}: UseClassroomAIArgs): UseClassroomAIResult {
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiMode, setAiMode] = useState<AiMode>('doc');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [aiSessions, setAiSessions] = useState<any[]>([]);
  const aiScrollRef = useRef<HTMLDivElement>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const AI_MODES: { key: AiMode; label: string; icon: React.ElementType; placeholder: string; description: string }[] = [
    { key: 'doc',    label: t('classroom.ui.ai_mode_doc_label'),    icon: BookOpen,    placeholder: t('classroom.ui.ai_mode_doc_placeholder'),    description: t('classroom.ui.ai_mode_doc_desc') },
    { key: 'manage', label: t('classroom.ui.ai_mode_manage_label'), icon: Users,       placeholder: t('classroom.ui.ai_mode_manage_placeholder'), description: t('classroom.ui.ai_mode_manage_desc') },
    { key: 'free',   label: t('classroom.ui.ai_mode_free_label'),   icon: Sparkles,    placeholder: t('classroom.ui.ai_mode_free_placeholder'),   description: t('classroom.ui.ai_mode_free_desc') },
  ];

  const fetchAiSessions = useCallback(async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${apiBase}/api/v1/space/course/classrooms/${uid}/ai-sessions/`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAiSessions(data);
        if (!aiSessionId && data.length > 0) {
          setAiSessionId(data[0].session_id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch AI sessions', err);
    }
  }, [uid, aiSessionId]);

  const fetchAiHistory = useCallback(async (sid: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${apiBase}/api/v1/space/course/classrooms/${uid}/ai-session/history/?session_id=${sid}`, { headers });
      if (res.ok) {
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAiMessages(data.messages.map((m: any) => ({
          role: m.role,
          text: m.content,
          loading: false
        })));
      }
    } catch (err) {
      console.error('Failed to fetch AI history', err);
    }
  }, [uid]);

  const createNewAiSession = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${apiBase}/api/v1/space/course/classrooms/${uid}/ai-session/`, {
        method: 'POST',
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        setAiSessionId(data.session_id);
        void fetchAiSessions();
      }
    } catch (err) {
      toast.error(t('classroom.ui.ai_create_session_error'));
    }
  };

  const clearAiSession = async () => {
    if (!aiSessionId) return;
    if (!window.confirm(t('classroom.ui.ai_delete_confirm'))) return;
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${apiBase}/api/v1/space/course/classrooms/${uid}/ai-session/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ session_id: aiSessionId }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSessionId(data.session_id);
        void fetchAiSessions();
      }
    } catch (err) {
      toast.error(t('classroom.ui.ai_delete_session_error'));
    }
  };

  useEffect(() => {
    if (activeTab === 'ai') {
      void fetchAiSessions();
    }
  }, [activeTab, fetchAiSessions]);

  useEffect(() => {
    if (aiSessionId) {
      void fetchAiHistory(aiSessionId);
    } else {
      setAiMessages([]);
    }
  }, [aiSessionId, fetchAiHistory]);

  // Auto-scroll AI chat to bottom on new messages
  useEffect(() => {
    if (aiScrollRef.current) {
      aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
    }
  }, [aiMessages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        void handleAiAsk(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast.error(t('classroom.ui.ai_mic_error'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  const handleAiAsk = async (audioBlob?: Blob) => {
    if ((!aiQuestion.trim() && !audioBlob) || aiLoading) return;
    const question = aiQuestion.trim();
    setAiQuestion('');
    setAiLoading(true);

    if (question) {
      setAiMessages(prev => [...prev, { role: 'user', text: question }, { role: 'assistant', text: '', loading: true }]);
    } else {
      setAiMessages(prev => [...prev, { role: 'user', text: '🎤 [Tin nhắn thoại]' }, { role: 'assistant', text: '', loading: true }]);
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      const body = new FormData();
      if (audioBlob) {
        body.append('audio', audioBlob, 'voice.webm');
      } else {
        body.append('question', question);
      }
      body.append('session_id', aiSessionId || '');
      body.append('mode', aiMode);

      const res = await fetch(`${apiBase}/api/v1/space/course/classrooms/${uid}/ask-stream/`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: body,
      });

      if (!res.ok || !res.body) throw new Error(t('classroom.ui.ai_connect_error'));

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break;
          try {
            const event = JSON.parse(raw) as { type: string; text?: string; data?: AiMessage['sources'] | AiToolCall[]; message?: string; session_id?: string; transcript?: string; audio?: string };
            if (event.type === 'session_id') {
              if (event.transcript) {
                setAiMessages(prev => {
                  const lastUser = prev[prev.length - 2];
                  if (lastUser && lastUser.text === '🎤 [Tin nhắn thoại]') {
                    return [...prev.slice(0, -2), { ...lastUser, text: `🎤 ${event.transcript}` }, prev[prev.length - 1]];
                  }
                  return prev;
                });
              }
              if (!aiSessionId || aiSessionId !== event.session_id) {
                setAiSessionId(event.session_id as string);
                void fetchAiSessions();
              }
            } else if (event.type === 'chunk' && event.text) {
              setAiMessages(prev => {
                const last = prev[prev.length - 1];
                const next = (last.text + event.text!).replace(/\n{3,}/g, '\n\n');
                return [...prev.slice(0, -1), { ...last, loading: false, text: next }];
              });
            } else if (event.type === 'tool_calls') {
              setAiMessages(prev => {
                const last = prev[prev.length - 1];
                return [...prev.slice(0, -1), { ...last, tool_calls: event.data as AiToolCall[] }];
              });
            } else if (event.type === 'sources') {
              setAiMessages(prev => {
                const last = prev[prev.length - 1];
                return [...prev.slice(0, -1), { ...last, loading: false, sources: event.data as AiMessage['sources'] }];
              });
            } else if (event.type === 'audio' && event.audio) {
              const audio = new Audio(`data:audio/mpeg;base64,${event.audio}`);
              void audio.play().catch(e => console.error('Audio play failed', e));
            } else if (event.type === 'error') {
              setAiMessages(prev => {
                const last = prev[prev.length - 1];
                return [...prev.slice(0, -1), { ...last, loading: false, text: event.message ?? t('classroom.ui.ai_error_generic') }];
              });
            }
          } catch { /* ignore malformed SSE lines */ }
        }
      }
      // Ensure loading cleared
      setAiMessages(prev => {
        const last = prev[prev.length - 1];
        return last.loading ? [...prev.slice(0, -1), { ...last, loading: false }] : prev;
      });
    } catch (err: unknown) {
      setAiMessages(prev => {
        const last = prev[prev.length - 1];
        return last ? [...prev.slice(0, -1), {
          ...last,
          loading: false,
          text: err instanceof Error ? err.message : t('classroom.ui.ai_error_generic'),
        }] : prev;
      });
    } finally {
      setAiLoading(false);
    }
  };

  return {
    aiMessages,
    setAiMessages,
    aiQuestion,
    setAiQuestion,
    aiMode,
    setAiMode,
    aiLoading,
    aiSessionId,
    setAiSessionId,
    aiSessions,
    aiScrollRef,
    isRecording,
    AI_MODES,
    createNewAiSession,
    clearAiSession,
    startRecording,
    stopRecording,
    handleAiAsk,
  };
}

export default useClassroomAI;
