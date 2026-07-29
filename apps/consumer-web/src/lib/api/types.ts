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
  category?: 'math' | 'physics' | 'chemistry' | 'biology' | 'language' | 'programming' | 'business' | 'design' | 'music' | 'other';
  visibility_type?: 'public' | 'private';
  preview_folder_uid?: string | null;
  has_paid?: boolean;
  is_joined?: boolean;
  join_required?: boolean;
  has_access?: boolean;
  requires_payment?: boolean;
  is_paid_classroom?: boolean;
  resolve_link?: SharingLink;
  is_favorited?: boolean;
  favorite_count?: number;
  member_count?: number;
  title?: string;
  created_at: string;
  updated_at: string;
};

type ClassroomPreviewActionType = 'join' | 'checkout' | 'none';

export type ClassroomPreviewResponse = {
  classroom: Classroom & { is_favorited?: boolean; favorite_count?: number };
  preview: {
    folder: { uid: string; name: string } | null;
    items: Array<
      | {
          type: 'folder';
          uid: string;
          name: string;
          parent_folder_id: string | null;
          is_preview_only: boolean;
          depth: number;
        }
      | {
          type: 'doc';
          uid: string;
          name: string;
          url: string;
          file_type: string;
          size: number;
          folder_id: string;
          depth: number;
        }
    >;
  };
  actions: {
    type: ClassroomPreviewActionType;
    requires_payment: boolean;
    membership_status: 'pending' | 'approved' | null;
    pay_url: string | null;
    amount: number;
  };
  is_favorited: boolean;
  favorite_count: number;
};

export type ClassroomFavoriteItem = {
  classroom: Classroom;
  created_at: string;
};

export type LeaderboardEntry = {
  rank: number;
  student_id: string;
  student_name: string;
  student_avatar: string;
  total_xp: number;
  level: number;
  level_title: string;
  total_score: number;
  quiz_avg: number;
  exam_avg: number;
  quiz_count: number;
  exam_count: number;
  attendance_pct: number;
  explanation: string;
};

export type LeaderboardResponse = {
  classroom_uid: string;
  total_students: number;
  my_rank: number | null;
  my_score: number | null;
  my_xp: number;
  entries: LeaderboardEntry[];
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

export type ChatMessage = {
  uid: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string | null;
};

export type Message = {
  uid: string;
  conversation_uid: string;
  msg_type: string;
  content: string;
  sender_id: string | null;
  sender_type: string;
  sender_name: string;
  sender_avatar?: string | null;
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
type ExamStatus = 'draft' | 'published' | 'closed' | 'ongoing';
type ExamSessionStatus = 'pending' | 'active' | 'expired' | 'completed';

type ExamMeta = {
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
  resource_name?: string;
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

type QuizPlayRecord = {
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
  time_limit_seconds?: number;
  max_attempts?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_explanation?: boolean;
  passing_score_pct?: number;
  is_closed?: boolean;
  is_open?: boolean;
  is_expired?: boolean;
  is_not_yet_open?: boolean;
  opens_at?: string | null;
  closes_at?: string | null;
  closed_at?: string | null;
  server_now?: string | null;
};

export type QuizLeaderboardEntry = {
  rank: number;
  student_id: string;
  student_name: string;
  student_avatar: string;
  best_score_pct: number;
  best_score: number;
  best_total_questions: number;
  best_time_taken_seconds: number;
  best_attempt_uid: string | null;
  best_attempt_number: number;
  best_submitted_at: string | null;
  attempts_count: number;
};

type QuizLeaderboardMe = {
  rank: number;
  best_score_pct: number;
  best_time_taken_seconds: number;
  best_attempt_uid: string | null;
  attempts_count: number;
};

export type QuizLeaderboardResponse = {
  quiz_id: string;
  classroom_id: string;
  total_students: number;
  top_3: QuizLeaderboardEntry[];
  entries: QuizLeaderboardEntry[];
  me: QuizLeaderboardMe | null;
  closed_at?: string | null;
  closes_at?: string | null;
};

type QuizLeaderboardAttempt = {
  attempt_uid: string | null;
  attempt_number: number;
  score: number;
  total_questions: number;
  score_pct: number;
  time_taken_seconds: number;
  submitted_at: string | null;
};

export type QuizLeaderboardStudentDetail = {
  student_id: string;
  student_name: string;
  student_avatar: string;
  rank: number | null;
  best_score_pct: number;
  best_time_taken_seconds: number;
  best_attempt_uid: string | null;
  attempts_count: number;
  attempts: QuizLeaderboardAttempt[];
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
  force_submitted?: boolean;
  force_submit_reason?: string;
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

type SocialLink = {
  platform: 'facebook' | 'linkedin' | 'github' | 'twitter' | 'instagram' | 'website' | string;
  url: string;
  label: string;
};

type Certificate = {
  title: string;
  issuer: string;
  issued_date: string;
  url: string;
  badge_url?: string;
};

type CustomField = {
  key: string;
  value: string;
};

type ProfileMetadata = {
  hobbies?: string[];
  social_links?: SocialLink[];
  certificates?: Certificate[];
  custom_fields?: CustomField[];
};

type ThemeColor = 'indigo' | 'rose' | 'emerald' | 'amber' | 'violet';
type CoverStyle = 'gradient' | 'solid' | 'mesh';
type ProfileVisibility = 'public' | 'class_only' | 'private';

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
  author_type: 'consumer' | 'space';
  space_uid: string | null;
  content: string;
  emotion: PostEmotion;
  image_url: string;
  image_urls?: string[];
  visibility: PostVisibility;
  classroom_tag: string[] | string | null;
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
  image_urls?: string[];
  visibility: PostVisibility;
  classroom_tag?: string[] | string | null;
};

export type SuggestedUser = {
  consumer_uid: string;
  name: string;
  username: string;
  avatar: string;
  role: string;
  kind: 'consumer' | 'space';
  bio: string;
  major: string;
  department: string;
  followers_count: number;
};

export type SuggestionsResponse = {
  count: number;
  results: SuggestedUser[];
};

type QuizCollectionItem = {
  quiz_id: string;
  order: number;
  added_at: string;
};

type QuizCollectionAssignment = {
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

type PricingType = 'free' | 'paid';
type CourseStatus = 'draft' | 'published' | 'archived';

type CourseMaterial = {
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

type CoursePreviewLesson = {
  uid: string;
  title: string;
  description: string;
  order_index: number;
  duration_seconds: number;
  video_url: string | null;
  material_urls: CourseMaterial[];
};

type CoursePreviewCourse = {
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

// ── Ranking / XP / Level / Achievements ─────────────────────────────────────

export type RankingProfile = {
  student_id: string;
  total_xp: number;
  level: number;
  current_level_xp: number;
  next_level_xp: number;
  progress_pct: number;
  xp_to_next_level: number;
  streak_days: number;
  last_active_date: string | null;
  classrooms_joined_count: number;
  quizzes_passed_count: number;
  exams_passed_count: number;
  perfect_scores_count: number;
  certificates_count: number;
  attendance_count: number;
  level_title: string;
};

export type XpTransaction = {
  uid: string;
  event_type: string;
  delta_xp: number;
  ref_type?: string;
  ref_id?: string | null;
  classroom_id?: string | null;
  description?: string;
  created_at: string;
};

export type Achievement = {
  code: string;
  title: string;
  description: string;
  icon: string;
  target_value: number;
  current_value: number;
  progress_pct: number;
  is_unlocked: boolean;
  unlocked_at?: string | null;
};

export type GlobalLeaderboardEntry = {
  rank: number;
  student_id: string;
  student_name: string;
  student_avatar: string;
  total_xp: number;
  level: number;
};

export type GlobalLeaderboardResponse = {
  period: 'all' | 'week' | 'month';
  total_students: number;
  entries: GlobalLeaderboardEntry[];
};

export type MyRankResponse = {
  rank: number | null;
  total_xp: number;
  level: number;
  student_id: string;
};

type LevelDefinition = {
  level: number;
  required_xp: number;
  title: string;
};

export type LevelsResponse = {
  levels: LevelDefinition[];
};

export type AchievementsCatalogResponse = {
  achievements: Array<{
    code: string;
    title: string;
    description: string;
    icon: string;
    target_value: number;
  }>;
};

export type LeaderboardPeriod = 'all' | 'week' | 'month';
