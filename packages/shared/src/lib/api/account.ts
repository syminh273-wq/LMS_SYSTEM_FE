import BaseRestApiClient from './client';
import type { ApiMessageResponse, Consumer } from './index';

export interface UpdateProfileData {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

export type UserProfile = Consumer;

export type UpdateProfileResponse = ApiMessageResponse & {
  data: UserProfile;
};

class AccountService extends BaseRestApiClient {
  constructor() {
    super();
  }

  public async getProfile(): Promise<UserProfile> {
    return this.get('/api/v1/consumer/account/consumers/me/');
  }

  public async updateProfile(data: UpdateProfileData | FormData): Promise<UpdateProfileResponse> {
    return this.put('/api/v1/consumer/account/update-profile/', data);
  }
}

export const accountService = new AccountService();
