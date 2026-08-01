import AbstractRestApiClient from './client';
import type {
  Course,
  CourseEnrolled,
  CourseLesson,
  CoursePreview,
  EnrollResponse,
  AccessResponse,
  CheckoutResponse,
  PaginatedResponse,
} from './types';

class ConsumerCourseApiClient extends AbstractRestApiClient {
  public async mine(page: number = 1): Promise<PaginatedResponse<CourseEnrolled>> {
    return this.get<PaginatedResponse<CourseEnrolled>>(
      `/api/v1/consumer/course/courses/mine/?page=${page}`,
    );
  }

  public async retrieve(uid: string): Promise<Course> {
    return this.get<Course>(`/api/v1/consumer/course/courses/${uid}/`);
  }

  public async enroll(uid: string): Promise<EnrollResponse> {
    return this.post<EnrollResponse>(`/api/v1/consumer/course/courses/${uid}/enroll/`, {});
  }

  public async checkout(uid: string): Promise<CheckoutResponse> {
    return this.post<CheckoutResponse>(
      `/api/v1/consumer/course/courses/${uid}/checkout/`,
      {},
    );
  }

  public async access(uid: string): Promise<AccessResponse> {
    return this.get<AccessResponse>(`/api/v1/consumer/course/courses/${uid}/access/`);
  }

  public async lessons(uid: string): Promise<CourseLesson[]> {
    return this.get<CourseLesson[]>(`/api/v1/consumer/course/courses/${uid}/lessons/`);
  }

  /**
   * Public preview endpoint — does NOT require auth.
   * Uses raw fetch to avoid triggering the client-side 401 redirect on a public route.
   */
  public async previewByCode(code: string): Promise<CoursePreview> {
    const baseURL = this.baseURL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const res = await fetch(`${baseURL}/api/v1/public/course/preview/${code}/`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không tìm thấy khóa học.');
    }
    return res.json();
  }
}

export const consumerCourseApi = new ConsumerCourseApiClient();
