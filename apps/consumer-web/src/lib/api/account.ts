import AbstractRestApiClient from './client';
import type { ApiMessageResponse, Consumer, PublicStudentProfile } from './index';

export type UserProfile = Consumer;

interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

class AccountService extends AbstractRestApiClient {
  constructor() {
    super();
  }

  public async getProfile(): Promise<UserProfile> {
    return this.get('/api/v1/consumer/account/consumers/me/');
  }

  public async getPublicProfile(consumerUid: string): Promise<PublicStudentProfile> {
    return this.get(`/api/v1/consumer/account/profile/${consumerUid}/public/`);
  }

  public async changePassword(data: ChangePasswordData): Promise<ApiMessageResponse> {
    return this.post('/api/v1/consumer/account/consumers/change-password/', data);
  }
}

export const accountService = new AccountService();
