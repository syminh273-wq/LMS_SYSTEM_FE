import { useState, useCallback } from 'react';
import { getAiApiBase, getAiAuthHeaders } from './aiHttp';

export type AiToolCall = { tool: string; args: Record<string, unknown>; result: string };
export type AiMessage = {
  role: 'user' | 'assistant';
  text: string;
  loading?: boolean;
  sources?: Array<{ document: string; metadata: Record<string, string>; score: number }>;
  tool_calls?: AiToolCall[];
};

export interface UseAISessionHistoryArgs {
  uid: string;
}

export interface UseAISessionHistoryResult {
  fetchHistory: (sessionId: string) => Promise<AiMessage[]>;
  loadingHistory: boolean;
}

// Returns fetched messages instead of owning them as internal state, since the caller
// (AITab) needs to seed the same message array that the ask-stream mutation also appends to.
export function useAISessionHistory({ uid }: UseAISessionHistoryArgs): UseAISessionHistoryResult {
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = useCallback(async (sessionId: string) => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${getAiApiBase()}/api/v1/space/course/classrooms/${uid}/ai-session/history/?session_id=${sessionId}`, {
        headers: getAiAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.messages.map((m: any) => ({
          role: m.role,
          text: m.content,
          loading: false,
        })) as AiMessage[];
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch AI history', err);
      return [];
    } finally {
      setLoadingHistory(false);
    }
  }, [uid]);

  return { fetchHistory, loadingHistory };
}

export default useAISessionHistory;
