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

export type ExamContentType = 'markdown' | 'file' | 'pdf' | 'image' | 'quiz';
export type ExamStatus = 'draft' | 'published' | 'closed' | 'ongoing';
export type ExamSessionStatus = 'pending' | 'active' | 'expired' | 'completed';

export type ExamMeta = {
  url?: string;
  name?: string;
  size?: number;
  mime?: string;
  [key: string]: unknown;
};

export type Exam = {
  uid: string;
  classroom_id: string;
  teacher_id?: string;
  title: string;
  description: string;
  content_type: ExamContentType;
  body: string;
  ref_id?: string | null;
  meta?: ExamMeta;
  status: ExamStatus;
  exam_mode?: 'online' | 'offline';
  duration_seconds?: number;
  camera_required?: boolean;
  is_online_active?: boolean;
  opened_at?: string | null;
  late_threshold_seconds?: number;
  due_date: string;
  exam_type?: 'assignment' | 'quiz';
  max_grade?: number;
  created_at?: string;
  updated_at?: string;
};

export type ExamSessionInfo = {
  uid: string;
  token: string;
  token_status: ExamSessionStatus;
  started_at: string | null;
  ends_at: string | null;
  time_remaining_seconds: number | null;
};

export type JoinSessionResponse = {
  exam: Exam;
  session: ExamSessionInfo;
};

export type ExamSubmission = {
  uid: string;
  exam_id: string;
  classroom_id: string;
  student_id: string;
  content_type: ExamContentType;
  content: string;
  resource_uid?: string | null;
  resource_url?: string | null;
  resource_name?: string;
  status: string;
  submitted_at: string | null;
  grade?: number | null;
  feedback?: string;
  graded_by?: string | null;
  graded_at?: string | null;
  quiz_result?: {
    grade: number;
    correct_count: number;
    total: number;
    feedback: string;
  } | null;
  created_at?: string;
  updated_at?: string;
};

export type SubmitExamRequest = {
  content_type: ExamContentType;
  content?: string;
  resource_uid?: string | null;
  answers?: Record<string, string>;
};

export type UploadedResource = {
  uid: string;
  url: string;
  name: string;
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

export type FaceClassroomSessionResponse = {
  is_verified: boolean;
  verified_at: string | null;
};

export type FaceClassroomVerifyResponse = {
  camera_open: boolean;
  recognized: boolean;
  multiple_faces: boolean;
  face_count: number;
  similarity: number;
  is_verified: boolean;
  error?: string;
};

export type FaceEnrollResponse = {
  message: string;
  enrolled_at: string;
};

export type FaceEnrollStatusResponse = {
  enrolled: boolean;
};

export type FaceVerifyResponse = {
  camera_open: boolean;
  recognized: boolean;
  multiple_faces: boolean;
  face_count: number;
  similarity: number;
  error?: string;
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
