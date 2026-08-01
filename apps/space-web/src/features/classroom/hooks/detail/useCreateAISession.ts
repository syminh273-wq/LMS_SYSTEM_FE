import { useState } from 'react';
import { toast } from 'sonner';
import { getAiApiBase, getAiAuthHeaders } from './aiHttp';

export interface UseCreateAISessionArgs {
  uid: string;
  t: (key: string) => string;
}

export interface UseCreateAISessionResult {
  createSession: () => Promise<string | null>;
  creating: boolean;
}

export function useCreateAISession({ uid, t }: UseCreateAISessionArgs): UseCreateAISessionResult {
  const [creating, setCreating] = useState(false);

  const createSession = async () => {
    setCreating(true);
    try {
      const res = await fetch(`${getAiApiBase()}/api/v1/space/course/classrooms/${uid}/ai-session/`, {
        method: 'POST',
        headers: getAiAuthHeaders({ 'Content-Type': 'application/json' }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.session_id as string;
      }
      return null;
    } catch {
      toast.error(t('classroom.ui.ai_create_session_error'));
      return null;
    } finally {
      setCreating(false);
    }
  };

  return { createSession, creating };
}

export default useCreateAISession;
