export type ExamContentType = 'markdown' | 'file' | 'pdf' | 'image' | 'quiz';
export type ExamStatus = 'draft' | 'published' | 'closed' | 'ongoing';
export type ExamMode = 'online' | 'offline';
export type ExamSessionStatus = 'pending' | 'active' | 'expired' | 'completed';
export type ExamSubmissionType = 'multiple_choice' | 'online_quiz' | 'file' | 'essay';

export interface ExamMeta {
  url?: string;
  name?: string;
  size?: number;
  mime?: string;
  [key: string]: unknown;
}

export interface Exam {
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
  max_tab_leaves?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ExamSession {
  uid: string;
  exam_id: string;
  student_id: string;
  token: string;
  token_status: ExamSessionStatus;
  token_expires_at: string | null;
  started_at: string | null;
  ends_at: string | null;
}

export interface ExamSubmission {
  uid: string;
  exam_id: string;
  classroom_id: string;
  student_id: string;
  submission_type: ExamSubmissionType;
  ref_id?: string | null;
  content: string;
  meta: Record<string, unknown>;
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
  content_type?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AIGradeRequest {
  rubric?: string;
  max_grade?: number;
  overwrite?: boolean;
  top_k?: number;
}

export interface AIGradeBatchResponse {
  total: number;
  graded: number;
  failed: number;
  results: Array<{
    success: boolean;
    error: string;
    submission: ExamSubmission;
  }>;
}

export interface OpenOnlineResponse {
  exam: Exam;
  sessions: ExamSession[];
  expires_in_minutes: number;
}

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

export interface AuditLogEntry {
  uid: string;
  event_type: AuditEventType | string;
  event_data?: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditOverviewCounters {
  visibility_breaks: { count: number; max: number; rule: 'visibility_breaks' };
  face_warnings: { count: number; max: number; rule: 'face_warnings' };
}

export interface AuditOverviewResponse {
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
}

export interface AuditDetailsResponse {
  submission_uid: string;
  student_id: string;
  events: AuditLogEntry[];
}

export interface AuditQuizAnswer {
  question_uid: string;
  question_text: string;
  chosen: string | null;
  correct_answer: string | null;
  is_correct: boolean;
  explanation?: string;
}

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

export interface FaceLogEntry {
  uid: string;
  student_id: string;
  camera_open: boolean;
  recognized: boolean;
  multiple_faces: boolean;
  face_count: number;
  similarity: number;
  verified_at: string | null;
}

export interface CreateExamRequest {
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
}

export interface UpdateExamRequest {
  classroom_id?: string;
  title?: string;
  description?: string;
  content_type?: ExamContentType;
  body?: string;
  ref_id?: string | null;
  due_date?: string | null;
  status?: ExamStatus;
  exam_mode?: ExamMode;
  duration_seconds?: number;
  camera_required?: boolean;
  exam_type?: 'assignment' | 'quiz';
  max_grade?: number;
}

export interface GradeSubmissionRequest {
  grade?: number;
  feedback?: string;
}

export interface OpenOnlineSettings {
  late_threshold_seconds: number;
  duration_seconds: number;
  camera_required: boolean;
  max_face_warnings: number;
}
