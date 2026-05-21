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

  public async joinByCode(code: string): Promise<Classroom> {
    return this.post<Classroom>('/api/v1/consumer/course/classrooms/join/', { code });
  }

  public async getConversation(uid: string): Promise<Conversation> {
    return this.get<Conversation>(`/api/v1/consumer/course/classrooms/${uid}/conversation/`);
  }

  public async exams(uid: string): Promise<Exam[]> {
    const response = await this.get<Exam[] | { results: Exam[] }>(
      `/api/v1/consumer/course/classrooms/${uid}/exams/`
    );
    const exams = Array.isArray(response) ? response : response.results ?? [];

    return exams.filter((exam) => !exam.classroom_id || String(exam.classroom_id) === uid);
  }

  public async examSubmission(classroomUid: string, examUid: string): Promise<ExamSubmission> {
    return this.get<ExamSubmission>(
      `/api/v1/consumer/course/classrooms/${classroomUid}/exams/${examUid}/submission/`
    );
  }

  public async submitExam(classroomUid: string, examUid: string, data: SubmitExamRequest | FormData): Promise<ExamSubmission> {
    return this.post<ExamSubmission>(
      `/api/v1/consumer/course/classrooms/${classroomUid}/exams/${examUid}/submission/`,
      data
    );
  }

  // ── Chat ───────────────────────────────────────────────────────────────────
  public async getMessages(conversationUid: string, limit = 10, beforeUid?: string): Promise<{ results: Message[]; has_more: boolean }> {
    const params = new URLSearchParams({ conversation_uid: conversationUid, limit: String(limit) });
    if (beforeUid) params.set('before_uid', beforeUid);
    return this.get<{ results: Message[]; has_more: boolean }>(`/api/v1/chat/messages/?${params}`);
  }
}

export const classroomApi = new ClassroomApiClient();
