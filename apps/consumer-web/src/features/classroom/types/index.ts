export interface Classroom {
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
}

export interface ClassroomMember {
  member_id: string;
  member_type: 'space' | 'consumer';
  member_name: string;
  member_avatar: string;
  role: 'teacher' | 'student';
  status: 'pending' | 'approved';
  joined_at: string;
}

export interface BlacklistEntry {
  scope_id: string;
  consumer_uid: string;
  scope: 'global' | 'classroom';
  reason: string;
  added_by: string;
  created_at: string;
}

export interface SharingLink {
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
}

export interface ActivityLog {
  uid: string;
  log_level: 'major' | 'detail';
  event_type: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  target_id: string | null;
  target_name: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface StudentPublicProfile {
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
}

export interface CreateClassroomRequest {
  name: string;
  description: string;
  max_students: number;
}

export interface UpdateClassroomRequest {
  name?: string;
  description?: string;
  max_students?: number;
}

export interface AddBlacklistRequest {
  consumer_uid: string;
  reason?: string;
}

export interface PaginatedResponse<T> {
  links: {
    next: string | null;
    previous: string | null;
  };
  count: number;
  total_pages: number;
  current_page: number;
  results: T[];
}
