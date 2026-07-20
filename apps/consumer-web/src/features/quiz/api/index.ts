import BaseRestApiClient from '@/core/api/client';
import type { QuizSummary, QuizPublicDetail, QuizSubmitRequest, QuizResult, QuizAttemptRecord } from '@lms/types';
import type { Quiz } from '../types';

export class ConsumerQuizApiClient extends BaseRestApiClient {
  public async list(classroomId?: string): Promise<Quiz[]> {
    const params = classroomId ? `?classroom_id=${encodeURIComponent(classroomId)}` : '';
    const response = await this.get<Quiz[] | { results: Quiz[] }>(
      `/api/v1/consumer/quiz/${params}`
    );
    return Array.isArray(response) ? response : response.results;
  }

  public async listByClassroom(classroomId: string): Promise<QuizSummary[]> {
    const response = await this.get<QuizSummary[] | { results: QuizSummary[] }>(
      `/api/v1/consumer/quiz/?classroom_id=${encodeURIComponent(classroomId)}`
    );
    return Array.isArray(response) ? response : response.results;
  }

  public async retrieve(uid: string, classroomId?: string): Promise<QuizPublicDetail> {
    const params = classroomId ? `?classroom_id=${encodeURIComponent(classroomId)}` : '';
    return this.get<QuizPublicDetail>(
      `/api/v1/consumer/quiz/${uid}/${params}`
    );
  }

  public async submit(uid: string, data: QuizSubmitRequest): Promise<QuizResult> {
    return this.post<QuizResult>(`/api/v1/consumer/quiz/${uid}/submit/`, data);
  }

  public async listAttempts(uid: string, classroomId: string): Promise<QuizAttemptRecord[]> {
    return this.get<QuizAttemptRecord[]>(
      `/api/v1/consumer/quiz/${uid}/attempts/?classroom_id=${encodeURIComponent(classroomId)}`
    );
  }

  public async getAttempts(uid: string, classroomId: string): Promise<QuizAttemptRecord[]> {
    return this.listAttempts(uid, classroomId);
  }

  public async deleteQuiz(uid: string): Promise<void> {
    return this.delete<void>(`/api/v1/consumer/quiz/${uid}/`);
  }

  public async assignToClassroom(uid: string, classroomId: string, settings?: any): Promise<any> {
    return this.post(`/api/v1/consumer/quiz/${uid}/assign/`, { classroom_id: classroomId, ...settings });
  }
}

export const consumerQuizApi = new ConsumerQuizApiClient();
export const quizApi = consumerQuizApi;
