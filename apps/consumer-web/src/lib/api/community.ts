import BaseRestApiClient from './client';
import type { ChatMessage } from './types';

export type WorkspaceProfile = {
  owner_id: string;
  owner_type: 'consumer' | 'space';
  avatar_url: string;
  cover_url: string;
  bio: string;
  major: string;
  department: string;
  skills: string[];
  github: string;
  linkedin: string;
  website: string;
  posts_count: number;
  followers_count: number;
  following_count: number;
  updated_at: string | null;
};

export type DirectConversation = {
  conversation_uid: string;
  other_user: {
    uid: string;
    name: string;
    avatar: string;
    last_seen_at: string | null;
  };
  last_msg: {
    text: string;
    sender_name: string;
    at: string | null;
  } | null;
  unread_count: number;
  created_at: string | null;
};

export type WorkspaceMessage = {
  uid: string;
  conversation_uid: string;
  msg_type: string;
  content: string;
  sender_id: string | null;
  sender_type: string;
  sender_name: string;
  attachment: {
    uid: string | null;
    url: string;
    name: string;
    size: number;
    type: string;
  } | null;
  created_at: string | null;
};

class CommunityApiClient extends BaseRestApiClient {
  // ── Profile ────────────────────────────────────────────────────────────────
  async getMyProfile(): Promise<WorkspaceProfile> {
    return this.get<WorkspaceProfile>('/api/v1/consumer/social/profile/me/');
  }
  async updateMyProfile(data: Partial<WorkspaceProfile>): Promise<WorkspaceProfile> {
    return this.patch<WorkspaceProfile>('/api/v1/consumer/social/profile/me/', data);
  }
  async getPublicProfile(ownerId: string): Promise<WorkspaceProfile> {
    return this.get<WorkspaceProfile>(`/api/v1/consumer/social/profile/${ownerId}/`);
  }
  async uploadAvatar(file: File): Promise<{ url: string; avatar_url: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.post('/api/v1/consumer/social/profile/me/avatar/', fd);
  }
  async uploadCover(file: File): Promise<{ url: string; cover_url: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.post('/api/v1/consumer/social/profile/me/cover/', fd);
  }

  // ── Direct Conversations ──────────────────────────────────────────────────
  async listDirectConversations(): Promise<DirectConversation[]> {
    return this.get<DirectConversation[]>('/api/v1/chat/direct/conversations/');
  }
  async getOrCreateDirect(targetUserId: string): Promise<{ conversation_uid: string; created: boolean }> {
    return this.post('/api/v1/chat/direct/conversations/', { target_user_id: targetUserId });
  }
  async sendMessageHTTP(payload: {
    conversation_uid: string;
    content: string;
    msg_type?: string;
    resource_uid?: string;
    resource_url?: string;
    resource_name?: string;
    resource_size?: number;
  }): Promise<WorkspaceMessage> {
    return this.post<WorkspaceMessage>('/api/v1/chat/direct/messages/', payload);
  }
  async markConversationSeen(conversationUid: string, msgUid?: string): Promise<void> {
    await this.post('/api/v1/chat/direct/messages/seen/', {
      conversation_uid: conversationUid,
      msg_uid: msgUid,
    });
  }
}

export const communityApi = new CommunityApiClient();

export type { ChatMessage };
