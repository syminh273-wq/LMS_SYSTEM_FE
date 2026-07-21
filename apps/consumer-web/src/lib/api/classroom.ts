import BaseRestApiClient from './client';
import type {
  Classroom,
  Conversation,
  Exam,
  ExamSubmission,
  Message,
  PaginatedResponse,
  CreateClassroomRequest,
  SharingLink,
  SubmitExamRequest,
  UploadedResource,
} from './types';

export class ClassroomApiClient extends BaseRestApiClient {
  constructor() {
    super();
  }

  // ── Space (teacher) endpoints ──────────────────────────────────────────────
  public async list(page: number = 1): Promise<PaginatedResponse<Classroom>> {
    return this.get<PaginatedResponse<Classroom>>(`/api/v1/space/course/classrooms/?page=${page}`);
  }

  public async create(data: CreateClassroomRequest): Promise<Classroom> {
    return this.post<Classroom>('/api/v1/space/course/classrooms/', data);
  }

  public async getSharingLink(uid: string): Promise<SharingLink> {
    return this.get<SharingLink>(`/api/v1/space/course/classrooms/${uid}/sharing_link/`);
  }

  // ── Consumer (student) endpoints ───────────────────────────────────────────
  public async retrieve(uid: string): Promise<Classroom> {
    return this.get<Classroom>(`/api/v1/consumer/course/classrooms/${uid}/`);
  }

  public async mine(page: number = 1): Promise<PaginatedResponse<Classroom>> {
    return this.get<PaginatedResponse<Classroom>>(`/api/v1/consumer/course/classrooms/?page=${page}`);
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

  public async lessons(uid: string): Promise<{
    lessons: Array<{
      uid: string;
      course_uid: string;
      title: string;
      description: string;
      video_url: string | null;
      material_urls: Array<{ uid: string; name: string; url: string; file_type: string }>;
      order_index: number;
      duration_seconds: number;
      is_preview: boolean;
      is_published: boolean;
      created_at: string;
      updated_at: string;
    }>;
    pricing_type: 'free' | 'paid';
    is_locked: boolean;
    is_paid_member: boolean;
  }> {
    return this.get(`/api/v1/consumer/course/classrooms/${uid}/lessons/`);
  }

  public async getConversation(uid: string): Promise<Conversation> {
    return this.get<Conversation>(`/api/v1/consumer/course/classrooms/${uid}/conversation/`);
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

  // ── Chat ───────────────────────────────────────────────────────────────────
  public async getMessages(conversationUid: string, limit = 10, beforeUid?: string): Promise<{ results: Message[]; has_more: boolean }> {
    const params = new URLSearchParams({ conversation_uid: conversationUid, limit: String(limit) });
    if (beforeUid) params.set('before_uid', beforeUid);
    return this.get<{ results: Message[]; has_more: boolean }>(`/api/v1/chat/messages/?${params}`);
  }
}

export const classroomApi = new ClassroomApiClient();
