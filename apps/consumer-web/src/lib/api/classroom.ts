import BaseRestApiClient from './client';
import type {
  Classroom as ClassroomType,
  ClassroomPreviewResponse,
  Conversation,
  Exam,
  ExamSubmission,
  LeaderboardEntry,
  LeaderboardResponse,
  Message,
  PaginatedResponse,
  CreateClassroomRequest,
  SharingLink,
  SubmitExamRequest,
  UploadedResource,
} from './types';

export type JoinHistoryItem = {
  classroom_uid: string;
  classroom_name: string;
  teacher_name: string;
  role: string;
  status: 'pending' | 'approved' | string;
  is_deleted: boolean;
  has_paid: boolean;
  joined_at?: string | null;
  paid_at?: string | null;
};

class ClassroomApiClient extends BaseRestApiClient {
  constructor() {
    super();
  }

  // ── Space (teacher) endpoints ──────────────────────────────────────────────
  public async list(page: number = 1): Promise<PaginatedResponse<ClassroomType>> {
    return this.get<PaginatedResponse<Classroom>>(`/api/v1/space/course/classrooms/?page=${page}`);
  }

  public async create(data: CreateClassroomRequest): Promise<ClassroomType> {
    return this.post<Classroom>('/api/v1/space/course/classrooms/', data);
  }

  public async getSharingLink(uid: string): Promise<SharingLink> {
    return this.get<SharingLink>(`/api/v1/space/course/classrooms/${uid}/sharing_link/`);
  }

  // ── Consumer (student) endpoints ───────────────────────────────────────────
  public async retrieve(uid: string): Promise<ClassroomType> {
    return this.get<Classroom>(`/api/v1/consumer/course/classrooms/${uid}/`);
  }

  public async mine(page: number = 1): Promise<PaginatedResponse<ClassroomType>> {
    return this.get<PaginatedResponse<Classroom>>(`/api/v1/consumer/course/classrooms/?page=${page}`);
  }

  public async discover(params: {
    category?: string;
    pricing_type?: 'free' | 'paid';
    search?: string;
    page?: number;
  } = {}): Promise<PaginatedResponse<ClassroomType & { is_joined?: boolean; has_paid?: boolean }>> {
    const search = new URLSearchParams();
    if (params.category) search.set('category', params.category);
    if (params.pricing_type) search.set('pricing_type', params.pricing_type);
    if (params.search) search.set('search', params.search);
    search.set('page', String(params.page ?? 1));
    return this.get(`/api/v1/consumer/course/classrooms/discover/?${search.toString()}`);
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

  public async joinByCode(code: string): Promise<{
    requires_payment: boolean;
    membership_status: string;
    classroom_uid?: string;
    amount?: number;
    order_id?: string;
    pay_url?: string;
    deeplink?: string;
    qr_code_url?: string;
    message?: string;
  }> {
    return this.post('/api/v1/consumer/course/classrooms/join/', { code });
  }

  public async checkout(uid: string): Promise<{
    classroom_uid: string;
    amount: number;
    order_id: string;
    pay_url: string;
    deeplink?: string;
    qr_code_url?: string;
  }> {
    return this.post(`/api/v1/consumer/course/classrooms/${uid}/checkout/`);
  }

  public async getJoinHistory(limit: number = 50): Promise<JoinHistoryItem[]> {
    const sp = new URLSearchParams();
    sp.set('limit', String(limit));
    return this.get<JoinHistoryItem[]>(`/api/v1/consumer/course/classrooms/me/history/?${sp.toString()}`);
  }

  public async access(uid: string): Promise<{
    classroom_uid: string;
    pricing_type: 'free' | 'paid';
    is_paid_classroom: boolean;
    has_access: boolean;
    has_paid: boolean;
    membership_status: string | null;
    pending_payment: { order_id: string; pay_url: string; amount: number } | null;
  }> {
    return this.get(`/api/v1/consumer/course/classrooms/${uid}/access/`);
  }

  public async leaderboard(uid: string, limit: number = 10): Promise<LeaderboardResponse> {
    return this.get<LeaderboardResponse>(`/api/v1/consumer/ranking/classrooms/${uid}/leaderboard/?limit=${limit}`);
  }

  public async preview(uid: string): Promise<ClassroomPreviewResponse> {
    return this.get<ClassroomPreviewResponse>(`/api/v1/consumer/course/classrooms/${uid}/preview/`);
  }

  public async favoriteToggle(uid: string): Promise<{ is_favorited: boolean; favorite_count: number }> {
    return this.post(`/api/v1/consumer/social/classrooms/${uid}/favorite/`);
  }

  public async favoriteStatus(uid: string): Promise<{ is_favorited: boolean; favorite_count: number }> {
    return this.get(`/api/v1/consumer/social/classrooms/${uid}/favorite/status/`);
  }

  public async favorites(page: number = 1): Promise<PaginatedResponse<{ classroom: ClassroomType; created_at: string }>> {
    return this.get(`/api/v1/consumer/social/classrooms/favorites/?page=${page}`);
  }

  public async exams(uid: string): Promise<Exam[]> {
    const response = await this.get<Exam[] | { results: Exam[] }>(
      `/api/v1/consumer/course/classrooms/${uid}/exams/`
    );
    return Array.isArray(response) ? response : response.results;
  }

  public async examSubmission(examUid: string): Promise<ExamSubmission> {
    return this.get<ExamSubmission>(`/api/v1/consumer/course/exams/${examUid}/submissions/me/`);
  }

  public async examQuestions(examUid: string, options?: RequestInit): Promise<{
    exam_uid: string;
    title: string;
    total_questions: number;
    duration_seconds?: number;
    max_grade: number;
    questions: Array<{
      uid: string;
      question_text: string;
      option_a: string;
      option_b: string;
      option_c: string;
      option_d: string;
      order: number;
    }>;
  }> {
    return this.get<any>(`/api/v1/consumer/course/exams/${examUid}/questions/`, options);
  }

  public async submitExam(examUid: string, data: SubmitExamRequest): Promise<ExamSubmission> {
    return this.post<ExamSubmission>(`/api/v1/consumer/course/exams/${examUid}/submissions/`, data);
  }

  public async uploadSubmissionResource(data: FormData): Promise<UploadedResource> {
    return this.post<UploadedResource>('/api/v1/resource/upload/', data);
  }

  public async reuploadSubmissionResource(resourceUid: string, data: FormData): Promise<UploadedResource> {
    return this.patch<UploadedResource>(`/api/v1/resource/${resourceUid}/reupload/`, data);
  }

  public async getByTeacher(teacherId: string): Promise<ClassroomType[]> {
    return this.get<Classroom[]>(`/api/v1/consumer/course/classrooms/by-teacher/?teacher_id=${encodeURIComponent(teacherId)}`);
  }

  // ── Chat ───────────────────────────────────────────────────────────────────
  public async getConversation(classroomUid: string): Promise<Conversation> {
    const list = await this.get<Conversation[]>(
      `/api/v1/chat/conversations/?classroom_uid=${classroomUid}`
    );
    return list[0];
  }

  public async getMessages(conversationUid: string, limit = 10, beforeUid?: string): Promise<{ results: Message[]; has_more: boolean }> {
    const params = new URLSearchParams({ conversation_uid: conversationUid, limit: String(limit) });
    if (beforeUid) params.set('before_uid', beforeUid);
    return this.get<{ results: Message[]; has_more: boolean }>(`/api/v1/chat/messages/?${params}`);
  }
}

export const classroomApi = new ClassroomApiClient();
export type Classroom = ClassroomType;
