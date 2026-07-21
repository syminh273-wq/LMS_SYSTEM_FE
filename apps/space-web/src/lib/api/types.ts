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
  first_name: string;
  last_name: string;
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
  pricing_type?: 'free' | 'paid';
  price_vnd?: number;
  category?: 'math' | 'physics' | 'chemistry' | 'biology' | 'language' | 'programming' | 'business' | 'design' | 'music' | 'other';
  visibility_type?: 'public' | 'private';
  preview_folder_uid?: string | null;
  membership_status?: 'pending' | 'approved' | null;
  has_paid?: boolean;
  is_joined?: boolean;
  join_required?: boolean;
  has_access?: boolean;
  has_paid?: boolean;
  is_paid_classroom?: boolean;
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
  pricing_type?: 'free' | 'paid';
  price_vnd?: number;
  category?: 'math' | 'physics' | 'chemistry' | 'biology' | 'language' | 'programming' | 'business' | 'design' | 'music' | 'other';
  visibility_type?: 'public' | 'private';
};

export type UpdateClassroomRequest = Partial<CreateClassroomRequest>;

export type ExamContentType = 'markdown' | 'file' | 'pdf' | 'image' | 'quiz';
export type ExamStatus = 'draft' | 'published' | 'closed' | 'ongoing';
export type ExamMode = 'online' | 'offline';
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
  exam_mode?: ExamMode;
  duration_seconds?: number;
  camera_required?: boolean;
  is_online_active?: boolean;
  opened_at?: string | null;
  late_threshold_seconds?: number;
  due_date: string;
  exam_type?: 'assignment' | 'quiz';
  max_grade?: number;
  max_visibility_breaks?: number;
  max_face_warnings?: number;
  created_at?: string;
  updated_at?: string;
};

export type ExamSession = {
  uid: string;
  exam_id: string;
  student_id: string;
  token: string;
  token_status: ExamSessionStatus;
  token_expires_at: string | null;
  started_at: string | null;
  ends_at: string | null;
};

export type OpenOnlineResponse = {
  exam: Exam;
  sessions: ExamSession[];
  expires_in_minutes: number;
};

export type ExamSubmissionType = 'multiple_choice' | 'online_quiz' | 'file' | 'essay';

export type ExamSubmission = {
  uid: string;
  exam_id: string;
  classroom_id: string;
  student_id: string;
  submission_type: ExamSubmissionType;
  ref_id?: string | null;
  content: string;
  meta: Record<string, unknown>;
  // convenience fields from meta
  resource_url?: string | null;
  resource_name?: string;
  quiz_result?: {
    correct_count: number;
    total: number;
    score_pct: number;
  } | null;
  status: string;
  submitted_at: string | null;
  grade?: number | null;
  max_grade?: number | null;
  passed?: boolean | null;
  feedback?: string;
  graded_by?: string | null;
  graded_at?: string | null;
  grading_method?: 'auto' | 'manual' | 'ai';
  returned_at?: string | null;
  ai_model?: string;
  ai_rubric?: string;
  ai_reason?: string;
  ai_breakdown?: Array<{
    question: string;
    score: number;
    max_score: number;
    reason: string;
  }>;
  ai_sources?: Array<{
    resource_uid?: string | null;
    doc_name?: string;
    doc_url?: string | null;
    page?: number | string | null;
    score?: number;
  }>;
  ai_confidence?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type AIGradeRequest = {
  rubric?: string;
  max_grade?: number;
  overwrite?: boolean;
  top_k?: number;
};

export type AIGradeBatchResponse = {
  total: number;
  graded: number;
  failed: number;
  results: Array<{
    success: boolean;
    error: string;
    submission: ExamSubmission;
  }>;
};

export type CreateExamRequest = {
  classroom_id: string;
  title: string;
  description: string;
  content_type: ExamContentType;
  body: string;
  ref_id?: string | null;
  due_date: string | null;
  status?: ExamStatus;
  exam_mode?: ExamMode;
  duration_seconds?: number;
  camera_required?: boolean;
  exam_type?: 'assignment' | 'quiz';
  max_grade?: number;
};

export type UpdateExamRequest = Partial<Omit<CreateExamRequest, 'classroom_id'>> & {
  classroom_id?: string;
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

export type QuizDetail = Quiz & {
  questions: QuizQuestion[];
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

export type MsgType = 'text' | 'image' | 'video' | 'audio' | 'pdf' | 'file';

export type ChatAttachment = {
  uid: string | null;
  url: string;
  name: string;
  size: number;
  type: MsgType;
};

export type ChatMessage = {
  uid: string;
  conversation_uid: string;
  msg_type: MsgType;
  content: string;
  sender_id: string | null;
  sender_type: 'space' | 'consumer' | string;
  sender_name: string;
  attachment: ChatAttachment | null;
  created_at: string;
};

export type ChatConversation = {
  uid: string;
  type: 'channel' | 'direct';
  name: string;
  description: string;
  classroom_uid: string | null;
  member_count: number;
  last_msg_text: string;
  last_msg_sender: string;
  last_msg_at: string | null;
  created_at: string;
};

export type ClassroomMember = {
  member_id: string;
  member_type: 'space' | 'consumer';
  member_name: string;
  member_avatar: string;
  role: 'teacher' | 'student';
  status: 'pending' | 'approved';
  joined_at: string;
};

export type BlacklistEntry = {
  scope_id: string;
  consumer_uid: string;
  scope: 'global' | 'classroom';
  reason: string;
  added_by: string;
  created_at: string;
};

export type StudentExamRecord = {
  exam: {
    uid: string;
    title: string;
    status: string;
    due_date: string | null;
  };
  submission: ExamSubmission | null;
};


export type ActivityLogLevel = 'major' | 'detail';

export type ActivityLogEventType =
  | 'classroom_created'
  | 'document_uploaded' | 'document_deleted'
  | 'exam_created' | 'exam_published' | 'exam_opened' | 'exam_closed' | 'exam_deleted'
  | 'quiz_assigned'
  | 'meeting_started' | 'meeting_ended'
  | 'member_joined' | 'member_approved' | 'member_rejected' | 'member_kicked' | 'member_left'
  | 'exam_submitted';

export type ActivityLog = {
  uid: string;
  log_level: ActivityLogLevel;
  event_type: ActivityLogEventType;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  target_id: string | null;
  target_name: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

// ── Teacher Contact / Student Roster ─────────────────────────────────────────

export type TeacherContact = {
  consumer_uid: string;
  consumer_name: string;
  first_name: string;
  last_name: string;
  consumer_email: string;
  consumer_avatar: string;
  first_joined_at: string | null;
};

export type StudentClassroomStat = {
  classroom: {
    uid: string;
    name: string;
    description: string;
    status: string;
    pid: string;
  };
  joined_at: string | null;
  total_exams: number;
  submitted_count: number;
  avg_grade: number | null;
};

export type StudentDetail = {
  consumer: {
    uid: string;
    full_name: string;
    email: string;
    avatar_url: string;
    first_joined_at: string | null;
  };
  classrooms: StudentClassroomStat[];
};

// ── Student Public Profile (teacher view) ────────────────────────────────────

export type StudentPublicProfile = {
  consumer_uid: string;
  bio: string;
  address: string;
  city: string;
  country: string;
  theme_color: string;
  show_stats: boolean;
  show_address: boolean;
  show_links: boolean;
  show_hobbies: boolean;
  show_certificates: boolean;
  profile_visibility: 'public' | 'class_only' | 'private';
  metadata: {
    hobbies?: string[];
    social_links?: { platform: string; url: string; label: string }[];
    certificates?: { title: string; issuer: string; issued_date: string; url: string }[];
    custom_fields?: { key: string; value: string }[];
  };
  consumer: {
    uid: string;
    username: string;
    email: string;
    full_name: string;
    phone: string;
    avatar_url: string;
  } | null;
};

export type Certificate = {
  uid: string;
  created_by: string;
  name: string;
  description: string;
  template_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateCertificateRequest = {
  name: string;
  description?: string;
  template_url?: string;
  is_active?: boolean;
};

export type UpdateCertificateRequest = {
  name?: string;
  description?: string;
  template_url?: string | null;
  is_active?: boolean;
};

export type QuizCollectionItem = {
  quiz_id: string;
  order: number;
  added_at: string;
};

export type QuizCollectionAssignment = {
  collection_id: string;
  classroom_id: string;
  assigned_by: string;
  assigned_at: string;
};

export type QuizCollection = {
  uid: string;
  created_by: string;
  title: string;
  description: string;
  quiz_count: number;
  certificate_id: string | null;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
};

export type QuizCollectionDetail = QuizCollection & {
  items: QuizCollectionItem[];
  assignments: QuizCollectionAssignment[];
};

export type CreateQuizCollectionRequest = {
  title: string;
  description?: string;
  certificate_id?: string | null;
};

export type UpdateQuizCollectionRequest = {
  title?: string;
  description?: string;
  status?: 'draft' | 'published' | 'archived';
  certificate_id?: string | null;
};

export type AddQuizToCollectionRequest = {
  quiz_ids: string[];
};

export type ReorderCollectionRequest = {
  ordered_quiz_ids: string[];
};

export type AssignCollectionRequest = {
  classroom_id: string;
};

// ── Quiz Generation Task (Background) ────────────────────────────────────────

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

// ── Audit log (teacher) ───────────────────────────────────────────────────

export type AuditEventType =
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
  | 'face_recognized'
  | 'joined'
  | 'submitted'
  | 'timeout_submit'
  | 'force_submitted'
  | 'visibility_breaks_exceeded'
  | 'face_warnings_exceeded';

export type AuditLogEntry = {
  uid: string;
  event_type: AuditEventType | string;
  event_data?: Record<string, unknown> | null;
  created_at: string;
};

export type AuditOverviewCounters = {
  visibility_breaks: { count: number; max: number; rule: 'visibility_breaks' };
  face_warnings: { count: number; max: number; rule: 'face_warnings' };
};

export type AuditOverviewResponse = {
  submission: ExamSubmission;
  exam: {
    uid: string;
    title: string;
    max_visibility_breaks: number;
    max_face_warnings: number;
  };
  counters: AuditOverviewCounters;
  force_submitted: boolean;
  force_submit_reason: string;
  force_submitted_at: string | null;
  is_effective: boolean;
  totals: Record<string, number>;
};

export type AuditDetailsResponse = {
  submission_uid: string;
  student_id: string;
  events: AuditLogEntry[];
};

export type AuditQuizAnswer = {
  question_uid: string;
  question_text: string;
  chosen: string | null;
  correct_answer: string | null;
  is_correct: boolean;
  explanation?: string;
};

export type AuditAnswersResponse =
  | {
      submission_type: 'multiple_choice' | 'online_quiz';
      answers: AuditQuizAnswer[];
      score: {
        grade: number | null;
        max_grade: number | null;
        correct_count: number | null;
        total: number | null;
        score_pct: number | null;
      };
    }
  | {
      submission_type: 'file';
      file: { url: string | null; name: string | null; size: number | null };
      ref_id: string | null;
    }
  | {
      submission_type: 'essay';
      essay_content: string;
    };

export type FaceLogEntry = {
  uid: string;
  student_id: string;
  camera_open: boolean;
  recognized: boolean;
  multiple_faces: boolean;
  face_count: number;
  similarity: number;
  verified_at: string | null;
};

// ── Course Management ────────────────────────────────────────────────────────

export type PricingType = 'free' | 'paid';
export type CourseStatus = 'draft' | 'published' | 'archived';

export type CourseMaterial = {
  uid: string;
  name: string;
  url: string;
  file_type: string;
};

export type CourseLesson = {
  uid: string;
  course_uid: string;
  title: string;
  description: string;
  video_url: string | null;
  material_urls: CourseMaterial[];
  order_index: number;
  duration_seconds: number;
  is_preview: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type Course = {
  uid: string;
  pid: string;
  name: string;
  description: string;
  cover_url: string;
  teacher_id: string;
  pricing_type: PricingType;
  price_vnd: number;
  status: CourseStatus;
  classroom_uid: string | null;
  resolve_link?: SharingLink;
  lesson_count: number;
  enrollment_count: number;
  created_at: string;
  updated_at: string;
};

export type CreateCourseRequest = {
  name: string;
  description?: string;
  cover_url?: string;
  pricing_type?: PricingType;
  price_vnd?: number;
  status?: CourseStatus;
};

export type UpdateCourseRequest = Partial<CreateCourseRequest>;

export type CreateLessonRequest = {
  title: string;
  description?: string;
  video_resource_uid?: string | null;
  material_resource_uids?: string[];
  duration_seconds?: number;
  is_preview?: boolean;
  is_published?: boolean;
  order_index?: number | null;
};

export type UpdateLessonRequest = Partial<CreateLessonRequest>;

export type ReorderLessonItem = {
  uid: string;
  order_index: number;
};

export type CourseEnrollment = {
  consumer_id: string;
  consumer_name: string;
  consumer_avatar: string;
  enrolled_at: string;
  pricing_type: PricingType;
  amount_vnd: number;
  payment_order_id: string | null;
};

export type CourseStats = {
  total_enrollments: number;
  total_revenue_vnd: number;
  free_enrollments: number;
  paid_enrollments: number;
};