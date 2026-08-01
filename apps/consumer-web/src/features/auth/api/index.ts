import AbstractRestApiClient from '@/lib/api/client';
import type {
  AuthResponse,
  LoginCredentialsDTO,
  RegisterFormProps,
  ApiMessageResponse,
} from '@/lib/api/types';
import type {
  ForgotPasswordFormProps,
  VerifyOTPFormProps,
  VerifyOTPResponse,
  ResetPasswordFormProps,
} from '@/features/auth/types';

class AuthAPI extends AbstractRestApiClient {
  constructor() {
    super();
  }

  public async loginAsConsumer(data: LoginCredentialsDTO): Promise<AuthResponse> {
    return this.post<AuthResponse>('/api/v1/consumer/account/login/', data);
  }

  public async registerAsConsumer(data: RegisterFormProps | FormData): Promise<ApiMessageResponse> {
    return this.post<ApiMessageResponse>('/api/v1/consumer/account/register/', data);
  }

  public async forgotPasswordAsConsumer(data: ForgotPasswordFormProps): Promise<ApiMessageResponse> {
    return this.post<ApiMessageResponse>('/api/v1/consumer/account/forgot-password/', data);
  }

  public async verifyOtpAsConsumer(data: VerifyOTPFormProps): Promise<VerifyOTPResponse> {
    return this.post<VerifyOTPResponse>('/api/v1/consumer/account/verify-otp/', data);
  }

  public async resetPasswordAsConsumer(data: ResetPasswordFormProps): Promise<ApiMessageResponse> {
    return this.post<ApiMessageResponse>('/api/v1/consumer/account/reset-password/', data);
  }

  public async loginAsSpace(data: LoginCredentialsDTO): Promise<AuthResponse> {
    return this.post<AuthResponse>('/api/v1/space/account/login/', data);
  }

  public async registerAsSpace(data: RegisterFormProps & { name: string; slug: string }): Promise<ApiMessageResponse> {
    return this.post<ApiMessageResponse>('/api/v1/space/account/register/', data);
  }

  public async forgotPasswordAsSpace(data: ForgotPasswordFormProps): Promise<ApiMessageResponse> {
    return this.post<ApiMessageResponse>('/api/v1/space/account/forgot-password/', data);
  }

  public async verifyOtpAsSpace(data: VerifyOTPFormProps): Promise<VerifyOTPResponse> {
    return this.post<VerifyOTPResponse>('/api/v1/space/account/verify-otp/', data);
  }

  public async resetPasswordAsSpace(data: ResetPasswordFormProps): Promise<ApiMessageResponse> {
    return this.post<ApiMessageResponse>('/api/v1/space/account/reset-password/', data);
  }
}

export const authApi = new AuthAPI();
