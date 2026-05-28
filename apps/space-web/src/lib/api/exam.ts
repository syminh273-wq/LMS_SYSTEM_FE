import BaseRestApiClient from './client';
import type { AIGradeBatchResponse, AIGradeRequest, CreateExamRequest, Exam, ExamSubmission, UpdateExamRequest } from './types';

export class ExamApiClient extends BaseRestApiClient {
  public async listByClassroom(classroomUid: string): Promise<Exam[]> {
    const response = await this.get<Exam[] | { results: Exam[] }>(
      `/api/v1/space/course/exams/?classroom_id=${encodeURIComponent(classroomUid)}`
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
}

export const examApi = new ExamApiClient();
