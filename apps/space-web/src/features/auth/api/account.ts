import BaseRestApiClient from '@/core/api/client';
import type { ApiMessageResponse, Consumer } from './index';

export interface UpdateProfileData {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
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
    return this.put('/api/v1/space/account/spaces/mine/', data);
  }

  public async changePassword(data: ChangePasswordData): Promise<ApiMessageResponse> {
    return this.post('/api/v1/space/account/spaces/change-password/', data);
  }
}

export const accountService = new AccountService();
