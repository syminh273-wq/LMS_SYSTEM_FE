export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  full_name?: string;
};

export type AuthTokenResponse = {
  access: string;
  refresh: string;
  message: string;
};

export type ApiMessageResponse = {
  message: string;
};

export type Consumer = {
  uid: string;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  avatar_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateConsumerRequest = {
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
};

export type UpdateConsumerRequest = {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
};

export type Space = {
  uid: string;
  owner_uid: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  cover_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateSpaceRequest = {
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
};

export type UpdateSpaceRequest = {
  name?: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
};

export type Classroom = {
  uid: string;
  pid: string;
  name: string;
  description: string;
  max_students: number;
  status: string;
  teacher_id: string;
  resolve_link?: SharingLink;
  created_at: string;
  updated_at: string;
};

export type PaginatedResponse<T> = {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  current_page: number;
  results: T[];
};

export type CreateClassroomRequest = {
  name: string;
  description: string;
  max_students: number;
};

export type Conversation = {
  uid: string;
  type: string;
  name: string;
  description: string;
  classroom_uid: string | null;
  member_count: number;
  last_msg_text: string;
  last_msg_sender: string;
  last_msg_at: string | null;
  created_at: string;
};

export type Message = {
  uid: string;
  conversation_uid: string;
  msg_type: string;
  content: string;
  sender_id: string | null;
  sender_type: string;
  sender_name: string;
  attachment: {
    uid: string | null;
    url: string;
    name: string;
    size: number;
    type: string;
  } | null;
  created_at: string;
};

export type Exam = {
  uid: string;
  classroom_id: string;
  title: string;
  description: string;
  content_type: 'markdown' | 'file' | 'pdf' | 'image';
  content: string;
  status: 'draft' | 'published' | 'closed';
  due_date: string;
  resource_uid?: string | null;
  resource_url?: string | null;
  resource_name?: string;
  created_at?: string;
  updated_at?: string;
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

export type QuizPublicDetail = QuizSummary & {
  questions: QuizQuestionPublic[];
};

export type QuizSubmitRequest = {
  answers: Record<string, 'a' | 'b' | 'c' | 'd'>;
  classroom_id: string;
  time_taken_seconds?: number;
};

export type QuizResult = {
  total: number;
  correct: number;
  score: number;
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
};

export type SharingLink = {
  uid: string;
  code: string;
  resource_type: string;
  resource_id: string;
  action: string;
  expired_at: string;
  max_usage: number;
  used_count: number;
  is_active: boolean;
  metadata: Record<string, string>;
  qr_code_url: string | null;
  created_at: string;
  updated_at: string;
};
