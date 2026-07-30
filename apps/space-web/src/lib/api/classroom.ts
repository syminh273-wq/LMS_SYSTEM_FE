import BaseRestApiClient from './client';
import type {
  Classroom,
  ClassroomMember,
  ClassroomPreviewResponse,
  StudentExamRecord,
  StudentStatsResponse,
  PaginatedResponse,
  CreateClassroomRequest,
  UpdateClassroomRequest,
  SharingLink,
  ActivityLog,
  BlacklistEntry,
} from './types';

export type { Classroom };

class ClassroomApiClient extends BaseRestApiClient {
  constructor() {
    super();
  }

  public async list(page: number = 1): Promise<PaginatedResponse<Classroom>> {
    return this.get<PaginatedResponse<Classroom>>(`/api/v1/space/course/classrooms/?page=${page}`);
  }

  public async create(data: CreateClassroomRequest): Promise<Classroom> {
    return this.post<Classroom>('/api/v1/space/course/classrooms/', data);
  }

  public async retrieve(uid: string): Promise<Classroom> {
    return this.get<Classroom>(`/api/v1/space/course/classrooms/${uid}/`);
  }

  public async update(uid: string, data: UpdateClassroomRequest): Promise<Classroom> {
    return this.patch<Classroom>(`/api/v1/space/course/classrooms/${uid}/`, data);
  }

  public async delete<TResponse = any>(uid: string, options?: RequestInit): Promise<TResponse> {
    return super.delete<TResponse>(`/api/v1/space/course/classrooms/${uid}/`, options);
  }

  public async getSharingLink(uid: string): Promise<SharingLink> {
    return this.get<SharingLink>(`/api/v1/space/course/classrooms/${uid}/sharing_link/`);
  }

  public async members(uid: string): Promise<ClassroomMember[]> {
    return this.get<ClassroomMember[]>(`/api/v1/space/course/classrooms/${uid}/members/`);
  }

  public async pendingMembers(uid: string): Promise<ClassroomMember[]> {
    return this.get<ClassroomMember[]>(`/api/v1/space/course/classrooms/${uid}/members/?status=pending`);
  }

  public async approveMember(classroomUid: string, memberId: string): Promise<ClassroomMember> {
    return this.post<ClassroomMember>(`/api/v1/space/course/classrooms/${classroomUid}/members/${memberId}/approve/`);
  }

  public async rejectMember(classroomUid: string, memberId: string): Promise<void> {
    return super.delete(`/api/v1/space/course/classrooms/${classroomUid}/members/${memberId}/reject/`);
  }

  public async kickMember(classroomUid: string, memberId: string): Promise<void> {
    return super.delete(`/api/v1/space/course/classrooms/${classroomUid}/members/${memberId}/kick/`);
  }

  public async studentSubmissions(classroomUid: string, memberId: string): Promise<StudentExamRecord[]> {
    return this.get(`/api/v1/space/course/classrooms/${classroomUid}/members/${memberId}/submissions/`);
  }

  public async studentStats(classroomUid: string, memberId: string): Promise<StudentStatsResponse> {
    return this.get(`/api/v1/space/course/classrooms/${classroomUid}/members/${memberId}/stats/`);
  }

  // ── Classroom blacklist ────────────────────────────────────────────────────
  public async listClassroomBlacklist(uid: string): Promise<BlacklistEntry[]> {
    return this.get<BlacklistEntry[]>(`/api/v1/space/course/classrooms/${uid}/blacklist/`);
  }

  public async addClassroomBlacklist(uid: string, consumer_uid: string, reason = ''): Promise<BlacklistEntry> {
    return this.post<BlacklistEntry>(`/api/v1/space/course/classrooms/${uid}/blacklist/`, { consumer_uid, reason });
  }

  public async removeClassroomBlacklist(uid: string, consumer_uid: string): Promise<void> {
    return super.delete(`/api/v1/space/course/classrooms/${uid}/blacklist/${consumer_uid}/`);
  }

  // ── Global blacklist (all classrooms by this teacher) ─────────────────────
  public async listGlobalBlacklist(): Promise<BlacklistEntry[]> {
    return this.get<BlacklistEntry[]>('/api/v1/space/course/blacklist/');
  }

  public async addGlobalBlacklist(consumer_uid: string, reason = ''): Promise<BlacklistEntry> {
    return this.post<BlacklistEntry>('/api/v1/space/course/blacklist/', { consumer_uid, reason });
  }

  public async removeGlobalBlacklist(consumer_uid: string): Promise<void> {
    return super.delete(`/api/v1/space/course/blacklist/${consumer_uid}/`);
  }

  // Consumer side
  public async mine(page: number = 1): Promise<PaginatedResponse<Classroom>> {
    return this.get<PaginatedResponse<Classroom>>(`/api/v1/space/course/classrooms/?page=${page}`);
  }

  public async getByTeacher(teacherId: string): Promise<Classroom[]> {
    return this.get<Classroom[]>(`/api/v1/consumer/course/classrooms/by-teacher/?teacher_id=${encodeURIComponent(teacherId)}`);
  }

  public async preview(uid: string): Promise<ClassroomPreviewResponse> {
    return this.get<ClassroomPreviewResponse>(`/api/v1/consumer/course/classrooms/${uid}/preview/`);
  }

  public async quickJoin(uid: string): Promise<{
    joined: boolean;
    requires_payment: boolean;
    membership_status: string;
    classroom_uid: string;
    amount?: number;
    order_id?: string;
    pay_url?: string;
    deeplink?: string;
    qr_code_url?: string;
  }> {
    return this.post('/api/v1/consumer/course/classrooms/quick-join/', { classroom_uid: uid });
  }

  public async favoriteToggle(uid: string): Promise<{ is_favorited: boolean; favorite_count: number }> {
    return this.post(`/api/v1/consumer/social/classrooms/${uid}/favorite/`);
  }

  public async getActivity(
    uid: string,
    level: 'major' | 'detail' = 'major',
    limit = 50,
    before?: string,
  ): Promise<ActivityLog[]> {
    const params = new URLSearchParams({ level, limit: String(limit) });
    if (before) params.set('before', before);
    return this.get<ActivityLog[]>(`/api/v1/space/course/classrooms/${uid}/activity/?${params}`);
  }
}

export const classroomApi = new ClassroomApiClient();
