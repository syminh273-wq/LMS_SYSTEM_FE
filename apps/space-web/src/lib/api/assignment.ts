import AbstractRestApiClient from './client';
import type { AIGradeBatchResponse, AIGradeRequest, Exam, ExamSubmission } from './types';

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

  public async listSubmissions(assignmentUid: string): Promise<ExamSubmission[]> {
    return this.get<ExamSubmission[]>(`/api/v1/space/course/assignments/${assignmentUid}/submissions/`);
  }

  public async gradeSubmission(
    submissionUid: string,
    data: { grade?: number; feedback?: string }
  ): Promise<ExamSubmission> {
    return this.patch<ExamSubmission>(`/api/v1/space/course/assignments/submissions/${submissionUid}/grade/`, data);
  }

  public async aiGradeSubmission(submissionUid: string, data: AIGradeRequest): Promise<ExamSubmission> {
    return this.post<ExamSubmission>(`/api/v1/space/course/assignments/submissions/${submissionUid}/ai-grade/`, data);
  }

  public async aiGradeAssignmentSubmissions(assignmentUid: string, data: AIGradeRequest): Promise<AIGradeBatchResponse> {
    return this.post<AIGradeBatchResponse>(`/api/v1/space/course/assignments/${assignmentUid}/submissions/ai-grade/`, data);
  }
}

export const assignmentApi = new AssignmentApiClient();
