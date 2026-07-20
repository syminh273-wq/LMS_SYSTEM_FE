import BaseRestApiClient from '@/core/api/client';
import type {
  QuizTask,
  QuizTaskStatus,
  CreateQuizTaskRequest,
  CreateQuizTaskResponse,
} from '@lms/types';

export type CreateGenerateTaskInput = {
  title?: string;
  content?: string;
  resource_id?: string;
  quiz_type?: string;
  num_questions?: number;
  max_content_length?: number;
  file?: File;
};

export class QuizTasksApiClient extends BaseRestApiClient {
  public async createGenerateTask(input: CreateGenerateTaskInput): Promise<CreateQuizTaskResponse> {
    const path = '/api/v1/space/quiz/generate-task/';

    if (input.file) {
      const formData = new FormData();
      formData.append('file', input.file);
      if (input.title) formData.append('title', input.title);
      if (input.quiz_type) formData.append('quiz_type', input.quiz_type);
      if (input.num_questions != null) formData.append('num_questions', String(input.num_questions));
      if (input.max_content_length != null) formData.append('max_content_length', String(input.max_content_length));
      return this.post<CreateQuizTaskResponse>(path, formData);
    }

    const body: CreateQuizTaskRequest = {
      kind: 'generate',
      payload: {
        content: input.content,
        resource_id: input.resource_id,
        quiz_type: input.quiz_type,
        num_questions: input.num_questions,
        max_content_length: input.max_content_length,
      },
      title: input.title,
    };
    return this.post<CreateQuizTaskResponse>(path, body);
  }

  public async list(status?: QuizTaskStatus | QuizTaskStatus[]): Promise<QuizTask[]> {
    let path = '/api/v1/space/quiz/tasks/';
    if (status) {
      const value = Array.isArray(status) ? status.join(',') : status;
      path += `?status=${encodeURIComponent(value)}`;
    }
    const response = await this.get<QuizTask[] | { results: QuizTask[] }>(path);
    return Array.isArray(response) ? response : response.results;
  }

  public async retrieve(taskId: string): Promise<QuizTask> {
    return this.get<QuizTask>(`/api/v1/space/quiz/tasks/${taskId}/`);
  }

  public async retry(taskId: string): Promise<QuizTask> {
    return this.post<QuizTask>(`/api/v1/space/quiz/tasks/${taskId}/retry/`, {});
  }

  public async dismiss(taskId: string): Promise<QuizTask> {
    return this.post<QuizTask>(`/api/v1/space/quiz/tasks/${taskId}/dismiss/`, {});
  }
}

export const quizTasksApi = new QuizTasksApiClient();
