import BaseRestApiClient from './client';
import type {
  Quiz, QuizDetail, QuizTypeOption, GenerateQuizRequest,
  UpdateQuizRequest, UpdateAssignmentRequest,
  QuizStreamEvent, QuizAttemptRecord, QuizAssignment,
} from './types';

export class QuizApiClient extends BaseRestApiClient {
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

  public async getTypes(): Promise<QuizTypeOption[]> {
    return this.get<QuizTypeOption[]>('/api/v1/space/quiz/types/');
  }

  public async generate(data: GenerateQuizRequest): Promise<QuizDetail> {
    return this.post<QuizDetail>('/api/v1/space/quiz/generate/', data);
  }

  public async *generateStream(data: GenerateQuizRequest, file?: File): AsyncGenerator<QuizStreamEvent> {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let body: FormData | string;
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      if (data.quiz_type) formData.append('quiz_type', data.quiz_type);
      if (data.num_questions != null) formData.append('num_questions', String(data.num_questions));
      body = formData;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(data);
    }

    const res = await fetch(`${apiBase}/api/v1/space/quiz/generate-stream/`, {
      method: 'POST',
      headers,
      body,
    });

    if (!res.ok) throw new Error(`Generation failed: ${res.status}`);

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (!done) buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = done ? '' : (lines.pop() ?? '');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try { yield JSON.parse(line.slice(6)) as QuizStreamEvent; } catch { /* skip */ }
        }
      }
      if (done) break;
    }
  }

  public async update(uid: string, data: UpdateQuizRequest): Promise<Quiz> {
    return this.patch<Quiz>(`/api/v1/space/quiz/${uid}/`, data);
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

  public async unassignFromClassroom(uid: string, classroomId: string): Promise<void> {
    return super.delete<void>(`/api/v1/space/quiz/${uid}/unassign/${classroomId}/`);
  }

  public async getAttempts(uid: string, classroomId: string): Promise<QuizAttemptRecord[]> {
    return this.get<QuizAttemptRecord[]>(
      `/api/v1/space/quiz/${uid}/attempts/?classroom_id=${encodeURIComponent(classroomId)}`
    );
  }
}

export const quizApi = new QuizApiClient();
