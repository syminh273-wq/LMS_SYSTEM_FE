export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
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
  pid: string;
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
  first_name?: string;
  last_name?: string;
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
  membership_status?: 'approved' | 'pending';
  teacher_id: string;
  pricing_type?: 'free' | 'paid';
  price_vnd?: number;
  preview_folder_uid?: string | null;
  has_access?: boolean;
  has_paid?: boolean;
  requires_payment?: boolean;
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
  // convenience fields populated by backend serializer from meta
  resource_url?: string | null;
  resource_name?: string;
  quiz_result?: {
    correct_count: number;
    total: number;
    score_pct: number;
    results?: Array<{
      question_uid: string;
      question_text: string;
      chosen: string | null;
      correct_answer: string;
      is_correct: boolean;
      explanation: string;
    }>;
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
  created_at?: string;
  updated_at?: string;
};

export type SubmitExamRequest = {
  submission_type?: ExamSubmissionType;
  ref_id?: string | null;
  answers?: Record<string, string>;
  content?: string;
  time_taken_seconds?: number;
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

export type QuizPlayRecord = {
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

/** @deprecated use QuizPlayRecord */
export type QuizAttemptRecord = QuizPlayRecord;

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

// ── Student Profile Settings ──────────────────────────────────────────────────

export type SocialLink = {
  platform: 'facebook' | 'linkedin' | 'github' | 'twitter' | 'instagram' | 'website' | string;
  url: string;
  label: string;
};

export type Certificate = {
  title: string;
  issuer: string;
  issued_date: string;
  url: string;
  badge_url?: string;
};

export type CustomField = {
  key: string;
  value: string;
};

export type ProfileMetadata = {
  hobbies?: string[];
  social_links?: SocialLink[];
  certificates?: Certificate[];
  custom_fields?: CustomField[];
};

export type ThemeColor = 'indigo' | 'rose' | 'emerald' | 'amber' | 'violet';
export type CoverStyle = 'gradient' | 'solid' | 'mesh';
export type ProfileVisibility = 'public' | 'class_only' | 'private';

export type StudentProfileSettings = {
  consumer_uid: string;
  bio: string;
  address: string;
  city: string;
  country: string;
  theme_color: ThemeColor;
  cover_style: CoverStyle;
  cover_value: string;
  show_stats: boolean;
  show_classrooms: boolean;
  show_grades: boolean;
  show_badges: boolean;
  show_address: boolean;
  show_links: boolean;
  show_hobbies: boolean;
  show_certificates: boolean;
  show_activity: boolean;
  show_contact: boolean;
  sections_order: string[];
  profile_visibility: ProfileVisibility;
  metadata: ProfileMetadata;
  updated_at: string | null;
};

export type PublicStudentProfile = StudentProfileSettings & {
  consumer: Consumer | null;
};

// ── Social Feed ───────────────────────────────────────────────────────────────

export type PostVisibility = 'public' | 'private' | 'friends';

export type PostEmotion = 'happy' | 'sad' | 'motivated' | 'excited' | 'tired' | 'thinking' | 'confident' | 'celebrating' | 'stressed' | 'loved' | '';

export type Post = {
  uid: string;
  consumer_uid: string;
  author_name: string;
  author_avatar: string;
  content: string;
  emotion: PostEmotion;
  image_url: string;
  visibility: PostVisibility;
  classroom_tag: string | null;
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
  created_at: string;
};

export type PostComment = {
  uid: string;
  post_uid: string;
  consumer_uid: string;
  author_name: string;
  author_avatar: string;
  content: string;
  created_at: string;
};

export type CreatePostRequest = {
  content: string;
  emotion?: PostEmotion;
  image_url?: string;
  visibility: PostVisibility;
  classroom_tag?: string;
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

export type QuizCollectionProgress = {
  total: number;
  passed: number;
  is_completed: boolean;
  percent: number;
  passed_quiz_ids: string[];
  missing_quiz_ids: string[];
};

export type IssuedCertificate = {
  uid: string;
  student_id: string;
  certificate_id: string;
  collection_id: string;
  classroom_id: string;
  issued_by: string | null;
  issued_at: string | null;
  issued_at_display?: string;
  pdf_url: string | null;
  verification_code: string;

  // Resolved human-friendly fields (filled by the backend)
  title?: string;
  description?: string;
  template_url?: string | null;

  collection_title?: string;
  collection_description?: string;

  student_name?: string;
  student_pid?: string;
  student_avatar_url?: string;

  classroom_name?: string;
};

export type NotificationMetadata = {
  classroom_uid?: string;
  classroom_name?: string;
  status?: string;
  student_uid?: string;
  student_name?: string;
  [key: string]: unknown;
};

export type NotificationItem = {
  uid: string;
  target_uid: string;
  notify_type: string;
  type?: string;
  title: string;
  content: string;
  metadata: string | NotificationMetadata;
  is_read: boolean;
  created_at: string;
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

export type CourseEnrolled = Course & {
  enrolled_at: string;
  enrollment_pricing_type: PricingType;
  enrollment_amount_vnd: number;
};

export type CoursePreviewLesson = {
  uid: string;
  title: string;
  description: string;
  order_index: number;
  duration_seconds: number;
  video_url: string | null;
  material_urls: CourseMaterial[];
};

export type CoursePreviewCourse = {
  uid: string;
  pid: string;
  name: string;
  description: string;
  cover_url: string;
  teacher_id: string;
  pricing_type: PricingType;
  price_vnd: number;
  status: CourseStatus;
};

export type CoursePreview = {
  course: CoursePreviewCourse;
  is_free: boolean;
  requires_payment: boolean;
  preview_lessons: CoursePreviewLesson[];
};

export type EnrollResponse = {
  enrollment: unknown;
  classroom_uid: string;
  redirect_to: string;
};

export type AccessResponse = {
  enrolled: boolean;
  classroom_uid?: string;
  redirect_to?: string;
};

export type CheckoutResponse = {
  order_id: string;
  pay_url: string;
  deeplink?: string;
  qr_code_url?: string;
};
