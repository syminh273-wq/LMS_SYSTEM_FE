import BaseRestApiClient from './client';
import type { TeacherContact, StudentDetail } from './types';

export type StudentSearchResult = {
  id: string;
  teacher_id: string;
  consumer_uid: string;
  consumer_name: string;
  first_name: string;
  last_name: string;
  consumer_email: string;
  consumer_avatar: string;
  first_joined_at: number;
};

export type StudentSearchResponse = {
  total_hits: number;
  results: StudentSearchResult[];
  error?: string;
};

export class StudentApiClient extends BaseRestApiClient {
  /** All unique students who ever studied with the authenticated teacher. */
  async listMyStudents(): Promise<TeacherContact[]> {
    return this.get<TeacherContact[]>('/api/v1/space/course/students/');
  }

  /** Full-text search students scoped to this teacher (Typesense). */
  async searchStudents(q: string, options: { limit?: number; offset?: number } = {}): Promise<StudentSearchResponse> {
    const params = new URLSearchParams({ q });
    if (options.limit) params.set('limit', String(options.limit));
    if (options.offset) params.set('offset', String(options.offset));
    return this.get<StudentSearchResponse>(`/api/v1/space/course/students/search/?${params}`);
  }

  /** Student profile + classrooms (with stats) shared with this teacher. */
  async getStudentDetail(consumerUid: string): Promise<StudentDetail> {
    return this.get<StudentDetail>(`/api/v1/space/course/students/${consumerUid}/`);
  }

  /** Per-exam submissions for a student in a classroom (existing endpoint). */
  async getStudentSubmissions(classroomUid: string, consumerUid: string) {
    return this.get<{ exam: { uid: string; title: string; status: string; due_date: string | null }; submission: import('./types').ExamSubmission | null }[]>(
      `/api/v1/space/course/classrooms/${classroomUid}/members/${consumerUid}/submissions/`,
    );
  }
}

export const studentApi = new StudentApiClient();
