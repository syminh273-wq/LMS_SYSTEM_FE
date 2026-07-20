import type { IssuedCertificate } from './certificate';

export type QuizStatus = 'draft' | 'published' | 'archived';

export type QuizQuestion = {
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
};

export type QuizQuestionPublic = {
  uid: string;
  quiz_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  order: number;
};

export type UpdateQuestionRequest = {
  correct_answer: 'a' | 'b' | 'c' | 'd';
};

export type QuizAssignment = {
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
};

export type Quiz = {
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
};

export type QuizSummary = {
  uid: string;
  created_by: string;
  resource_id?: string | null;
  title: string;
  description: string;
  questions_count: number;
  status: string;
  time_limit_seconds: number;
  max_attempts: number;
  created_at?: string;
  updated_at?: string;
};

export type QuizAttemptRecord = {
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
};

export type QuizPlayRecord = QuizAttemptRecord;

export type QuizDetail = Quiz & {
  questions: QuizQuestion[];
};

export type QuizPublicDetail = QuizSummary & {
  questions: QuizQuestionPublic[];
};

export type QuizType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'scenario';

export type QuizTypeOption = {
  value: QuizType;
  label: string;
};

export type GenerateQuizRequest = {
  content?: string;
  resource_id?: string;
  quiz_type?: QuizType;
  num_questions?: number;
  max_content_length?: number;
};

export type UpdateQuizRequest = {
  title?: string;
  description?: string;
  status?: QuizStatus;
};

export type UpdateAssignmentRequest = {
  time_limit_seconds?: number;
  max_attempts?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_explanation?: boolean;
  passing_score_pct?: number;
};

export type QuizStreamMetaEvent = {
  type: 'meta';
  quiz_uid: string;
  title: string;
  description: string;
};

export type QuizStreamQuestionEvent = {
  type: 'question';
  index: number;
  question_uid: string;
  question: string;
  options: Record<'a' | 'b' | 'c' | 'd', string>;
  correct: 'a' | 'b' | 'c' | 'd';
  explanation: string;
};

export type QuizStreamDoneEvent = {
  type: 'done';
  total: number;
  quiz_uid: string | null;
};

export type QuizStreamErrorEvent = {
  type: 'error';
  detail: string;
};

export type QuizStreamEvent =
  | QuizStreamMetaEvent
  | QuizStreamQuestionEvent
  | QuizStreamDoneEvent
  | QuizStreamErrorEvent;

export type QuizSubmitRequest = {
  answers: Record<string, 'a' | 'b' | 'c' | 'd'>;
  classroom_id: string;
  time_taken_seconds?: number;
};

export type QuizResult = {
  total: number;
  correct: number;
  score: number;
  is_passed?: boolean;
  passing_score?: number;
  attempt_number: number;
  attempts_used: number;
  attempts_remaining: number | null;
  results: Array<{
    question_uid: string;
    question_text: string;
    chosen: string | null;
    correct_answer: string;
    is_correct: boolean;
    explanation: string;
  }>;
  show_explanation?: boolean;
  certificate_issued?: IssuedCertificate[];
};
