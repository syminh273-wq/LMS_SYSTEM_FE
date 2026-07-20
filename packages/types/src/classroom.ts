import {ExamSubmission} from "./exam";

export type Classroom = {
  uid: string;
  pid: string;
  name: string;
  description: string;
  max_students: number;
  status: string;
  membership_status?: 'approved' | 'pending';
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

export type UpdateClassroomRequest = Partial<CreateClassroomRequest>;

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
