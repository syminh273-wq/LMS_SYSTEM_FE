import BaseRestApiClient from './client';
import type {
  Course,
  CourseLesson,
  CreateCourseRequest,
  UpdateCourseRequest,
  CreateLessonRequest,
  UpdateLessonRequest,
  ReorderLessonItem,
  CourseEnrollment,
  CourseStats,
  PaginatedResponse,
} from './types';

class CourseApiClient extends BaseRestApiClient {
  public async list(page: number = 1): Promise<PaginatedResponse<Course>> {
    return this.get<PaginatedResponse<Course>>(`/api/v1/space/course/courses/?page=${page}`);
  }

  public async create(data: CreateCourseRequest): Promise<Course> {
    return this.post<Course>('/api/v1/space/course/courses/', data);
  }

  public async retrieve(uid: string): Promise<Course> {
    return this.get<Course>(`/api/v1/space/course/courses/${uid}/`);
  }

  public async update(uid: string, data: UpdateCourseRequest): Promise<Course> {
    return this.patch<Course>(`/api/v1/space/course/courses/${uid}/`, data);
  }

  public async delete(uid: string): Promise<void> {
    return super.delete(`/api/v1/space/course/courses/${uid}/`);
  }

  public async publish(uid: string): Promise<Course> {
    return this.post<Course>(`/api/v1/space/course/courses/${uid}/publish/`, {});
  }

  public async unpublish(uid: string): Promise<Course> {
    return this.post<Course>(`/api/v1/space/course/courses/${uid}/unpublish/`, {});
  }

  public async stats(uid: string): Promise<CourseStats> {
    return this.get<CourseStats>(`/api/v1/space/course/courses/${uid}/stats/`);
  }

  public async enrollments(uid: string): Promise<CourseEnrollment[]> {
    return this.get<CourseEnrollment[]>(`/api/v1/space/course/courses/${uid}/enrollments/`);
  }

  public async sharingLink(uid: string) {
    return this.get(`/api/v1/space/course/courses/${uid}/sharing_link/`);
  }

  // ── Lessons ─────────────────────────────────────────────────────────────

  public async lessons(uid: string): Promise<CourseLesson[]> {
    return this.get<CourseLesson[]>(`/api/v1/space/course/courses/${uid}/lessons/`);
  }

  public async createLesson(uid: string, data: CreateLessonRequest): Promise<CourseLesson> {
    return this.post<CourseLesson>(`/api/v1/space/course/courses/${uid}/lessons/`, data);
  }

  public async updateLesson(
    courseUid: string,
    lessonUid: string,
    data: UpdateLessonRequest,
  ): Promise<CourseLesson> {
    return this.patch<CourseLesson>(
      `/api/v1/space/course/courses/${courseUid}/lessons/${lessonUid}/`,
      data,
    );
  }

  public async deleteLesson(courseUid: string, lessonUid: string): Promise<void> {
    return super.delete(`/api/v1/space/course/courses/${courseUid}/lessons/${lessonUid}/`);
  }

  public async reorderLessons(courseUid: string, items: ReorderLessonItem[]): Promise<CourseLesson[]> {
    return this.post<CourseLesson[]>(
      `/api/v1/space/course/courses/${courseUid}/lessons/reorder/`,
      { items },
    );
  }
}

export const courseApi = new CourseApiClient();
