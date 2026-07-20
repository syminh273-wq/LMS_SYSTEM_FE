import BaseRestApiClient from '@/core/api/client';
import type { Resource, ResourceFolder } from '../types';

export class ResourceApiClient extends BaseRestApiClient {
  public async list(classroomId: string, folderId?: string): Promise<Resource[]> {
    const params = new URLSearchParams({ classroom_id: classroomId });
    if (folderId) params.set('folder_id', folderId);
    return this.get<Resource[]>(`/api/v1/consumer/course/resources/?${params}`);
  }

  public async listFolders(classroomId: string, parentId?: string | null): Promise<ResourceFolder[]> {
    const params = new URLSearchParams({ classroom_id: classroomId });
    if (parentId) params.set('parent_id', parentId);
    return this.get<ResourceFolder[]>(`/api/v1/consumer/course/resource-folders/?${params}`);
  }
}

export const resourceApi = new ResourceApiClient();
