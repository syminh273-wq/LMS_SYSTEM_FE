import BaseRestApiClient from './client';
import type {
  QuizTask,
  QuizTaskStatus,
  CreateQuizTaskResponse,
} from './types';

type CreateGenerateTaskInput = {
  title?: string;
  file: File;
  num_questions?: number;
  max_content_length?: number;
};

class QuizTasksApiClient extends BaseRestApiClient {
  public async createGenerateTask(input: CreateGenerateTaskInput): Promise<CreateQuizTaskResponse> {
    const path = '/api/v1/space/quiz/generate-task/';

    const formData = new FormData();
    formData.append('file', input.file);
    formData.append('quiz_type', 'multiple_choice');
    if (input.title) formData.append('title', input.title);
    if (input.num_questions != null) formData.append('num_questions', String(input.num_questions));
    if (input.max_content_length != null) formData.append('max_content_length', String(input.max_content_length));
    return this.post<CreateQuizTaskResponse>(path, formData);
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
