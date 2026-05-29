import BaseRestApiClient from './client';
import type {
  FaceEnrollResponse,
  FaceEnrollStatusResponse,
  FaceVerifyResponse,
  FaceClassroomSessionResponse,
  FaceClassroomVerifyResponse,
} from './types';

export class FaceApiClient extends BaseRestApiClient {
  async enroll(image: string): Promise<FaceEnrollResponse> {
    return this.post<FaceEnrollResponse>('/api/v1/consumer/face/enroll/', { image });
  }

  async enrollmentStatus(): Promise<FaceEnrollStatusResponse> {
    return this.get<FaceEnrollStatusResponse>('/api/v1/consumer/face/enroll/');
  }

  async verify(examUid: string, image: string): Promise<FaceVerifyResponse> {
    return this.post<FaceVerifyResponse>(`/api/v1/consumer/face/exams/${examUid}/verify/`, { image });
  }

  async classroomSessionStatus(classroomUid: string): Promise<FaceClassroomSessionResponse> {
    return this.get<FaceClassroomSessionResponse>(`/api/v1/consumer/face/classrooms/${classroomUid}/verify/`);
  }

  async verifyForClassroom(classroomUid: string, image: string): Promise<FaceClassroomVerifyResponse> {
    return this.post<FaceClassroomVerifyResponse>(`/api/v1/consumer/face/classrooms/${classroomUid}/verify/`, { image });
  }
}

export const faceApi = new FaceApiClient();
