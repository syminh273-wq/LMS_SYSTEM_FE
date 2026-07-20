import { useState, useEffect, useCallback } from 'react';
import type { ChatConversation } from '../types';
import { chatApi } from '../api';

export function useChatConversations(classroomUid?: string) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchConversations = useCallback(async () => {
    if (!classroomUid) return;
    try {
      setLoading(true);
      setError('');
      const res = await chatApi.getConversations(classroomUid);
      setConversations(Array.isArray(res) ? res : (res as any).results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [classroomUid]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    error,
    refresh: fetchConversations,
  };
}
