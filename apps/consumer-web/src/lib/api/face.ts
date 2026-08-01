import AbstractRestApiClient from './client';
import type {
  FaceEnrollResponse,
  FaceEnrollStatusResponse,
} from './types';

class FaceApiClient extends AbstractRestApiClient {
  async enroll(image: string): Promise<FaceEnrollResponse> {
    return this.post<FaceEnrollResponse>('/api/v1/consumer/face/enroll/', { image });
  }

  async enrollmentStatus(): Promise<FaceEnrollStatusResponse> {
    return this.get<FaceEnrollStatusResponse>('/api/v1/consumer/face/enroll/');
  }
}

export const faceApi = new FaceApiClient();
