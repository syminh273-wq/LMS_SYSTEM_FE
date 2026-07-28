import BaseRestApiClient from './client';
import type { 
  Space, 
  CreateSpaceRequest, 
  UpdateSpaceRequest 
} from './types';

class SpaceApiClient extends BaseRestApiClient {
  constructor() {
    super();
  }

  public async list(): Promise<Space[]> {
    return this.get<Space[]>('/api/v1/space/account/spaces/');
  }

  public async mine(): Promise<Space[]> {
    return this.get<Space[]>('/api/v1/space/account/spaces/mine/');
  }

  public async create(data: CreateSpaceRequest): Promise<Space> {
    return this.post<Space>('/api/v1/space/account/spaces/', data);
  }

  public async retrieve(uid: string): Promise<Space> {
    return this.get<Space>(`/api/v1/space/account/spaces/${uid}/`);
  }

  public async update(uid: string, data: UpdateSpaceRequest): Promise<Space> {
    return this.put<Space>(`/api/v1/space/account/spaces/${uid}/`, data);
  }

  public async deleteSpace(uid: string): Promise<void> {
    return this.delete<void>(`/api/v1/space/account/spaces/${uid}/`);
  }

  public async deactivate(uid: string): Promise<Space> {
    return this.patch<Space>(`/api/v1/space/account/spaces/${uid}/deactivate/`);
  }

  public async getSettings(): Promise<Record<string, any>> {
    return this.get<Record<string, any>>('/api/v1/space/account/settings/');
  }

  public async updateSettings(data: Record<string, any>): Promise<Record<string, any>> {
    return this.patch<Record<string, any>>('/api/v1/space/account/settings/', data);
  }
}

export const spaceApi = new SpaceApiClient();
