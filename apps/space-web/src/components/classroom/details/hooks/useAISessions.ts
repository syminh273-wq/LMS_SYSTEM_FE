import { useState, useEffect, useCallback } from 'react';
import { getAiApiBase, getAiAuthHeaders } from './aiHttp';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AISession = any;

export interface UseAISessionsArgs {
  uid: string;
}

export interface UseAISessionsResult {
  aiSessions: AISession[];
  loadingAiSessions: boolean;
  fetchAiSessions: () => Promise<AISession[]>;
}

export function useAISessions({ uid }: UseAISessionsArgs): UseAISessionsResult {
  const [aiSessions, setAiSessions] = useState<AISession[]>([]);
  const [loadingAiSessions, setLoadingAiSessions] = useState(false);

  const fetchAiSessions = useCallback(async () => {
    setLoadingAiSessions(true);
    try {
      const res = await fetch(`${getAiApiBase()}/api/v1/space/course/classrooms/${uid}/ai-sessions/`, {
        headers: getAiAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSessions(data);
        return data;
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch AI sessions', err);
      return [];
    } finally {
      setLoadingAiSessions(false);
    }
  }, [uid]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Mounting the tab initiates its request.
    void fetchAiSessions();
  }, [fetchAiSessions]);

  return { aiSessions, loadingAiSessions, fetchAiSessions };
}

export default useAISessions;
