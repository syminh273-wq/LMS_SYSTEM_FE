import BaseRestApiClient from './client';
import type { ExamSessionInfo, JoinSessionResponse } from './types';

export class ExamSessionApiClient extends BaseRestApiClient {
  public async join(token: string): Promise<JoinSessionResponse> {
    return this.get<JoinSessionResponse>(`/api/v1/consumer/course/exam-sessions/${token}/`);
  }

  public async mySession(examUid: string): Promise<ExamSessionInfo | null> {
    return this.get<ExamSessionInfo | null>(`/api/v1/consumer/course/exams/${examUid}/sessions/me/`);
  }
}

export const examSessionApi = new ExamSessionApiClient();
