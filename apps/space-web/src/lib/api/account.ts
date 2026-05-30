import BaseRestApiClient from './client';
import type { ApiMessageResponse, Consumer } from './types';

export interface UpdateProfileData {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  gmail?: string;
  phone_number?: string;
  zalo?: string;
  hometown?: string;
  date_of_birth?: string;
  learning_certificates?: string[];
  certificates?: string[];
  metadata?: Record<string, unknown>;
}

export type ContactMethodType = 'gmail' | 'phone' | 'zalo';

export type ContactMethod = {
  id: string;
  type: ContactMethodType;
  value: string;
};

export type SpaceAccountProfile = Partial<Consumer> & {
  uid?: string;
  email?: string;
  gmail?: string;
  full_name?: string;
  phone?: string;
  phone_number?: string;
  zalo?: string;
  hometown?: string;
  date_of_birth?: string;
  avatar_url?: string;
  learning_certificates?: string[];
  certificates?: string[];
  metadata?: {
    certificates?: string[];
    learning_certificates?: string[];
    contacts?: ContactMethod[];
    hometown?: string;
    date_of_birth?: string;
    zalo?: string;
    [key: string]: unknown;
  };
};

export type UserProfile = SpaceAccountProfile;

export type UpdateProfileResponse = ApiMessageResponse & {
  data: UserProfile;
};

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

class AccountService extends BaseRestApiClient {
  constructor() {
    super();
  }

  public async getProfile(): Promise<UserProfile> {
    return this.get('/api/v1/space/account/mine/');
  }

  public async updateProfile(data: UpdateProfileData | FormData): Promise<UpdateProfileResponse> {
    return this.patch('/api/v1/space/account/mine/', data);
  }

  public async changePassword(data: ChangePasswordData): Promise<ApiMessageResponse> {
    return this.post('/api/v1/space/account/change-password/', data);
  }
}

export const accountService = new AccountService();
