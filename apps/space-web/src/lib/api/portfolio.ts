import AbstractRestApiClient from './client';

type PortfolioKey =
  | 'intro'
  | 'certificate'
  | 'experience'
  | 'achievement'
  | 'course'
  | 'education';

export type PortfolioEntry = {
  uid: string;
  key: PortfolioKey;
  value: Record<string, unknown>;
  is_public: boolean;
  display_order: number;
  created_at: string | null;
  updated_at: string | null;
};

export type Portfolio = {
  intro: PortfolioEntry | null;
  certificate: PortfolioEntry[];
  experience: PortfolioEntry[];
  achievement: PortfolioEntry[];
  course: PortfolioEntry[];
  education: PortfolioEntry[];
};

export type PublicTeacher = {
  uid: string;
  full_name: string;
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  cover_url: string;
  avatar_url: string;
  portfolio: Portfolio;
};

type PortfolioUploadResult = {
  file_key: string;
  url: string;
};

class PortfolioApiClient extends AbstractRestApiClient {
  async getMine(): Promise<Portfolio> {
    return this.get<Portfolio>('/api/v1/portfolio/me/');
  }

  async getPublic(ownerType: 'space' | 'consumer', ownerId: string): Promise<Portfolio> {
    return this.get<Portfolio>(`/api/v1/portfolio/${ownerType}/${ownerId}/`);
  }

  async getPublicTeacher(uid: string): Promise<PublicTeacher> {
    return this.get<PublicTeacher>(`/api/v1/public/teachers/${uid}/`);
  }

  async bulkUpsert(entries: Array<{
    uid?: string;
    key: PortfolioKey;
    value: Record<string, unknown>;
    is_public?: boolean;
    display_order?: number;
  }>): Promise<Portfolio> {
    return this.patch<Portfolio>('/api/v1/portfolio/me/', { entries });
  }

  async upsertEntry(uid: string | null, payload: {
    key: PortfolioKey;
    value: Record<string, unknown>;
    is_public?: boolean;
    display_order?: number;
  }): Promise<PortfolioEntry> {
    const body: Record<string, unknown> = { ...payload };
    if (uid) body.uid = uid;
    if (uid) {
      return this.patch<PortfolioEntry>(`/api/v1/portfolio/me/entries/${uid}/`, body);
    }
    return this.post<PortfolioEntry>('/api/v1/portfolio/me/entries/', body);
  }

  async upsertEntryWithImage(
    uid: string | null,
    payload: {
      key: PortfolioKey;
      value: Record<string, unknown>;
      file: File;
      image_field?: string;
      is_public?: boolean;
      display_order?: number;
    },
  ): Promise<PortfolioEntry> {
    const form = new FormData();
    form.append('key', payload.key);
    form.append('value', JSON.stringify(payload.value));
    form.append('file', payload.file);
    if (payload.image_field) form.append('image_field', payload.image_field);
    if (payload.is_public !== undefined) form.append('is_public', String(payload.is_public));
    if (payload.display_order !== undefined) {
      form.append('display_order', String(payload.display_order));
    }
    if (uid) {
      return this.patch<PortfolioEntry>(`/api/v1/portfolio/me/entries/${uid}/`, form);
    }
    return this.post<PortfolioEntry>('/api/v1/portfolio/me/entries/', form);
  }

  async deleteEntry(uid: string): Promise<void> {
    return this.delete<void>(`/api/v1/portfolio/me/entries/${uid}/`);
  }

  async reorder(orders: Array<{ uid: string; display_order: number }>): Promise<Portfolio> {
    return this.patch<Portfolio>('/api/v1/portfolio/me/reorder/', { orders });
  }

  async uploadFile(file: File): Promise<PortfolioUploadResult> {
    const form = new FormData();
    form.append('file', file);
    return this.post<PortfolioUploadResult>('/api/v1/portfolio/me/upload/', form);
  }
}

export const portfolioApi = new PortfolioApiClient();
