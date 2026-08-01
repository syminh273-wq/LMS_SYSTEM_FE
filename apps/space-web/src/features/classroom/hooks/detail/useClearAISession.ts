import { useState } from 'react';
import { toast } from 'sonner';
import { getAiApiBase, getAiAuthHeaders } from './aiHttp';

export interface UseClearAISessionArgs {
  uid: string;
  t: (key: string) => string;
}

export interface UseClearAISessionResult {
  clearSession: (sessionId: string) => Promise<string | null>;
  clearing: boolean;
}

export function useClearAISession({ uid, t }: UseClearAISessionArgs): UseClearAISessionResult {
  const [clearing, setClearing] = useState(false);

  const clearSession = async (sessionId: string) => {
    if (!window.confirm(t('classroom.ui.ai_delete_confirm'))) return null;
    setClearing(true);
    try {
      const res = await fetch(`${getAiApiBase()}/api/v1/space/course/classrooms/${uid}/ai-session/`, {
        method: 'POST',
        headers: getAiAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.session_id as string;
      }
      return null;
    } catch {
      toast.error(t('classroom.ui.ai_delete_session_error'));
      return null;
    } finally {
      setClearing(false);
    }
  };

  return { clearSession, clearing };
}

export default useClearAISession;
