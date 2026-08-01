import AbstractRestApiClient from '@/lib/api/client';
import type {
  ClassroomProps,
  ClassroomMemberProps,
  ClassroomPreviewResponse,
  StudentExamRecord,
  PaginatedResponse,
  CreateClassroomRequest,
  UpdateClassroomRequest,
  SharingLink,
  ActivityLog,
  BlacklistEntry,
} from '@/lib/api/types';

class ClassroomAPI extends AbstractRestApiClient {
  constructor() {
    super();
  }

  public async getClassrooms(page: number = 1): Promise<PaginatedResponse<ClassroomProps>> {
    return this.get<PaginatedResponse<ClassroomProps>>(`/api/v1/space/course/classrooms/?page=${page}`);
  }

  public async createClassroom(data: CreateClassroomRequest): Promise<ClassroomProps> {
    return this.post<ClassroomProps>('/api/v1/space/course/classrooms/', data);
  }

  public async getClassroom(uid: string): Promise<ClassroomProps> {
    return this.get<ClassroomProps>(`/api/v1/space/course/classrooms/${uid}/`);
  }

  public async updateClassroom(uid: string, data: UpdateClassroomRequest): Promise<ClassroomProps> {
    return this.patch<ClassroomProps>(`/api/v1/space/course/classrooms/${uid}/`, data);
  }

  public async deleteClassroom<TResponse = any>(uid: string, options?: RequestInit): Promise<TResponse> {
    return super.delete<TResponse>(`/api/v1/space/course/classrooms/${uid}/`, options);
  }

  public async getClassroomSharingLink(uid: string): Promise<SharingLink> {
    return this.get<SharingLink>(`/api/v1/space/course/classrooms/${uid}/sharing_link/`);
  }

  public async getClassroomMembers(uid: string): Promise<ClassroomMemberProps[]> {
    return this.get<ClassroomMemberProps[]>(`/api/v1/space/course/classrooms/${uid}/members/`);
  }

  public async getPendingMembers(uid: string): Promise<ClassroomMemberProps[]> {
    return this.get<ClassroomMemberProps[]>(`/api/v1/space/course/classrooms/${uid}/members/?status=pending`);
  }

  public async approveClassroomMember(classroomUid: string, memberId: string): Promise<ClassroomMemberProps> {
    return this.post<ClassroomMemberProps>(`/api/v1/space/course/classrooms/${classroomUid}/members/${memberId}/approve/`);
  }

  public async rejectClassroomMember(classroomUid: string, memberId: string): Promise<void> {
    return super.delete(`/api/v1/space/course/classrooms/${classroomUid}/members/${memberId}/reject/`);
  }

  public async kickClassroomMember(classroomUid: string, memberId: string): Promise<void> {
    return super.delete(`/api/v1/space/course/classrooms/${classroomUid}/members/${memberId}/kick/`);
  }

  public async getStudentSubmissions(classroomUid: string, memberId: string): Promise<StudentExamRecord[]> {
    return this.get(`/api/v1/space/course/classrooms/${classroomUid}/members/${memberId}/submissions/`);
  }

  public async getClassroomBlacklist(uid: string): Promise<BlacklistEntry[]> {
    return this.get<BlacklistEntry[]>(`/api/v1/space/course/classrooms/${uid}/blacklist/`);
  }

  public async addToClassroomBlacklist(uid: string, consumer_uid: string, reason = ''): Promise<BlacklistEntry> {
    return this.post<BlacklistEntry>(`/api/v1/space/course/classrooms/${uid}/blacklist/`, { consumer_uid, reason });
  }

  public async removeFromClassroomBlacklist(uid: string, consumer_uid: string): Promise<void> {
    return super.delete(`/api/v1/space/course/classrooms/${uid}/blacklist/${consumer_uid}/`);
  }

  public async getGlobalBlacklist(): Promise<BlacklistEntry[]> {
    return this.get<BlacklistEntry[]>('/api/v1/space/course/blacklist/');
  }

  public async addToGlobalBlacklist(consumer_uid: string, reason = ''): Promise<BlacklistEntry> {
    return this.post<BlacklistEntry>('/api/v1/space/course/blacklist/', { consumer_uid, reason });
  }

  public async removeFromGlobalBlacklist(consumer_uid: string): Promise<void> {
    return super.delete(`/api/v1/space/course/blacklist/${consumer_uid}/`);
  }

  public async getMyClassrooms(page: number = 1): Promise<PaginatedResponse<ClassroomProps>> {
    return this.get<PaginatedResponse<ClassroomProps>>(`/api/v1/space/course/classrooms/?page=${page}`);
  }

  public async getClassroomsByTeacher(teacherId: string): Promise<ClassroomProps[]> {
    return this.get<ClassroomProps[]>(`/api/v1/consumer/course/classrooms/by-teacher/?teacher_id=${encodeURIComponent(teacherId)}`);
  }

  public async getClassroomPreview(uid: string): Promise<ClassroomPreviewResponse> {
    return this.get<ClassroomPreviewResponse>(`/api/v1/consumer/course/classrooms/${uid}/preview/`);
  }

  public async joinClassroomQuickly(uid: string): Promise<{
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

  public async toggleFavorite(uid: string): Promise<{ is_favorited: boolean; favorite_count: number }> {
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

export const classroomApi = new ClassroomAPI();
