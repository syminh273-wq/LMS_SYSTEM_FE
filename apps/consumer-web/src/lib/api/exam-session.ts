import BaseRestApiClient from './client';
import type { ExamSessionInfo, JoinSessionResponse } from './types';

export type ProctoringEventType =
  | 'tab_leave'
  | 'tab_return'
  | 'window_out'
  | 'window_back'
  | 'window_blur'
  | 'app_blur'
  | 'app_focus'
  | 'fullscreen_exit'
  | 'visibility_lost'
  | 'visibility_restored'
  | 'camera_lost'
  | 'face_not_recognized'
  | 'no_face'
  | 'multiple_faces'
  | 'joined'
  | 'submitted'
  | 'timeout_submit'
  | 'force_submitted'
  | 'visibility_breaks_exceeded'
  | 'face_warnings_exceeded';

export interface RecordEventPayload {
  event_type: ProctoringEventType;
  event_data?: Record<string, unknown>;
}

export interface RecordEventResponse {
  logged: boolean;
  warning: boolean;
  severity: 'info' | 'warning' | 'danger';
  message: string;
  event_type: ProctoringEventType;
  count: number;
  max: number;
  remaining: number | null;
  rule: 'visibility_breaks' | 'face_warnings' | null;
  force_submitted: boolean;
  submission: Record<string, unknown> | null;
}

export class ExamSessionApiClient extends BaseRestApiClient {
  public async join(token: string, options?: RequestInit): Promise<JoinSessionResponse> {
    return this.get<JoinSessionResponse>(`/api/v1/consumer/course/exam-sessions/${token}/`, options);
  }

  public async mySession(examUid: string, options?: RequestInit): Promise<ExamSessionInfo | null> {
    return this.get<ExamSessionInfo | null>(`/api/v1/consumer/course/exams/${examUid}/sessions/me/`, options);
  }

  public async recordEvent(
    sessionUid: string,
    payload: RecordEventPayload,
    options?: RequestInit,
  ): Promise<RecordEventResponse> {
    return this.post<RecordEventResponse>(
      `/api/v1/consumer/course/exam-sessions/${sessionUid}/events/`,
      payload,
      options,
    );
  }
}

export const examSessionApi = new ExamSessionApiClient();
