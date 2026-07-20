export interface FaceClassroomSessionResponse {
  is_verified: boolean;
  verified_at: string | null;
}

export interface FaceClassroomVerifyResponse {
  camera_open: boolean;
  recognized: boolean;
  multiple_faces: boolean;
  face_count: number;
  similarity: number;
  is_verified: boolean;
  error?: string;
}

export interface FaceEnrollResponse {
  message: string;
  enrolled_at: string;
}

export interface FaceEnrollStatusResponse {
  enrolled: boolean;
}

export interface FaceVerifyResponse {
  camera_open: boolean;
  recognized: boolean;
  multiple_faces: boolean;
  face_count: number;
  similarity: number;
  error?: string;
}
