export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  user_type: 'space' | 'consumer';
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface VerifyOtpResponse {
  reset_token: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
  name?: string;
  slug?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp_code: string;
}

export interface ResetPasswordRequest {
  reset_token: string;
  new_password: string;
  confirm_password: string;
}
