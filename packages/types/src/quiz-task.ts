export type QuizTaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'archived';

export type QuizTaskKind = 'generate';

export type QuizTask = {
  id: string;
  kind: QuizTaskKind;
  title: string;
  status: QuizTaskStatus;
  progress: number;
  total_steps: number;
  current_step: number;
  quiz_uid: string | null;
  error_message: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type CreateQuizTaskRequest = {
  kind: QuizTaskKind;
  payload: Record<string, unknown>;
  title?: string;
};

export type CreateQuizTaskResponse = {
  task_id: string;
  status: QuizTaskStatus;
  title: string;
};
