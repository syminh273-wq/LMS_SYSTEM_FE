import AbstractRestApiClient from './client';
import type {
  Quiz, QuizDetail,
  UpdateAssignmentRequest, UpdateQuestionRequest,
  QuizQuestion, QuizAttemptRecord, QuizAssignment,
  QuizLeaderboardResponse, QuizLeaderboardStudentDetail,
} from './types';

class QuizApiClient extends AbstractRestApiClient {
  public async list(classroomId?: string): Promise<Quiz[]> {
    const url = classroomId
      ? `/api/v1/space/quiz/?classroom_id=${encodeURIComponent(classroomId)}`
      : '/api/v1/space/quiz/';
    const response = await this.get<Quiz[] | { results: Quiz[] }>(url);
    return Array.isArray(response) ? response : response.results;
  }

  public async retrieve(uid: string): Promise<QuizDetail> {
    return this.get<QuizDetail>(`/api/v1/space/quiz/${uid}/`);
  }

  public async deleteQuiz(uid: string): Promise<void> {
    return super.delete<void>(`/api/v1/space/quiz/${uid}/`);
  }

  public async assignToClassroom(
    uid: string,
    classroomId: string,
    settings?: UpdateAssignmentRequest,
  ): Promise<QuizAssignment> {
    return this.post<QuizAssignment>(`/api/v1/space/quiz/${uid}/assign/`, {
      classroom_id: classroomId,
      ...settings,
    });
  }

  public async updateAssignment(
    uid: string,
    classroomId: string,
    data: UpdateAssignmentRequest,
  ): Promise<QuizAssignment> {
    return this.patch<QuizAssignment>(`/api/v1/space/quiz/${uid}/assign/${classroomId}/`, data);
  }

  public async closeAssignment(
    uid: string,
    classroomId: string,
    closesAt?: string | null,
  ): Promise<QuizAssignment> {
    const body: Record<string, unknown> = {};
    if (closesAt) body.closes_at = closesAt;
    return this.post<QuizAssignment>(`/api/v1/space/quiz/${uid}/assign/${classroomId}/close/`, body);
  }

  public async reopenAssignment(
    uid: string,
    classroomId: string,
    opts: { opens_at?: string | null; closes_at?: string | null } = {},
  ): Promise<QuizAssignment> {
    return this.post<QuizAssignment>(`/api/v1/space/quiz/${uid}/assign/${classroomId}/reopen/`, opts);
  }

  public async unassignFromClassroom(uid: string, classroomId: string): Promise<void> {
    return super.delete<void>(`/api/v1/space/quiz/${uid}/unassign/${classroomId}/`);
  }

  public async getAttempts(uid: string, classroomId: string): Promise<QuizAttemptRecord[]> {
    return this.get<QuizAttemptRecord[]>(
      `/api/v1/space/quiz/${uid}/attempts/?classroom_id=${encodeURIComponent(classroomId)}`
    );
  }

  public async getLeaderboard(
    uid: string,
    classroomId: string,
    limit = 20,
  ): Promise<QuizLeaderboardResponse> {
    return this.get<QuizLeaderboardResponse>(
      `/api/v1/space/quiz/${uid}/assign/${classroomId}/leaderboard/?limit=${limit}`,
    );
  }

  public async getStudentLeaderboard(
    uid: string,
    classroomId: string,
    studentUid: string,
  ): Promise<QuizLeaderboardStudentDetail> {
    return this.get<QuizLeaderboardStudentDetail>(
      `/api/v1/space/quiz/${uid}/assign/${classroomId}/leaderboard/${studentUid}/`,
    );
  }

  public async updateQuestion(
    quizUid: string,
    questionUid: string,
    data: UpdateQuestionRequest,
  ): Promise<QuizQuestion> {
    return this.patch<QuizQuestion>(
      `/api/v1/space/quiz/${quizUid}/questions/${questionUid}/`,
      data,
    );
  }

  public async deleteQuestion(quizUid: string, questionUid: string): Promise<void> {
    return super.delete<void>(`/api/v1/space/quiz/${quizUid}/questions/${questionUid}/`);
  }
}

export const quizApi = new QuizApiClient();
