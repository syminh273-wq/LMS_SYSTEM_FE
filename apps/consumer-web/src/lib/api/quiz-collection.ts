import AbstractRestApiClient from './client';
import type {
  QuizCollection,
  QuizCollectionDetail,
  IssuedCertificate,
} from './types';

class ConsumerQuizCollectionApiClient extends AbstractRestApiClient {
  public async listByClassroom(classroomId: string): Promise<QuizCollection[]> {
    const response = await this.get<QuizCollection[] | { results: QuizCollection[] }>(
      `/api/v1/consumer/quiz-collection/?classroom_id=${encodeURIComponent(classroomId)}`
    );
    return Array.isArray(response) ? response : response.results;
  }

  public async retrieve(uid: string, classroomId: string): Promise<QuizCollectionDetail> {
    return this.get<QuizCollectionDetail>(
      `/api/v1/consumer/quiz-collection/${uid}/?classroom_id=${encodeURIComponent(classroomId)}`
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
}

export const consumerQuizCollectionApi = new ConsumerQuizCollectionApiClient();
