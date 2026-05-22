import BaseRestApiClient from './client';
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

class NotificationApiClient extends BaseRestApiClient {
  async list(): Promise<Notification[]> {
    const res = await this.get<PaginatedResponse<Notification> | Notification[]>(
      '/api/v1/notification/notifications/all/'
    );
    return Array.isArray(res) ? res : res.results;
  }

  async markRead(uid: string, targetUid: string): Promise<void> {
    await this.post(`/api/v1/notification/notifications/${uid}/read/`, { target_uid: targetUid });
  }

  async markAllRead(targetUid: string): Promise<void> {
    await this.post('/api/v1/notification/notifications/read-all/', { target_uid: targetUid });
  }
}

export const notificationApi = new NotificationApiClient();
