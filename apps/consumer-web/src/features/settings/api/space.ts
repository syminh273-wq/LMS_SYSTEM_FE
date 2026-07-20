import BaseRestApiClient from '@/core/api/client';
import type { 
  Space, 
  SpaceSettings,
  CreateSpaceRequest, 
  UpdateSpaceRequest 
} from '@lms/types';

export class SpaceApiClient extends BaseRestApiClient {
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

  public async getSettings(): Promise<SpaceSettings> {
    return this.get<SpaceSettings>('/api/v1/space/account/settings/');
  }

  public async updateSettings(data: SpaceSettings): Promise<SpaceSettings> {
    return this.put<SpaceSettings>('/api/v1/space/account/settings/', data);
  }
}

export const spaceApi = new SpaceApiClient();
