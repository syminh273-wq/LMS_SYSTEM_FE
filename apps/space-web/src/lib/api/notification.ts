import AbstractRestApiClient from './client';
import type { PaginatedResponse } from './types';

export type Notification = {
  uid: string;
  target_uid: string;
  notify_type: string;
  title: string;
  content: string;
  metadata: string;
  is_read: boolean;
  created_at: string;
};

class NotificationApiClient extends AbstractRestApiClient {
  async list(params?: { target_uid?: string; limit?: number }): Promise<Notification[]> {
    const search = new URLSearchParams();
    if (params?.target_uid) search.set('target_uid', params.target_uid);
    if (params?.limit != null) search.set('limit', String(params.limit));
    const query = search.toString();
    const path = `/api/v1/notifications/${query ? `?${query}` : ''}`;
    const res = await this.get<PaginatedResponse<Notification> | Notification[]>(path);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as PaginatedResponse<Notification>).results)) {
      return (res as PaginatedResponse<Notification>).results;
    }
    return [];
  }

  async markRead(uid: string): Promise<void> {
    await this.post(`/api/v1/notifications/${uid}/read/`);
  }

  async markAllRead(): Promise<void> {
    await this.post('/api/v1/notifications/read-all/');
  }
}

export const notificationApi = new NotificationApiClient();
