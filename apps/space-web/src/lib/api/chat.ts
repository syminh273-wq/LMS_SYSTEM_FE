import AbstractRestApiClient from './client';
import type { ChatMessage, ChatConversation } from './types';

class ChatApiClient extends AbstractRestApiClient {
  async getConversations(classroomUid: string): Promise<ChatConversation[]> {
    return this.get<ChatConversation[]>(
      `/api/v1/chat/conversations/?classroom_uid=${classroomUid}`
    );
  }

  async getOrCreateDirect(targetUserId: string): Promise<ChatConversation> {
    return this.post<ChatConversation>('/api/v1/chat/conversations/direct/', {
      target_user_id: targetUserId,
    });
  }

  async getMessages(
    conversationUid: string,
    limit = 30
  ): Promise<{ results: ChatMessage[]; has_more: boolean }> {
    return this.get<{ results: ChatMessage[]; has_more: boolean }>(
      `/api/v1/chat/messages/?conversation_uid=${conversationUid}&limit=${limit}`
    );
  }

  async getMessagesBefore(
    conversationUid: string,
    beforeUid: string,
    limit = 30
  ): Promise<{ results: ChatMessage[]; has_more: boolean }> {
    return this.get<{ results: ChatMessage[]; has_more: boolean }>(
      `/api/v1/chat/messages/?conversation_uid=${conversationUid}&before_uid=${beforeUid}&limit=${limit}`
    );
  }

  async markRead(conversationUid: string, msgUid: string): Promise<void> {
    return this.post<void>('/api/v1/chat/messages/read/', {
      conversation_uid: conversationUid,
      msg_uid: msgUid,
    });
  }
}

export const chatApi = new ChatApiClient();
