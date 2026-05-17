import BaseRestApiClient from './client';
export { ApiException, UnauthorizedException, ValidationException } from './exceptions';

export const apiClient = new BaseRestApiClient();

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  full_name?: string;
};

export type AuthTokenResponse = {
  access: string;
  refresh: string;
  message: string;
};

export type ApiMessageResponse = {
  message: string;
};

export type Consumer = {
  uid: string;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  avatar_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateConsumerRequest = {
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
};

export type UpdateConsumerRequest = {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
};

export type Space = {
  uid: string;
  owner_uid: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  cover_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateSpaceRequest = {
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
};

export type UpdateSpaceRequest = {
  name?: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
};

export const consumerApi = {
  auth: {
    login: (data: LoginRequest) => apiClient.post<AuthTokenResponse>('/api/v1/consumer/account/login/', data),
    register: (data: RegisterRequest) => apiClient.post<ApiMessageResponse>('/api/v1/consumer/account/register/', data),
  },
  account: {
    me: () => apiClient.get<Consumer>('/api/v1/consumer/account/me'),
    update: (data: UpdateConsumerRequest) => apiClient.put<Consumer>('/api/v1/consumer/account/update-profile/', data),
  }
};

export const spaceApi = {
  auth: {
    login: (data: LoginRequest) => apiClient.post<AuthTokenResponse>('/api/v1/space/account/login/', data),
    register: (data: RegisterRequest & { name: string; slug: string }) => 
      apiClient.post<ApiMessageResponse>('/api/v1/space/account/register/', data),
  },
  account: {
    mine: () => apiClient.get<Space>('/api/v1/space/account/mine'),
  },
  spaces: {
    list: () => apiClient.get<Space[]>('/api/v1/space/account'),
    retrieve: (uid: string) => apiClient.get<Space>(`/api/v1/space/account/${uid}`),
    create: (data: CreateSpaceRequest) => apiClient.post<Space>('/api/v1/space/account', data),
    update: (uid: string, data: UpdateSpaceRequest) => apiClient.put<Space>(`/api/v1/space/account/${uid}`, data),
    delete: (uid: string) => apiClient.delete<void>(`/api/v1/space/account/${uid}`),
    deactivate: (uid: string) => apiClient.patch<Space>(`/api/v1/space/account/${uid}/deactivate`),
  },
  classrooms: {
    list: () => apiClient.get<any[]>('/api/v1/space/course/classrooms/'),
    retrieve: (uid: string) => apiClient.get<any>(`/api/v1/space/course/classrooms/${uid}/`),
    create: (data: any) => apiClient.post<any>('/api/v1/space/course/classrooms/', data),
    update: (uid: string, data: any) => apiClient.put<any>(`/api/v1/space/course/classrooms/${uid}/`, data),
    delete: (uid: string) => apiClient.delete<void>(`/api/v1/space/course/classrooms/${uid}/`),
  }
};
