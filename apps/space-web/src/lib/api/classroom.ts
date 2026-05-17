import BaseRestApiClient from './client';
import type { 
  Classroom, 
  PaginatedResponse, 
  CreateClassroomRequest, 
  UpdateClassroomRequest,
  SharingLink 
} from './types';

export class ClassroomApiClient extends BaseRestApiClient {
  constructor() {
    super();
  }

  public async list(page: number = 1): Promise<PaginatedResponse<Classroom>> {
    return this.get<PaginatedResponse<Classroom>>(`/api/v1/space/course/classrooms/?page=${page}`);
  }

  public async create(data: CreateClassroomRequest): Promise<Classroom> {
    return this.post<Classroom>('/api/v1/space/course/classrooms/', data);
  }

  public async retrieve(uid: string): Promise<Classroom> {
    return this.get<Classroom>(`/api/v1/space/course/classrooms/${uid}/`);
  }

  public async update(uid: string, data: UpdateClassroomRequest): Promise<Classroom> {
    return this.patch<Classroom>(`/api/v1/space/course/classrooms/${uid}/`, data);
  }

  public async delete<TResponse = any>(uid: string, options?: RequestInit): Promise<TResponse> {
    return super.delete<TResponse>(`/api/v1/space/course/classrooms/${uid}/`, options);
  }

  public async getSharingLink(uid: string): Promise<SharingLink> {
    return this.get<SharingLink>(`/api/v1/space/course/classrooms/${uid}/sharing_link/`);
  }

  // Consumer side
  public async mine(page: number = 1): Promise<PaginatedResponse<Classroom>> {
    return this.get<PaginatedResponse<Classroom>>(`/api/v1/space/course/classrooms/?page=${page}`);
  }
}

export const classroomApi = new ClassroomApiClient();
