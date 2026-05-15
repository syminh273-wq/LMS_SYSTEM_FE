import BaseRestApiClient from './client';
import type { 
  AuthTokenResponse, 
  LoginRequest, 
  RegisterRequest, 
  ApiMessageResponse 
} from './types';

export class AuthApiClient extends BaseRestApiClient {
  constructor() {
    super();
  }

  // Consumer Auth
  public async consumerLogin(data: LoginRequest): Promise<AuthTokenResponse> {
    return this.post<AuthTokenResponse>('/api/v1/consumer/account/login/', data);
  }

  public async consumerRegister(data: RegisterRequest): Promise<ApiMessageResponse> {
    return this.post<ApiMessageResponse>('/api/v1/consumer/account/register/', data);
  }

  // Space Auth
  public async spaceLogin(data: LoginRequest): Promise<AuthTokenResponse> {
    return this.post<AuthTokenResponse>('/api/v1/space/account/login/', data);
  }

  public async spaceRegister(data: RegisterRequest & { name: string; slug: string }): Promise<ApiMessageResponse> {
    return this.post<ApiMessageResponse>('/api/v1/space/account/register/', data);
  }
}

export const authApi = new AuthApiClient();
