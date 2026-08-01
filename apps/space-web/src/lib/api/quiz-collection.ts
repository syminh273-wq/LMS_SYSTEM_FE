import AbstractRestApiClient from './client';
import type {
  QuizCollection,
  QuizCollectionDetail,
  CreateQuizCollectionRequest,
  UpdateQuizCollectionRequest,
  AddQuizToCollectionRequest,
  ReorderCollectionRequest,
  AssignCollectionRequest,
  QuizCollectionAssignment,
  Certificate,
  CreateCertificateRequest,
  UpdateCertificateRequest,
} from './types';

class QuizCollectionApiClient extends AbstractRestApiClient {
  public async list(): Promise<QuizCollection[]> {
    const response = await this.get<QuizCollection[] | { results: QuizCollection[] }>(
      '/api/v1/space/quiz-collection/'
    );
    return Array.isArray(response) ? response : response.results;
  }

  public async retrieve(uid: string): Promise<QuizCollectionDetail> {
    return this.get<QuizCollectionDetail>(`/api/v1/space/quiz-collection/${uid}/`);
  }

  public async create(data: CreateQuizCollectionRequest): Promise<QuizCollection> {
    return this.post<QuizCollection>('/api/v1/space/quiz-collection/', data);
  }

  public async update(uid: string, data: UpdateQuizCollectionRequest): Promise<QuizCollection> {
    return this.patch<QuizCollection>(`/api/v1/space/quiz-collection/${uid}/`, data);
  }

  public async deleteCollection(uid: string): Promise<void> {
    await super.delete(`/api/v1/space/quiz-collection/${uid}/`);
  }

  public async addItems(uid: string, data: AddQuizToCollectionRequest): Promise<{ added: string[] }> {
    return this.post<{ added: string[] }>(`/api/v1/space/quiz-collection/${uid}/items/`, data);
  }

  public async removeItem(uid: string, quizId: string): Promise<void> {
    return super.delete<void>(`/api/v1/space/quiz-collection/${uid}/items/${quizId}/`);
  }

  public async reorder(uid: string, data: ReorderCollectionRequest): Promise<void> {
    return this.patch<void>(`/api/v1/space/quiz-collection/${uid}/reorder/`, data);
  }

  public async assign(uid: string, data: AssignCollectionRequest): Promise<void> {
    return this.post<void>(`/api/v1/space/quiz-collection/${uid}/assign/`, data);
  }

  public async unassign(uid: string, classroomId: string): Promise<void> {
    return super.delete<void>(`/api/v1/space/quiz-collection/${uid}/assign/${classroomId}/`);
  }

  public async listAssignments(uid: string): Promise<QuizCollectionAssignment[]> {
    return this.get<QuizCollectionAssignment[]>(`/api/v1/space/quiz-collection/${uid}/assignments/`);
  }
}

export const quizCollectionApi = new QuizCollectionApiClient();

type CreateCertificatePayload = Omit<CreateCertificateRequest, 'template_url'> & {
  templateImage?: File | null;
  template_url?: string | null;
};

type UpdateCertificatePayload = Omit<UpdateCertificateRequest, 'template_url'> & {
  templateImage?: File | null;
  template_url?: string | null;
  clearTemplateImage?: boolean;
};

class CertificateApiClient extends AbstractRestApiClient {
  public async list(): Promise<Certificate[]> {
    const response = await this.get<Certificate[] | { results: Certificate[] }>(
      '/api/v1/space/certificate/'
    );
    return Array.isArray(response) ? response : response.results;
  }

  public async retrieve(uid: string): Promise<Certificate> {
    return this.get<Certificate>(`/api/v1/space/certificate/${uid}/`);
  }

  public async create(data: CreateCertificatePayload): Promise<Certificate> {
    return this.post<Certificate>('/api/v1/space/certificate/', this._buildPayload(data));
  }

  public async update(uid: string, data: UpdateCertificatePayload): Promise<Certificate> {
    return this.patch<Certificate>(`/api/v1/space/certificate/${uid}/`, this._buildPayload(data));
  }

  public async deleteCertificate(uid: string): Promise<void> {
    await super.delete(`/api/v1/space/certificate/${uid}/`);
  }

  private _buildPayload(data: CreateCertificatePayload | UpdateCertificatePayload): FormData {
    const fd = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'templateImage') {
        if (value instanceof File) fd.append('template_image', value);
        return;
      }
      if (key === 'clearTemplateImage') return;
      if (value === undefined) return;
      fd.append(key, value === null ? '' : String(value));
    });
    return fd;
  }
}

export const certificateApi = new CertificateApiClient();
