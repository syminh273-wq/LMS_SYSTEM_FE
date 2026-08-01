import AbstractRestApiClient from './client';
import type { Exam } from './types';

class AssignmentApiClient extends AbstractRestApiClient {
  public async listByClassroom(
    classroomUid: string,
    params?: { status?: string | string[] }
  ): Promise<Exam[]> {
    const qs = new URLSearchParams({ classroom_id: classroomUid });
    if (params?.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      statuses.forEach(s => qs.append('status', s));
    }
    const response = await this.get<Exam[] | { results: Exam[] }>(
      `/api/v1/space/course/assignments/?${qs.toString()}`
    );
    const assignments = Array.isArray(response) ? response : response.results;
    return assignments.filter((item) => String(item.classroom_id) === classroomUid);
  }

  public async retrieve(uid: string): Promise<Exam> {
    return this.get<Exam>(`/api/v1/space/course/assignments/${uid}/`);
  }

  public async create(data: FormData): Promise<Exam> {
    return this.post<Exam>('/api/v1/space/course/assignments/', data);
  }

  public async update(uid: string, data: FormData): Promise<Exam> {
    return this.patch<Exam>(`/api/v1/space/course/assignments/${uid}/`, data);
  }

  public async deleteAssignment(uid: string): Promise<void> {
    return super.delete<void>(`/api/v1/space/course/assignments/${uid}/`);
  }
}

export const assignmentApi = new AssignmentApiClient();
