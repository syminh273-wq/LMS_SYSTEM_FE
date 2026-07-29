import { useState } from 'react';
import { getAiApiBase } from './aiHttp';
import type { AiToolCall } from './useAISessionHistory';

type AiMode = 'doc' | 'manage' | 'free';

export type AiAskStreamEvent =
  | { type: 'session_id'; session_id: string; transcript?: string }
  | { type: 'chunk'; text: string }
  | { type: 'tool_calls'; data: AiToolCall[] }
  | { type: 'sources'; data: Array<{ document: string; metadata: Record<string, string>; score: number }> }
  | { type: 'error'; message?: string };

export interface AskStreamParams {
  question?: string;
  audioBlob?: Blob;
  sessionId: string | null;
  mode: AiMode;
  onEvent: (event: AiAskStreamEvent) => void;
}

export interface UseAIAskStreamArgs {
  uid: string;
  t: (key: string) => string;
}

export interface UseAIAskStreamResult {
  askStream: (params: AskStreamParams) => Promise<void>;
  streaming: boolean;
}

// Wraps the single ask-stream SSE endpoint. Raw event types unrelated to message bookkeeping
// (audio autoplay) are handled here as a direct side effect of consuming this one response,
// rather than forwarded to the caller.
export function useAIAskStream({ uid, t }: UseAIAskStreamArgs): UseAIAskStreamResult {
  const [streaming, setStreaming] = useState(false);

  const askStream = async ({ question, audioBlob, sessionId, mode, onEvent }: AskStreamParams) => {
    setStreaming(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

      const body = new FormData();
      if (audioBlob) {
        body.append('audio', audioBlob, 'voice.webm');
      } else {
        body.append('question', question ?? '');
      }
      body.append('session_id', sessionId || '');
      body.append('mode', mode);

      const res = await fetch(`${getAiApiBase()}/api/v1/space/course/classrooms/${uid}/ask-stream/`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
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
            const event = JSON.parse(raw) as {
              type: string;
              text?: string;
              data?: unknown;
              message?: string;
              session_id?: string;
              transcript?: string;
              audio?: string;
            };
            if (event.type === 'audio' && event.audio) {
              const audio = new Audio(`data:audio/mpeg;base64,${event.audio}`);
              void audio.play().catch((e) => console.error('Audio play failed', e));
              continue;
            }
            if (event.type === 'session_id') {
              onEvent({ type: 'session_id', session_id: event.session_id as string, transcript: event.transcript });
            } else if (event.type === 'chunk' && event.text) {
              onEvent({ type: 'chunk', text: event.text });
            } else if (event.type === 'tool_calls') {
              onEvent({ type: 'tool_calls', data: event.data as AiToolCall[] });
            } else if (event.type === 'sources') {
              onEvent({ type: 'sources', data: event.data as Array<{ document: string; metadata: Record<string, string>; score: number }> });
            } else if (event.type === 'error') {
              onEvent({ type: 'error', message: event.message });
            }
          } catch { /* ignore malformed SSE lines */ }
        }
      }
    } catch (err: unknown) {
      onEvent({ type: 'error', message: err instanceof Error ? err.message : t('classroom.ui.ai_error_generic') });
    } finally {
      setStreaming(false);
    }
  };

  return { askStream, streaming };
}

export default useAIAskStream;
