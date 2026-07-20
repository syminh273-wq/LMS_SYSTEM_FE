export type QuizStatus = 'draft' | 'published' | 'archived';
export type QuizType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'scenario';

export interface QuizQuestion {
  uid: string;
  quiz_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'a' | 'b' | 'c' | 'd';
  explanation: string;
  order: number;
  created_at?: string;
}

export interface QuizAssignment {
  quiz_id: string;
  classroom_id: string;
  assigned_by: string;
  assigned_at: string;
  time_limit_seconds: number;
  max_attempts: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_explanation: boolean;
  passing_score_pct: number;
}

export interface Quiz {
  uid: string;
  created_by: string;
  resource_id?: string | null;
  title: string;
  description: string;
  questions_count: number;
  status: QuizStatus;
  assigned_classrooms?: QuizAssignment[];
  created_at?: string;
  updated_at?: string;
}

export interface QuizAttemptRecord {
  uid: string;
  quiz_id: string;
  student_id: string;
  classroom_id: string;
  attempt_number: number;
  score: number;
  total_questions: number;
  score_pct: number;
  time_taken_seconds: number;
  submitted_at: string;
}

export interface QuizDetail extends Quiz {
  questions: QuizQuestion[];
}

export interface QuizTypeOption {
  value: QuizType;
  label: string;
}

export interface QuizStreamMetaEvent {
  type: 'meta';
  quiz_uid: string;
  title: string;
  description: string;
}

export interface QuizStreamQuestionEvent {
  type: 'question';
  index: number;
  question_uid: string;
  question: string;
  options: Record<'a' | 'b' | 'c' | 'd', string>;
  correct: 'a' | 'b' | 'c' | 'd';
  explanation: string;
}

export interface QuizStreamDoneEvent {
  type: 'done';
  total: number;
  quiz_uid: string | null;
}

export interface QuizStreamErrorEvent {
  type: 'error';
  detail: string;
}

export type QuizStreamEvent =
  | QuizStreamMetaEvent
  | QuizStreamQuestionEvent
  | QuizStreamDoneEvent
  | QuizStreamErrorEvent;

export interface GenerateQuizRequest {
  content?: string;
  resource_id?: string;
  quiz_type?: QuizType;
  num_questions?: number;
  max_content_length?: number;
}

export interface UpdateQuizRequest {
  title?: string;
  description?: string;
  status?: QuizStatus;
}

export interface UpdateQuestionRequest {
  correct_answer: 'a' | 'b' | 'c' | 'd';
}

export interface UpdateAssignmentRequest {
  time_limit_seconds?: number;
  max_attempts?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_explanation?: boolean;
  passing_score_pct?: number;
}
