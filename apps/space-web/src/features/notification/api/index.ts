import BaseRestApiClient from '@/core/api/client';
import type { PaginatedResponse } from '@lms/types';

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
      '/api/v1/notifications/'
    );
    return Array.isArray(res) ? res : res.results;
  }

  async markRead(uid: string): Promise<void> {
    await this.post(`/api/v1/notifications/${uid}/read/`);
  }

  async markAllRead(): Promise<void> {
    await this.post('/api/v1/notifications/read-all/');
  }
}

export const notificationApi = new NotificationApiClient();
