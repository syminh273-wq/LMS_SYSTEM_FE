import AbstractRestApiClient from './client';
import type {
  QuizSummary, QuizPublicDetail, QuizSubmitRequest, QuizResult, QuizAttemptRecord,
  QuizLeaderboardResponse, QuizLeaderboardStudentDetail,
} from './types';

class ConsumerQuizApiClient extends AbstractRestApiClient {
  public async listByClassroom(classroomId: string): Promise<QuizSummary[]> {
    const response = await this.get<QuizSummary[] | { results: QuizSummary[] }>(
      `/api/v1/consumer/quiz/?classroom_id=${encodeURIComponent(classroomId)}`
    );
    return Array.isArray(response) ? response : response.results;
  }

  public async retrieve(uid: string, classroomId: string): Promise<QuizPublicDetail> {
    return this.get<QuizPublicDetail>(
      `/api/v1/consumer/quiz/${uid}/?classroom_id=${encodeURIComponent(classroomId)}`
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

  public async getLeaderboard(
    uid: string,
    classroomId: string,
    limit = 20,
  ): Promise<QuizLeaderboardResponse> {
    return this.get<QuizLeaderboardResponse>(
      `/api/v1/consumer/quiz/${uid}/leaderboard/?classroom_id=${encodeURIComponent(classroomId)}&limit=${limit}`,
    );
  }

  public async getStudentLeaderboard(
    uid: string,
    classroomId: string,
    studentUid: string,
  ): Promise<QuizLeaderboardStudentDetail> {
    return this.get<QuizLeaderboardStudentDetail>(
      `/api/v1/consumer/quiz/${uid}/leaderboard/${studentUid}/?classroom_id=${encodeURIComponent(classroomId)}`,
    );
  }
}

export const consumerQuizApi = new ConsumerQuizApiClient();
