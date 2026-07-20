import BaseRestApiClient from '@/core/api/client';
import type {
  QuizCollection,
  QuizCollectionDetail,
  QuizCollectionProgress,
  IssuedCertificate,
} from '@lms/types';

export class ConsumerQuizCollectionApiClient extends BaseRestApiClient {
  public async list(): Promise<QuizCollection[]> {
    const response = await this.get<QuizCollection[] | { results: QuizCollection[] }>(
      '/api/v1/consumer/quiz-collection/'
    );
    return Array.isArray(response) ? response : response.results;
  }

  public async listByClassroom(classroomId: string): Promise<QuizCollection[]> {
    const response = await this.get<QuizCollection[] | { results: QuizCollection[] }>(
      `/api/v1/consumer/quiz-collection/?classroom_id=${encodeURIComponent(classroomId)}`
    );
    return Array.isArray(response) ? response : response.results;
  }

  public async retrieve(uid: string, classroomId?: string): Promise<QuizCollectionDetail> {
    const params = classroomId ? `?classroom_id=${encodeURIComponent(classroomId)}` : '';
    return this.get<QuizCollectionDetail>(
      `/api/v1/consumer/quiz-collection/${uid}/${params}`
    );
  }

  public async getProgress(uid: string, classroomId: string): Promise<QuizCollectionProgress> {
    return this.get<QuizCollectionProgress>(
      `/api/v1/consumer/quiz-collection/${uid}/progress/?classroom_id=${encodeURIComponent(classroomId)}`
    );
  }

  public async getCertificate(uid: string, classroomId: string): Promise<IssuedCertificate> {
    return this.get<IssuedCertificate>(
      `/api/v1/consumer/quiz-collection/${uid}/certificate/?classroom_id=${encodeURIComponent(classroomId)}`
    );
  }

  public async myCertificates(): Promise<IssuedCertificate[]> {
    const response = await this.get<IssuedCertificate[] | { results: IssuedCertificate[] }>(
      '/api/v1/consumer/quiz-collection/my-certificates/'
    );
    return Array.isArray(response) ? response : response.results;
  }

  public async deleteCollection(uid: string): Promise<void> {
    return this.delete<void>(`/api/v1/consumer/quiz-collection/${uid}/`);
  }

  public async assignToClassroom(uid: string, classroomId: string): Promise<QuizCollection> {
    return this.post<QuizCollection>(`/api/v1/consumer/quiz-collection/${uid}/assign/`, { classroom_id: classroomId });
  }
}

export const consumerQuizCollectionApi = new ConsumerQuizCollectionApiClient();
export const quizCollectionApi = consumerQuizCollectionApi;
export const certificateApi = {
  list: () => consumerQuizCollectionApi.myCertificates(),
  myCertificates: () => consumerQuizCollectionApi.myCertificates(),
};
