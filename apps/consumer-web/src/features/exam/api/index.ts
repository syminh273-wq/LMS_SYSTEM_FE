import BaseRestApiClient from '@/core/api/client';
import type {
  Exam,
  ExamSubmission,
  CreateExamRequest,
  UpdateExamRequest,
  GradeSubmissionRequest,
  OpenOnlineResponse,
  AuditOverviewResponse,
  AuditDetailsResponse,
  AuditAnswersResponse,
  FaceLogEntry,
} from '../types';
export { examSessionApi } from './exam-session';

export class ExamApiClient extends BaseRestApiClient {
  public async listByClassroom(classroomUid: string, params?: { status?: string | string[]; exam_mode?: string }): Promise<Exam[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      statuses.forEach(s => searchParams.append('status', s));
    }
    if (params?.exam_mode) searchParams.set('exam_mode', params.exam_mode);
    const qs = searchParams.toString();
    return this.get<Exam[]>(`/api/v1/consumer/course/classrooms/${classroomUid}/exams/${qs ? `?${qs}` : ''}`);
  }

  public async retrieve(uid: string): Promise<Exam> {
    return this.get<Exam>(`/api/v1/consumer/course/exams/${uid}/`);
  }

  public async create(data: CreateExamRequest): Promise<Exam> {
    return this.post<Exam>('/api/v1/space/course/exams/', data);
  }

  public async update(uid: string, data: Partial<UpdateExamRequest>): Promise<Exam> {
    return this.patch<Exam>(`/api/v1/space/course/exams/${uid}/`, data);
  }

  public async deleteExam(uid: string): Promise<void> {
    return this.delete<void>(`/api/v1/space/course/exams/${uid}/`);
  }

  public async listSubmissions(examUid: string): Promise<ExamSubmission[]> {
    return this.get<ExamSubmission[]>(`/api/v1/space/course/exams/${examUid}/submissions/`);
  }

  public async gradeSubmission(submissionUid: string, data: GradeSubmissionRequest): Promise<ExamSubmission> {
    return this.post<ExamSubmission>(`/api/v1/space/course/exam-submissions/${submissionUid}/grade/`, data);
  }

  public async openOnline(uid: string, settings?: { late_threshold_seconds?: number; duration_seconds?: number; camera_required?: boolean; max_face_warnings?: number }): Promise<OpenOnlineResponse> {
    return this.post<OpenOnlineResponse>(`/api/v1/space/course/exams/${uid}/open-online/`, settings ?? {});
  }

  public async getAuditOverview(submissionUid: string): Promise<AuditOverviewResponse> {
    return this.get<AuditOverviewResponse>(`/api/v1/space/course/exam-submissions/${submissionUid}/audit/`);
  }

  public async getAuditDetails(submissionUid: string): Promise<AuditDetailsResponse> {
    return this.get<AuditDetailsResponse>(`/api/v1/space/course/exam-submissions/${submissionUid}/audit/details/`);
  }

  public async getAuditAnswers(submissionUid: string): Promise<AuditAnswersResponse> {
    return this.get<AuditAnswersResponse>(`/api/v1/space/course/exam-submissions/${submissionUid}/audit/answers/`);
  }

  public async getFaceLogs(submissionUid: string): Promise<FaceLogEntry[]> {
    return this.get<FaceLogEntry[]>(`/api/v1/space/course/exam-submissions/${submissionUid}/audit/faces/`);
  }
}

export const examApi = new ExamApiClient();
