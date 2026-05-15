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
    return this.get('/api/v1/space/account/spaces/mine/');
  }

  public async updateProfile(data: UpdateProfileData | FormData): Promise<UpdateProfileResponse> {
    // Note: Space update might need different logic if we use a different endpoint
    return this.put('/api/v1/space/account/spaces/mine/', data);
  }
}

export const accountService = new AccountService();
