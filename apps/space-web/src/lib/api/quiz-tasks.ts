import AbstractRestApiClient from './client';
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
  num_options?: number;
  option_counts?: number[]; // per-question option count, overrides num_options/num_questions when set
  correct_counts?: number[]; // per-question required number of correct answers (multi_answer only), same length as option_counts
};

class QuizTasksApiClient extends AbstractRestApiClient {
  private async createTask(path: string, input: CreateGenerateTaskInput): Promise<CreateQuizTaskResponse> {
    const formData = new FormData();
    formData.append('file', input.file);
    if (input.title) formData.append('title', input.title);
    if (input.num_questions != null) formData.append('num_questions', String(input.num_questions));
    if (input.max_content_length != null) formData.append('max_content_length', String(input.max_content_length));
    if (input.num_options != null) formData.append('num_options', String(input.num_options));
    // DRF's ListField reads repeated multipart fields (getlist), not a JSON string — append one per value.
    if (input.option_counts) {
      for (const count of input.option_counts) formData.append('option_counts', String(count));
    }
    if (input.correct_counts) {
      for (const count of input.correct_counts) formData.append('correct_counts', String(count));
    }
    return this.post<CreateQuizTaskResponse>(path, formData);
  }

  public async createGenerateTask(input: CreateGenerateTaskInput): Promise<CreateQuizTaskResponse> {
    return this.createTask('/api/v1/space/quiz/generate-task/', input);
  }

  public async createGenerateTaskMulti(input: CreateGenerateTaskInput): Promise<CreateQuizTaskResponse> {
    return this.createTask('/api/v1/space/quiz/generate-task-multi/', input);
  }

  public async createGenerateTaskTf(input: CreateGenerateTaskInput): Promise<CreateQuizTaskResponse> {
    return this.createTask('/api/v1/space/quiz/generate-task-tf/', input);
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
