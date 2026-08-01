import AbstractRestApiClient from './client';
import type { ChatMessage, ChatConversation } from './types';

class ChatApiClient extends AbstractRestApiClient {
  async getConversations(classroomUid: string): Promise<ChatConversation[]> {
    return this.get<ChatConversation[]>(
      `/api/v1/chat/conversations/?classroom_uid=${classroomUid}`
    );
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
}

export const chatApi = new ChatApiClient();
