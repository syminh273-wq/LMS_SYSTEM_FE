import BaseRestApiClient from './client';

export type IssuedCertificateItem = {
  uid: string;
  title?: string;
  description?: string;
  collection_title?: string;
  collection_description?: string;
  classroom_name?: string;
  student_name?: string;
  pdf_url?: string | null;
  verification_code: string;
  issued_at?: string | null;
  template_url?: string | null;
};

class CertificateApiClient extends BaseRestApiClient {
  async getMyIssued(): Promise<IssuedCertificateItem[]> {
    return this.get<IssuedCertificateItem[]>(
      '/api/v1/consumer/quiz-collection/my-certificates/'
    );
  }
}

export const certificateApi = new CertificateApiClient();
