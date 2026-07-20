import BaseRestApiClient from '@/core/api/client';
import type { AIGradeBatchResponse, AIGradeRequest, CreateExamRequest, Exam, ExamSession, ExamSubmission, OpenOnlineResponse, UpdateExamRequest, AuditOverviewResponse, AuditDetailsResponse, AuditAnswersResponse, FaceLogEntry } from '@lms/types';

export class ExamApiClient extends BaseRestApiClient {
  public async listByClassroom(
    classroomUid: string,
    params?: { status?: string | string[]; exam_mode?: string }
  ): Promise<Exam[]> {
    const qs = new URLSearchParams({ classroom_id: classroomUid });
    if (params?.exam_mode) qs.set('exam_mode', params.exam_mode);
    if (params?.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      statuses.forEach(s => qs.append('status', s));
    }
    const response = await this.get<Exam[] | { results: Exam[] }>(
      `/api/v1/space/course/exams/?${qs.toString()}`
    );
    const exams = Array.isArray(response) ? response : response.results;
    return exams.filter((exam) => String(exam.classroom_id) === classroomUid);
  }

  public async retrieve(uid: string): Promise<Exam> {
    return this.get<Exam>(`/api/v1/space/course/exams/${uid}/`);
  }

  public async create(data: CreateExamRequest): Promise<Exam> {
    return this.post<Exam>('/api/v1/space/course/exams/', data);
  }

  public async update(uid: string, data: UpdateExamRequest): Promise<Exam> {
    return this.patch<Exam>(`/api/v1/space/course/exams/${uid}/`, data);
  }

  public async deleteExam(uid: string): Promise<void> {
    return super.delete<void>(`/api/v1/space/course/exams/${uid}/`);
  }

  public async listSubmissions(examUid: string): Promise<ExamSubmission[]> {
    return this.get<ExamSubmission[]>(`/api/v1/space/course/exams/${examUid}/submissions/`);
  }

  public async gradeSubmission(
    submissionUid: string,
    data: { grade?: number; feedback?: string }
  ): Promise<ExamSubmission> {
    return this.patch<ExamSubmission>(`/api/v1/space/course/exams/submissions/${submissionUid}/grade/`, data);
  }

  public async aiGradeSubmission(submissionUid: string, data: AIGradeRequest): Promise<ExamSubmission> {
    return this.post<ExamSubmission>(`/api/v1/space/course/exams/submissions/${submissionUid}/ai-grade/`, data);
  }

  public async aiGradeExamSubmissions(examUid: string, data: AIGradeRequest): Promise<AIGradeBatchResponse> {
    return this.post<AIGradeBatchResponse>(`/api/v1/space/course/exams/${examUid}/submissions/ai-grade/`, data);
  }

  public async aiGradeClassroomSubmissions(classroomUid: string, data: AIGradeRequest): Promise<AIGradeBatchResponse> {
    return this.post<AIGradeBatchResponse>(`/api/v1/space/course/classrooms/${classroomUid}/exams/ai-grade/`, data);
  }

  public async openOnline(
    examUid: string,
    settings: { late_threshold_seconds: number; duration_seconds: number; camera_required: boolean; max_tab_leaves?: number; max_face_warnings: number }
  ): Promise<OpenOnlineResponse> {
    return this.post<OpenOnlineResponse>(`/api/v1/space/course/exams/${examUid}/open-online/`, settings);
  }

  public async closeOnline(examUid: string): Promise<{ message: string }> {
    return this.post<{ message: string }>(`/api/v1/space/course/exams/${examUid}/close-online/`, {});
  }

  public async listOnlineSessions(examUid: string): Promise<ExamSession[]> {
    return this.get<ExamSession[]>(`/api/v1/space/course/exams/${examUid}/online-sessions/`);
  }

  // ── Audit log (teacher view) ──────────────────────────────────────────────

  public async getAuditOverview(submissionUid: string): Promise<AuditOverviewResponse> {
    return this.get<AuditOverviewResponse>(
      `/api/v1/space/course/exams/submissions/${submissionUid}/audit-log/overview/`,
    );
  }

  public async getAuditDetails(submissionUid: string): Promise<AuditDetailsResponse> {
    return this.get<AuditDetailsResponse>(
      `/api/v1/space/course/exams/submissions/${submissionUid}/audit-log/details/`,
    );
  }

  public async getAuditAnswers(submissionUid: string): Promise<AuditAnswersResponse> {
    return this.get<AuditAnswersResponse>(
      `/api/v1/space/course/exams/submissions/${submissionUid}/audit-log/answers/`,
    );
  }

  public async getStudentFaceLogs(examUid: string, studentUid: string): Promise<FaceLogEntry[]> {
    return this.get<FaceLogEntry[]>(
      `/api/v1/space/face/exams/${examUid}/students/${studentUid}/logs/`,
    );
  }
}

export const examApi = new ExamApiClient();
