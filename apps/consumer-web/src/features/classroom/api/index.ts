import AbstractRestApiClient from '@/lib/api/client';
import type {
  ClassroomProps as ClassroomType,
  ClassroomPreviewResponse,
  Conversation,
  Exam,
  ExamSubmission,
  LeaderboardResponse,
  Message,
  PaginatedResponse,
  SubmitExamFormProps,
} from '@/lib/api/types';
import type { JoinHistoryItemProps } from '@/features/classroom/types';

class ClassroomAPI extends AbstractRestApiClient {
  constructor() {
    super();
  }

  public async getClassrooms(page: number = 1): Promise<PaginatedResponse<ClassroomType>> {
    return this.get<PaginatedResponse<ClassroomType>>(`/api/v1/space/course/classrooms/?page=${page}`);
  }

  public async getClassroom(uid: string): Promise<ClassroomType> {
    return this.get<ClassroomType>(`/api/v1/consumer/course/classrooms/${uid}/`);
  }

  public async getMyClassrooms(page: number = 1): Promise<PaginatedResponse<ClassroomType>> {
    return this.get<PaginatedResponse<ClassroomType>>(`/api/v1/consumer/course/classrooms/?page=${page}`);
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

  public async getClassroomLeaderboard(uid: string, limit: number = 10): Promise<LeaderboardResponse> {
    return this.get<LeaderboardResponse>(`/api/v1/consumer/ranking/classrooms/${uid}/leaderboard/?limit=${limit}`);
  }

  public async getClassroomPreview(uid: string): Promise<ClassroomPreviewResponse> {
    return this.get<ClassroomPreviewResponse>(`/api/v1/consumer/course/classrooms/${uid}/preview/`);
  }

  public async toggleFavorite(uid: string): Promise<{ is_favorited: boolean; favorite_count: number }> {
    return this.post(`/api/v1/consumer/social/classrooms/${uid}/favorite/`);
  }

  public async getFavorites(page: number = 1): Promise<PaginatedResponse<{ classroom: ClassroomType; created_at: string }>> {
    return this.get(`/api/v1/consumer/social/classrooms/favorites/?page=${page}`);
  }

  public async getClassroomExams(uid: string): Promise<Exam[]> {
    const response = await this.get<Exam[] | { results: Exam[] }>(
      `/api/v1/consumer/course/classrooms/${uid}/exams/`
    );
    return Array.isArray(response) ? response : response.results;
  }

  public async getExam(examUid: string): Promise<Exam> {
    return this.get<Exam>(`/api/v1/consumer/course/exams/${examUid}/`);
  }

  public async getClassroomAssignments(uid: string): Promise<Exam[]> {
    const response = await this.get<Exam[] | { results: Exam[] }>(
      `/api/v1/consumer/course/classrooms/${uid}/assignments/`
    );
    return Array.isArray(response) ? response : response.results;
  }

  public async getExamQuestions(examUid: string, options?: RequestInit): Promise<{
    exam_uid: string;
    title: string;
    total_questions: number;
    duration_seconds?: number;
    max_grade: number;
    questions: Array<{
      uid: string;
      question_text: string;
      options: string[];
      question_type: 'single_answer' | 'multi_answer';
      order: number;
    }>;
  }> {
    return this.get<any>(`/api/v1/consumer/course/exams/${examUid}/questions/`, options);
  }

  public async submitExam(examUid: string, data: SubmitExamFormProps): Promise<ExamSubmission> {
    return this.post<ExamSubmission>(`/api/v1/consumer/course/exams/${examUid}/submissions/`, data);
  }

  public async getClassroomsByTeacher(teacherId: string): Promise<ClassroomType[]> {
    return this.get<ClassroomType[]>(`/api/v1/consumer/course/classrooms/by-teacher/?teacher_id=${encodeURIComponent(teacherId)}`);
  }

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

export const classroomApi = new ClassroomAPI();
export type ClassroomProps = ClassroomType;
