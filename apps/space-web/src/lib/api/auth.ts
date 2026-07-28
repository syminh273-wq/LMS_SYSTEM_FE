import BaseRestApiClient from './client';
import type {
  AuthTokenResponse,
  LoginRequest,
  RegisterRequest,
  ApiMessageResponse
} from './types';

interface ForgotPasswordRequest { email: string }
interface VerifyOTPRequest { email: string; otp_code: string }
interface VerifyOTPResponse { reset_token: string }
interface ResetPasswordRequest { reset_token: string; new_password: string; confirm_password: string }

class AuthApiClient extends BaseRestApiClient {
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

  public async consumerForgotPassword(data: ForgotPasswordRequest): Promise<ApiMessageResponse> {
    return this.post<ApiMessageResponse>('/api/v1/consumer/account/forgot-password/', data);
  }

  public async consumerVerifyOtp(data: VerifyOTPRequest): Promise<VerifyOTPResponse> {
    return this.post<VerifyOTPResponse>('/api/v1/consumer/account/verify-otp/', data);
  }

  public async consumerResetPassword(data: ResetPasswordRequest): Promise<ApiMessageResponse> {
    return this.post<ApiMessageResponse>('/api/v1/consumer/account/reset-password/', data);
  }

  // Space Auth
  public async spaceLogin(data: LoginRequest): Promise<AuthTokenResponse> {
    return this.post<AuthTokenResponse>('/api/v1/space/account/login/', data);
  }

  public async spaceRegister(data: RegisterRequest & { name: string; slug: string }): Promise<ApiMessageResponse> {
    return this.post<ApiMessageResponse>('/api/v1/space/account/register/', data);
  }

  public async spaceForgotPassword(data: ForgotPasswordRequest): Promise<ApiMessageResponse> {
    return this.post<ApiMessageResponse>('/api/v1/space/account/forgot-password/', data);
  }

  public async spaceVerifyOtp(data: VerifyOTPRequest): Promise<VerifyOTPResponse> {
    return this.post<VerifyOTPResponse>('/api/v1/space/account/verify-otp/', data);
  }

  public async spaceResetPassword(data: ResetPasswordRequest): Promise<ApiMessageResponse> {
    return this.post<ApiMessageResponse>('/api/v1/space/account/reset-password/', data);
  }
}

export const authApi = new AuthApiClient();
