import BaseRestApiClient from './client';
import type { ApiMessageResponse, Consumer, StudentProfileSettings, PublicStudentProfile } from './index';

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

  public async getProfileSettings(): Promise<StudentProfileSettings> {
    return this.get('/api/v1/consumer/account/profile-settings/');
  }

  public async updateProfileSettings(data: Partial<StudentProfileSettings>): Promise<StudentProfileSettings> {
    return this.patch('/api/v1/consumer/account/profile-settings/', data);
  }

  public async getPublicProfile(consumerUid: string): Promise<PublicStudentProfile> {
    return this.get(`/api/v1/consumer/account/profile/${consumerUid}/public/`);
  }
}

export const accountService = new AccountService();
