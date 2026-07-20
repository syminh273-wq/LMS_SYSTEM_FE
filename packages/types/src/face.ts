export type FaceClassroomSessionResponse = {
  is_verified: boolean;
  verified_at: string | null;
};

export type FaceClassroomVerifyResponse = {
  camera_open: boolean;
  recognized: boolean;
  multiple_faces: boolean;
  face_count: number;
  similarity: number;
  is_verified: boolean;
  error?: string;
};

export type FaceEnrollResponse = {
  message: string;
  enrolled_at: string;
};

export type FaceEnrollStatusResponse = {
  enrolled: boolean;
};

export type FaceVerifyResponse = {
  camera_open: boolean;
  recognized: boolean;
  multiple_faces: boolean;
  face_count: number;
  similarity: number;
  error?: string;
};
