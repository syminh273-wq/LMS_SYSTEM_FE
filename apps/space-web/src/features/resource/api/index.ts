import BaseRestApiClient from '@/core/api/client';
import type { Resource, ResourceFolder } from '../types';

export class ResourceApiClient extends BaseRestApiClient {
  public async list(classroomId: string, folderId?: string): Promise<Resource[]> {
    const params = new URLSearchParams({ classroom_id: classroomId });
    if (folderId) params.set('folder_id', folderId);
    const response = await this.get<Resource[] | { results: Resource[] }>(
      `/api/v1/space/course/resources/?${params.toString()}`
    );
    return Array.isArray(response) ? response : response.results;
  }

  public async listFolders(classroomId: string, parentId?: string | null): Promise<ResourceFolder[]> {
    const params = new URLSearchParams({ classroom_id: classroomId });
    if (parentId) params.set('parent_id', parentId);
    const response = await this.get<ResourceFolder[] | { results: ResourceFolder[] }>(
      `/api/v1/space/course/resource-folders/?${params.toString()}`
    );
    return Array.isArray(response) ? response : response.results;
  }
}

export const resourceApi = new ResourceApiClient();
